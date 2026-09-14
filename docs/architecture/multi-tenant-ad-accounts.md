# Comptes publicitaires multi-tenant — Kompilot

## Architecture

Chaque connexion est portée par un couple `(organization_id, provider)`. Le navigateur ne reçoit jamais de jeton Meta ou Google : il appelle le backend avec le JWT Kompilot, puis le backend redirige vers le fournisseur OAuth.

- UI : `src/components/settings/AdAccountsConnectionPanel.tsx`
- Hooks : `src/hooks/useSocialPublish.ts`
- OAuth : `backend/routes/adAccountsOAuth.ts`
- Stockage chiffré : `backend/lib/adTenantStore.ts` + `backend/lib/tokenEncryption.ts`
- Synchronisation : `backend/lib/adSyncWorkers.ts`, exécutée par la queue `ad-sync`
- Alertes : `backend/lib/adConnectionAlerts.ts`

## Parcours utilisateur

1. Ouvrir `Paramètres > Connexions`.
2. Cliquer sur `Connecter Meta Ads` ou `Connecter Google Ads`.
3. Le backend vérifie le JWT et l'appartenance à l'organisation.
4. Le backend signe un state HMAC contenant `userId`, `organizationId`, provider, destination interne et expiration de 10 minutes.
5. Le fournisseur demande le consentement.
6. Le callback échange le code côté serveur, chiffre les tokens, découvre les comptes et enfile la première synchronisation.
7. L'interface affiche `Connecté`, `Action requise` ou `Non connecté`.

## Routes

- `GET /api/auth/meta/connect`
- `GET /api/auth/google_ads/connect`
- `GET /api/auth/ad-accounts/callback`
- `GET /api/auth/ad-accounts/status`
- `POST /api/auth/ad-accounts/disconnect/:provider`
- Worker : `POST /api/queue` avec `taskName: "ad-sync"`

Le callback OAuth à déclarer dans Meta et Google est :

```text
https://gbrhsehk.backend.blink.new/api/auth/ad-accounts/callback
```

Pour un autre projet, utiliser son URL backend réelle ; ne jamais dériver ce callback depuis `window.location.origin`.

## Cloisonnement des données

Tables créées dans Blink DB :

- `ad_organizations`
- `ad_organization_members`
- `ad_connections`
- `ad_accounts`
- `ad_metrics`
- `ad_sync_runs`
- `ad_connection_events`
- `ad_alert_preferences`

Toutes les lectures et écritures métier filtrent `organizationId` et `userId`. Les identifiants externes ne sont jamais utilisés seuls comme clé d'accès. Les métriques sont dédupliquées par compte, campagne et date.

## Chiffrement

Les tokens utilisent AES-256-GCM Web Crypto avec IV aléatoire par valeur :

```text
enc:v1:base64(iv || ciphertext || authTag)
```

La clé `TOKEN_ENCRYPTION_KEY` reste uniquement dans les secrets backend. Aucun token brut ne doit être envoyé au frontend, écrit dans un log ou inclus dans une URL.

## Synchronisation et erreurs

- Google Ads : refresh token OAuth puis requête `customers/{id}/googleAds:search`.
- Meta Ads : `/{adAccountId}/insights` avec les permissions `ads_read`.
- Les appels externes ont un timeout.
- Une expiration ou une erreur de synchronisation met la connexion en erreur, crée un événement et une notification in-app.
- Si `ad_alert_preferences.slack_enabled = 1`, l'alerte Slack est envoyée via un webhook chiffré et validé par préfixe HTTPS Slack.

## Secrets requis

Déjà disponibles dans le projet : `META_APP_ID`, `META_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `BLINK_SECRET_KEY`.

À ajouter pour la découverte et la synchronisation Google Ads :

```text
GADS_DEVELOPER_TOKEN
```

`GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` doivent être configurés sur un écran OAuth Google autorisé, avec le callback backend exact.

## Déclenchement d'une synchronisation

```ts
await blink.queue.enqueue('ad-sync', {
  userId,
  organizationId,
  provider: 'meta', // ou 'google_ads'
  days: 30,
}, { queue: 'ad-sync' })
```

La queue doit être appelée uniquement côté backend. Le worker relit le token chiffré de l'organisation concernée et ne prend aucun token fourni par le navigateur.

## Points de contrôle production

- Ne pas exposer `BLINK_SECRET_KEY`, `META_APP_SECRET`, `GOOGLE_CLIENT_SECRET` ou `TOKEN_ENCRYPTION_KEY` au client.
- Configurer les secrets manquants signalés au déploiement, notamment `GADS_DEVELOPER_TOKEN` et les clés de signature Queue.
- Ajouter les organisations réelles dans `ad_organization_members` avant d'envoyer un `organizationId` non personnel.
- Tester les cas : consentement refusé, state expiré, token Google renouvelé, token révoqué, compte Meta supprimé et organisation non autorisée.
- Lancer une publication après validation de l'intégration pour mettre ces changements en production.
