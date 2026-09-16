# Kompilot — Stratégie Growth Marketing, PLG & Launch (7 Septembre 2026)

> Business Model : Reverse Trial 14 jours → Starter 69€ HT/mois | Agency 149€ HT/mois + Packs crédits IA

---

## 1. PHILOSOPHIE PLG — PRODUCT-LED GROWTH

### 1.1 Le "Frictionless" comme avantage concurrentiel

Kompilot ne vend pas un outil. Kompilot vend du **temps récupéré**. Chaque friction dans l'UI est un motif de churn potentiel.

**Principes directeurs :**
- 1 clic pour connecter un compte (OAuth, pas de formulaire)
- 35 secondes pour le premier scan (pas de loading screen interminable)
- 0 carte bancaire pendant l'essai (pas de friction d'entrée)
- Tout est "en attente" — les données se remplissent automatiquement dès la connexion

### 1.2 L'Aha! Moment (Objectif : < 48h)

L'utilisateur doit percevoir la valeur dans les 48 premières heures. Notre Aha! Moment est :

> "J'ai connecté mon compte Google Business et en 35 secondes, j'ai vu que ChatGPT ne recommande pas mon commerce dans ma zone. Kompilot m'a montré exactement ce qui manquait."

**Métrique clé :** Taux d'activation = % d'utilisateurs ayant connecté au moins 1 compte ET lancé 1 scan dans les 48h.

**Cible :** 40% d'activation (benchmark SaaS B2B : 25-35%)

---

## 2. CHECKLIST DE COMPLÉTION IN-APP

Affichée dès le premier login, cette checklist guide l'utilisateur vers l'activation :

| # | Action | Poids | Récompense |
|---|--------|-------|------------|
| 1 | Connecter Google Business | 30% | +10 crédits bonus |
| 2 | Lancer le scan d'acquisition local | 25% | Score G.E.O. visible |
| 3 | Connecter Instagram ou Facebook | 20% | Calendrier activé |
| 4 | Générer le premier post IA | 15% | Publication en 1 clic |
| 5 | Configurer les alertes avis | 10% | Notifications activées |

**Visualisation :** Barre de progression circulaire animée (cercle à 80% = motivation maximale, comme Duolingo).

**Métrique :** Taux de complétion checklist / Corrélation avec conversion trial→paid.

---

## 3. AVARIE À LA PERTE — FIN D'ESSAI

À J-1 (24h avant expiration), afficher un écran comparatif clair :

```
┌────────────────────────────────────────────────────────────────┐
│  ⏰ Votre plan Agency expire demain                            │
│                                                                │
│  Ce que vous allez perdre si vous passez au Starter (69€) :   │
│                                                                │
│  ❌ Creative Studio IA illimité → limité à 10 vidéos/mois     │
│  ❌ AIO Sync temps réel → désactivé                           │
│  ❌ Meta CAPI tracking → données incomplètes                  │
│  ❌ Multi-établissements → 1 seul établissement               │
│  ❌ Rapport hebdomadaire → rapport mensuel                    │
│  ❌ Support prioritaire → support standard                    │
│                                                                │
│  → [🏢 Rester sur Agency — 149€/mois]                         │
│  → [📋 Voir le comparatif détaillé]                           │
└────────────────────────────────────────────────────────────────┘
```

**Principe psychologique :** Montrer ce qu'on PERD est 2x plus puissant que montrer ce qu'on GAGNE (Kahneman, Loss Aversion).

---

## 4. JAUGE DE CRÉDITS VIRTUELS

Affichée en permanence dans la sidebar (widget footer) :

```
┌──────────────────────────────────────┐
│ 📊 Crédits IA restants               │
│ ████████████████░░░░░ 78%            │
│ 39/50 vidéos · 412/500 AIO sync     │
│ 🔄 Renouvellement le 15 sept.       │
│ → [Acheter un pack bonus]           │
└──────────────────────────────────────┘
```

**Effet :** matérialise la consommation, crée un sentiment d'urgence douce, et pousse vers l'achat de packs additionnels avant même l'épuisement.

---

## 5. CAMPAGNE RETARGETING PUBLICITAIRE

### 5.1 Audiences cibles

| Audience | Plateforme | Contenu | Objectif |
|----------|-----------|---------|----------|
| Inscrits trial J0-J3 | Meta + LinkedIn | Études de cas, gains de temps | Renforcer activation |
| Inscrits trial J4-J7 | Meta | Aversion à la perte, témoignages | Convertir avant expiration |
| Churnés J+7 à J+30 | Meta | Nouveautés produit, offre flash | Win-back |
| Lookalike des convertis | Meta + LinkedIn | Scanner IA gratuit | Acquisition |

### 5.2 Créatives recommandées

**Creative 1 — "Le scanner"** (acquisition)
- Visuel : Capture d'écran du dashboard floutée avec score G.E.O. visible
- Texte : "ChatGPT ne recommande pas votre commerce. En 35 secondes, découvrez pourquoi."
- CTA : "Lancer mon scan gratuit"

**Creative 2 — "L'agence"** (conversion)
- Visuel : Split screen "Avant Kompilot / Après Kompilot" avec métriques
- Texte : "12h/semaine récupérées. 8 nouveaux clients en 2 mois. Leur secret ?"
- CTA : "Tester 14 jours gratuits"

**Creative 3 — "La preuve sociale"** (réassurance)
- Visuel : Photo portrait + citation client
- Texte : "J'ai découvert que ChatGPT ne connaissait pas ma boulangerie. Réglé en 1 clic." — Sophie M., Lyon
- CTA : "Vérifier mon commerce"

---

## 6. STRATÉGIE HAUTE TOUCHE (AGENCES & PROFILS QUALIFIÉS)

### 6.1 Détection automatique

Dès l'inscription, analyser le domaine email :
- Mots-clés "agence", "digital", "marketing", "communication", "studio" → flag `is_agency_profile`
- Domaines entreprise vérifiés (pas gmail/outlook/yahoo) → flag `is_business_email`

### 6.2 Workflow d'alerte

```
Inscription détectée
    ↓
Webhook → Slack #high-touch-leads
    ↓
Message : "🏢 Nouveau lead qualifié : {{name}} ({{company}}) — {{sector}} — Trial J0"
    ↓
Romain reçoit l'alerte
    ↓
Sous 4h : Message LinkedIn personnalisé
    ↓
+48h : Email de suivi si pas de réponse
```

### 6.3 Template LinkedIn (Romain)

```
Bonjour {{prénom}},

J'ai vu votre inscription sur Kompilot — content de vous voir ici.

Je suis curieux de savoir ce qui vous a amené vers nous. Vous gérez plusieurs clients en agence ?

Si oui, j'aimerais vous montrer comment nos agences partenaires utilisent Kompilot pour présenter des rapports AIO à leurs clients (et signer des contrats à 500-2000€/mois).

15 minutes cette semaine ? → [Calendly]

Jérémy
```

---

## 7. SEQUENCES DE WIN-BEARBACK

### 7.1 J+14 — La Valeur Continue

Partage d'une nouveauté produit ou d'un guide exclusif (Guide AIO 2026). Objectif : réveiller l'intérêt sans vendre.

### 7.2 J+30 — La Seconde Chance

Offre flash 48h : -30% sur Starter (49€ au lieu de 69€), -33% sur Agency (99€ au lieu de 149€). Token unique, non renouvelable.

### 7.3 J+60 — Le Dernier Message

```
Objet : Dernière chance — votre espace Kompilot sera supprimé dans 30 jours

Bonjour {{prénom}},

Conformément à notre politique de rétention des données, votre compte Kompilot (inactif depuis 60 jours) sera supprimé automatiquement dans 30 jours.

Si vous souhaitez conserver vos données, configurations et historiques, réactivez votre compte avant le {{date_j90}}.

→ [Conserver mon compte]

Sinon, aucune action requise. Vos données seront supprimées de manière sécurisée et irréversible.

Jérémy
```

---

## 8. KPIs & MÉTRIQUES CLÉS

### 8.1 Funnel de conversion

| Étape | Métrique | Cible J+30 post-launch |
|-------|----------|------------------------|
| Visite → Inscription | Taux de conversion | 8-12% |
| Inscription → Activation (48h) | Taux d'activation | 40% |
| Activation → Trial complet (14j) | Taux de complétion | 70% |
| Trial → Paid | Taux de conversion | 15-20% |
| Starter → Agency (upsell) | Taux d'upsell | 10% |
| Paid → Retenu (M3) | Rétention M3 | 80% |

### 8.2 Métriques financières

| Métrique | Cible |
|----------|-------|
| MRR à J+30 | 5 000€ |
| MRR à J+90 | 15 000€ |
| ARPU | 95€ (mix Starter/Agency) |
| CAC (payant) | < 80€ |
| LTV (12 mois) | 1 140€ |
| LTV/CAC | > 14x |
| Churn mensuel | < 8% |

### 8.3 Coûts API par plan

| Ressource | Coût unitaire | Starter (69€) | Agency (149€) |
|-----------|--------------|---------------|---------------|
| Vidéo Luma | ~0.05€ | 10× = 0.50€ | 50× = 2.50€ |
| AIO Sync (SerpApi) | ~0.01€ | 100× = 1€ | 500× = 5€ |
| GPT-4.1-mini | ~0.002€/1K tokens | ~2€/mois | ~5€/mois |
| **Coût total estimé** | | **~3.50€** | **~12.50€** |
| **Marge brute** | | **~95%** | **~92%** |

---

## 9. PLAN D'ACTION — TIMELINE JUSQU'AU 7 SEPTEMBRE

| Semaine | Focus | Actions clés |
|---------|-------|-------------|
| **7-13 juillet** | Module 1 + Queues | Hybrid Local Scan live, Blink Queue vidéo/AIO, quotas middleware |
| **14-20 juillet** | Onboarding UX | Checklist complétion, jauge crédits, aversion perte UI |
| **21-27 juillet** | Multi-tenancy | RBAC, workspace isolation, Guest portal |
| **28 juil - 3 août** | Emails & RGPD | Templates email, magic links, dunning, chiffrement, rétention |
| **4-10 août** | Creative Studio polish | UI vidéo, templates, watermark, export |
| **11-17 août** | QA + Load test | Tests charge queues, edge cases quotas, RGPD audit |
| **18-24 août** | Marketing assets | Landing pages, créatives Meta/LinkedIn, études de cas |
| **25-31 août** | Soft launch | Beta fermée (10 agences pilotes), feedback loop |
| **1-6 sept** | Finalisation | Bug fixes, monitoring, alertes ops, on-call |
| **7 sept** | **LAUNCH** | **Ouverture publique + campagne acquisition** |

---

## 10. STACK MARKETING RECOMMANDÉ

| Outil | Usage | Budget mensuel estimé |
|-------|-------|----------------------|
| Meta Ads (retargeting) | Trial users + acquisition | 500€ |
| LinkedIn Ads (agences) | Profils qualifiés | 300€ |
| Brevo / SendGrid | Email sequences | 50€ |
| Calendly | High-touch calls | 0€ (free) |
| Slack/Discord | Alertes leads | 0€ |
| Hotjar | Heatmaps + session replay | 0€ (free tier) |
| Plausible | Analytics RGPD-compliant | 9€ |
| **Total** | | **~860€/mois** |
