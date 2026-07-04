# Kompilot — Architecture Technique & Spécifications (Septembre 2026)

> Stack : Node.js (Hono on Cloudflare Workers) + SQLite (Turso/Blink DB) + Stripe + Blink SDK

---

## 1. ARCHITECTURE ASYNCHRONE — FILES D'ATTENTE

### 1.1 Problème

Les tâches lourdes (génération vidéo Luma AI, scraping SerpApi/AIO Sync, export Meta Campaign) provoquent des timeouts HTTP (>60s Cloudflare Workers limit). L'UI doit rester "frictionless" : l'utilisateur lance une tâche et reçoit le résultat dès qu'il est prêt.

### 1.2 Solution : Blink Queue (déjà intégré)

Kompilot utilise `blink.queue` (BullMQ-like sur CF Workers) — déjà en production.

**Cycle de vie d'une tâche :**

```
Utilisateur → "Générer vidéo"
    ↓
Frontend → POST /api/creative/generate
    ↓
Backend → blink.queue.enqueue('video-generation', payload, { maxRetries: 3 })
    ↓
Queue Worker (background) → Appel Luma AI (30-90s)
    ↓
Worker → Met à jour la DB : status='completed', video_url=...
    ↓
Frontend → Poll ou SSE → UI se met à jour automatiquement
```

**Tables de suivi existantes :**

- `_blink_queues` : Nom, parallélisme
- `_blink_tasks` : ID, payload, status (pending/processing/completed/failed/dead), résultat, erreur, tentatives
- `_blink_schedules` : Cron jobs récurrents (rapports hebdo, AIO sync)

### 1.3 Politique de retry & Dead Letter Queue

```typescript
// Configuration par queue
await blink.queue.createQueue('video-generation', { parallelism: 3 });
await blink.queue.createQueue('aio-sync', { parallelism: 5 });
await blink.queue.createQueue('campaign-export', { parallelism: 2 });

// Enqueue avec retry policy
await blink.queue.enqueue('video-generation', {
  userId: user.id,
  prompt: data.prompt,
  aspectRatio: '9:16',
}, {
  maxRetries: 3,
  taskName: 'luma-video-gen',
});
```

**Retry policy :**
- Tentative 1 : immédiat
- Tentative 2 : +30s
- Tentative 3 : +120s
- Échec 3 → status `dead` → alerte Slack `#ops-alerts`
- Dead tasks récupérables manuellement via `blink.queue.retryDead(taskId)`

### 1.4 Notifications temps réel

**Option A — Polling intelligent (recommandé pour MVP) :**
```typescript
// Frontend poll toutes les 3s quand une tâche est en cours
const { data: task } = useQuery({
  queryKey: ['task', taskId],
  queryFn: () => blink.db.table('_blink_tasks').get(taskId),
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    return status === 'completed' || status === 'failed' ? false : 3000;
  },
});
```

**Option B — SSE (pour les tâches très longues) :**
- Endpoint backend SSE qui pousse les updates de statut
- Le frontend s'abonne au canal `task:{taskId}`
- Déconnexion automatique après status terminal

### 1.5 Queues recommandées

| Queue | Parallélisme | Tâches | Timeout |
|-------|-------------|--------|---------|
| `video-generation` | 3 | Luma AI, Kling | 120s |
| `aio-sync` | 5 | SerpApi, scraping | 60s |
| `campaign-export` | 2 | Meta Campaign Export | 45s |
| `email-sending` | 10 | Séquences email | 30s |
| `weekly-report` | 5 | Rapports hebdo | 90s |
| `geo-scan` | 3 | Scans locaux profonds | 45s |

---

## 2. GESTION DES QUOTAS & PROTECTION DES MARGES

### 2.1 Hard Caps — Logique de crédit

Pendant l'essai gratuit (7 jours), l'utilisateur a accès au plan Agency (149€). Sans limites, les coûts API (Luma ~0.05€/vidéo, SerpApi ~0.01€/query) détruiraient la marge.

**Stratégie : Crédits virtuels consommables**

| Ressource | Starter (69€) | Agency (149€) | Essai Gratuit (7j) |
|-----------|--------------|---------------|---------------------|
| Vidéos IA / mois | 10 | 50 | 15 |
| AIO Sync / mois | 100 | 500 | 100 |
| Posts générés / mois | 50 | 200 | 50 |
| SMS envoyés / mois | 50 | 200 | 50 |
| Emails envoyés / mois | 100 | 500 | 100 |

### 2.2 Schema SQL — Table de quotas

```sql
CREATE TABLE IF NOT EXISTS user_credit_quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'STARTER',
  
  -- Consommation mensuelle
  video_used_this_month INTEGER NOT NULL DEFAULT 0,
  video_limit_monthly INTEGER NOT NULL DEFAULT 10,
  
  aio_sync_used_this_month INTEGER NOT NULL DEFAULT 0,
  aio_sync_limit_monthly INTEGER NOT NULL DEFAULT 100,
  
  posts_generated_this_month INTEGER NOT NULL DEFAULT 0,
  posts_limit_monthly INTEGER NOT NULL DEFAULT 50,
  
  sms_used_this_month INTEGER NOT NULL DEFAULT 50,
  sms_limit_monthly INTEGER NOT NULL DEFAULT 50,
  
  email_used_this_month INTEGER NOT NULL DEFAULT 100,
  email_limit_monthly INTEGER NOT NULL DEFAULT 100,
  
  -- Blocage
  is_blocked INTEGER NOT NULL DEFAULT 0,
  blocked_reason TEXT DEFAULT '',
  blocked_at TEXT,
  
  -- Rafraîchissement
  current_month TEXT NOT NULL,  -- Format: '2026-09'
  last_video_sent_at TEXT,
  last_sms_sent_at TEXT,
  last_email_sent_at TEXT,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 Middleware de vérification (déjà implémenté)

```typescript
// backend/lib/quotaMiddleware.ts
export async function checkQuota(userId: string, resource: string): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const quota = await db.table('user_credit_quotas').get({ userId });
  if (!quota) return { allowed: true, remaining: 999 }; // pas de quota = illimité
  
  const used = quota[`${resource}_used_this_month`] || 0;
  const limit = quota[`${resource}_limit_monthly`] || 0;
  
  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      message: `Quota ${resource} épuisé. Passez au plan supérieur ou achetez un pack de crédits.`,
    };
  }
  
  return { allowed: true, remaining: limit - used };
}
```

### 2.4 Rafraîchissement Stripe (Anniversary Billing)

```typescript
// Webhook Stripe : invoice.paid
// À chaque paiement réussi → reset des compteurs
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = await getUserIdFromCustomerId(invoice.customer);
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  await db.table('user_credit_quotas').update(userId, {
    video_used_this_month: 0,
    aio_sync_used_this_month: 0,
    posts_generated_this_month: 0,
    sms_used_this_month: 0,
    email_used_this_month: 0,
    current_month: currentMonth,
    updated_at: new Date().toISOString(),
  });
}
```

### 2.5 Packs de crédits additionnels

Table existante : `video_credit_packs` + logique `creditPackHandler.ts`

```typescript
// Achat d'un pack de crédits vidéo (20 crédits)
await blink.db.table('video_credit_packs').create({
  userId: user.id,
  credits_granted: 20,
  credits_used: 0,
  stripe_payment_id: paymentIntent.id,
});
```

---

## 3. MULTI-TENANCY & RÔLES AGENCES

### 3.1 Modèle de données

```
Organisation (Agence)
  └── Workspace / Client A (role: admin → member → guest)
  └── Workspace / Client B
  └── Membres :
      ├── Admin (fondé de compte) → accès total, gère crédits globaux
      ├── Member (collaborateur) → accès workspaces assignés
      └── Guest (client agence) → lecture seule, son workspace uniquement, pas de crédits
```

### 3.2 Tables SQL existantes (team_members, team_invites, agency_sub_accounts)

```sql
-- team_members : gère les membres d'une organisation
-- Rôles : admin, member, guest
-- Chaque member est lié à un workspace_owner_id (l'admin de l'agence)

-- agency_sub_accounts : lie un client à une agence
CREATE TABLE IF NOT EXISTS agency_sub_accounts (
  id TEXT PRIMARY KEY,
  agency_user_id TEXT NOT NULL,
  client_user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  plan_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Droits d'accès (RBAC)

| Rôle | Dashboard | Créer contenu | Consommer crédits | Voir facturation | Gérer membres | Rapports clients |
|------|-----------|--------------|-------------------|-----------------|---------------|-----------------|
| Admin | ✅ Tous | ✅ | ✅ | ✅ | ✅ | ✅ Tous |
| Member | ✅ Assignés | ✅ | ✅ | ❌ | ❌ | ✅ Assignés |
| Guest | ✅ Son seul | ❌ Lecture | ❌ | ❌ | ❌ | ✅ Son seul |

**Règle clé :** Un Guest ne voit QUE les rapports de son propre workspace. Il ne consomme PAS les crédits de l'agence — toute action consommatrice est bloquée.

### 3.4 Middleware RBAC

```typescript
// backend/lib/rbacMiddleware.ts
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const membership = await db.table('team_members').get({
      member_user_id: user.id,
    });
    
    if (!membership || !roles.includes(membership.role)) {
      return c.json({ error: 'Accès insuffisant' }, 403);
    }
    
    c.set('membership', membership);
    await next();
  };
}
```

---

## 4. CONFORMITÉ RGPD — Meta CAPI & Données Sensibles

### 4.1 Flux Meta CAPI (Conversions API)

```
Navigateur utilisateur (pixel client-side)
    ↓ Envoie event_id + event_name
    ↓
Serveur Kompilot (backend)
    ↓ Reçoit event_id (déduction) + user_data (hashé)
    ↓ Envoie vers Meta Graph API (server-side)
    ↓
Meta API → Déduplique via event_id
```

### 4.2 Chiffrement des tokens au repos

```typescript
// backend/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8');
}
```

**Stockage :** La table `oauth_tokens` stocke `access_token` et `refresh_token` chiffrés avec AES-256-GCM. La clé de chiffrement (`ENCRYPTION_KEY`) est injectée via les secrets Blink, jamais en clair dans le code.

### 4.3 Isolation des données

- Chaque requête DB est filtrée par `user_id` (RLS activé)
- Un Guest ne peut pas accéder aux données d'un autre workspace
- Les tokens API des clients sont chiffrés et liés à leur `user_id`
- Les logs d'observabilité (`observability_logs`) ne contiennent jamais de PII

### 4.4 Rétention des données

| Type de donnée | Rétention | Suppression |
|----------------|-----------|-------------|
| Logs d'activité | 90 jours | Auto-purge |
| Tokens API | Durée du compte | Suppression à la désinscription |
| Données Meta CAPI | 30 jours | Auto-purge (sauf agrégats anonymisés) |
| Historique avis | 12 mois | Archivage puis suppression |
| Données de scan | 6 mois | Suppression complète |

### 4.5 Droit à l'oubli (RGPD)

```typescript
// Endpoint : DELETE /api/rgpd/delete-account
async function handleDeleteAccount(userId: string) {
  // 1. Supprimer les tokens OAuth chiffrés
  await db.table('oauth_tokens').deleteMany({ userId });
  
  // 2. Supprimer les données Meta CAPI
  await db.table('conversion_events').deleteMany({ userId });
  
  // 3. Supprimer les leads capturés
  await db.table('captured_leads').deleteMany({ userId });
  
  // 4. Supprimer les scans et données d'établissement
  await db.table('establishments').deleteMany({ userId });
  await db.table('initial_scans').deleteMany({ userId });
  await db.table('daily_analytics').deleteMany({ userId });
  
  // 5. Anonymiser l'utilisateur (pas de hard delete pour cohérence facturation)
  await db.table('users').update(userId, {
    email: `deleted_${userId}@anonymized.local`,
    display_name: 'Compte supprimé',
    avatar_url: null,
    phone: null,
    metadata: '{}',
  });
  
  // 6. Logger la suppression
  await db.table('observability_logs').create({
    action: 'account_deletion',
    user_id: userId,
    error_message: 'RGPD deletion completed',
    severity: 'info',
  });
}
```

---

## 5. SCHÉMA SQL COMPLET — TABLES MANQUANTES AJOUTÉES

### `conversion_events` (Meta CAPI)

```sql
CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,           -- UUID pour déduplication
  event_name TEXT NOT NULL,         -- Purchase, Lead, ViewContent...
  event_time INTEGER NOT NULL,      -- Unix timestamp
  user_data_hash TEXT,              -- SHA-256 de l'email/phone
  custom_data TEXT DEFAULT '{}',    -- JSON payload
  action_source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending',    -- pending / sent / failed / deduplicated
  meta_response TEXT,               -- Réponse de l'API Meta
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
);
```

### `ai_usage_logs` (suivi des coûts)

```sql
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,    -- video / aio_sync / post_generation / email
  model TEXT,                     -- luma / gpt-4.1-mini / claude...
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,   -- coût en centimes
  status TEXT DEFAULT 'success',
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. FEUILLE DE ROUTE D'IMPLÉMENTATION

| Semaine | Focus | Deliverables |
|---------|-------|-------------|
| S1 (7-11 juillet) | Queues + Quotas | Blink Queue pour vidéo/AIO, middleware quotas, UI crédits |
| S2 (14-18 juillet) | Multi-tenancy | RBAC, workspace isolation, Guest portal |
| S3 (21-25 juillet) | RGPD + Meta CAPI | Chiffrement, déduplication, rétention, suppression |
| S4 (28-1 août) | Emails + Séquences | Templates, magic links, dunning, segmentation |
| S5 (4-8 août) | QA + Load testing | Tests de charge queues, edge cases quotas, RGPD audit |
| S6 (11-15 août) | Polish + Monitoring | Sentry, alertes ops, dashboard admin quotas |
| S7 (18-22 août) | Soft launch | Beta fermée, 10 agences pilotes |
| S8 (25-29 août) | Launch prep | Landing page finale, campagne emails, PR |
| **7 sept** | **LAUNCH** | **Ouverture publique** |
