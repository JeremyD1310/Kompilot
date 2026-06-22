# Intégration Firebase — Kompilot

## Services intégrés

| Service | Usage |
|---------|-------|
| **Firebase Analytics** | Tracking automatique des événements utilisateurs (GA4) |
| **Firebase Cloud Messaging (FCM)** | Notifications push web en temps réel |
| **Firestore** | Synchronisation temps réel (activité live, statuts posts, scores GEO) |

---

## Configuration requise

### 1. Créer un projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créer un nouveau projet (ou utiliser un existant)
3. Activer les services :
   - **Analytics** → Activer Google Analytics
   - **Firestore** → Créer une base de données (mode Production)
   - **Cloud Messaging** → Activé par défaut

### 2. Récupérer les clés de configuration

Dans la console Firebase :
- **Paramètres du projet** → **Vos applications** → Ajouter une app Web
- Copier le `firebaseConfig` affiché

### 3. Clé VAPID pour FCM

Dans la console Firebase :
- **Cloud Messaging** → **Configuration Web** → **Certificats push web**
- Générer une paire de clés VAPID → copier la **clé publique**

### 4. Ajouter les secrets dans Blink

Ajouter ces 8 variables dans **Blink > Secrets** :

```
VITE_FIREBASE_API_KEY          → apiKey du firebaseConfig
VITE_FIREBASE_AUTH_DOMAIN      → authDomain du firebaseConfig
VITE_FIREBASE_PROJECT_ID       → projectId du firebaseConfig
VITE_FIREBASE_STORAGE_BUCKET   → storageBucket du firebaseConfig
VITE_FIREBASE_MESSAGING_SENDER_ID → messagingSenderId du firebaseConfig
VITE_FIREBASE_APP_ID           → appId du firebaseConfig
VITE_FIREBASE_MEASUREMENT_ID   → measurementId du firebaseConfig
VITE_FIREBASE_VAPID_KEY        → Clé publique VAPID (Cloud Messaging)
```

---

## Événements Analytics trackés

| Événement | Déclencheur |
|-----------|-------------|
| `sign_up` | Inscription email |
| `login` | Connexion email ou Google |
| `page_view` | Navigation entre pages |
| `post_published` | Publication multicanal |
| `post_scheduled` | Planification d'un post |
| `review_replied` | Réponse à un avis Google |
| `review_raid_detected` | Raid d'avis détecté |
| `geo_scan_complete` | Scan GEO terminé |
| `visibility_score_change` | Changement du score de visibilité |
| `agency_client_added` | Ajout d'un client (espace agence) |
| `agency_report_generated` | Rapport PDF généré |
| `cowork_message_sent` | Message Claude Cowork |
| `sms_sent` | Campagne SMS envoyée |
| `upgrade_click` | Clic sur upgrade abonnement |
| `begin_checkout` | Démarrage du checkout |
| `purchase` | Abonnement activé |

---

## Collections Firestore

| Collection | Contenu |
|------------|---------|
| `netcopilot_activity/{userId}/events` | Feed d'activité temps réel |
| `netcopilot_post_status/{postId}` | Statut de publication par post |
| `netcopilot_geo_scores/{establishmentId}` | Historique des scores GEO |

### Règles Firestore recommandées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Activity feed — lecture/écriture par l'utilisateur propriétaire
    match /netcopilot_activity/{userId}/events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Post status — lecture/écriture par utilisateur authentifié
    match /netcopilot_post_status/{postId} {
      allow read, write: if request.auth != null;
    }
    // Geo scores — lecture/écriture par utilisateur authentifié
    match /netcopilot_geo_scores/{establishmentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Architecture des fichiers

```
src/firebase/
├── client.ts        # Initialisation Firebase (singleton app, analytics, FCM, Firestore)
├── analytics.ts     # Helpers pour logEvent GA4
├── messaging.ts     # FCM — permission, token, foreground messages
├── firestore.ts     # Helpers Firestore — subscribe, write
├── swInit.ts        # Envoie la config au service worker
└── index.ts         # Export public

src/hooks/
├── useFirebaseAnalytics.ts   # Hook — auto-tracking page views
├── useFirebaseMessaging.ts   # Hook — permission FCM, token, messages
└── useFirestoreActivity.ts   # Hook — feed d'activité temps réel

src/components/firebase/
├── FirebaseProvider.tsx     # Provider — initialise Firebase au mount
├── FirebaseSetupPanel.tsx   # Panel paramètres compte (onglet Firebase)
└── FirebaseStatusBadge.tsx  # Badge topbar (actif si configuré)

public/
└── firebase-messaging-sw.js # Service worker FCM (background notifications)
```

---

## Comportement sans configuration

Si les variables `VITE_FIREBASE_*` ne sont pas définies, l'intégration est **silencieusement désactivée** :
- Aucune erreur dans l'app
- Les fonctions analytics deviennent des no-ops
- Les hooks FCM ne demandent pas de permission
- Firestore ne crée aucune connexion
- Le badge topbar n'est pas affiché

L'app fonctionne normalement sans Firebase.
