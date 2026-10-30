# Djua Energy — Architecture Technicien / Agent Documentation

> **Ce document est destiné à toute IA ou développeur travaillant sur ce projet.**
> Lisez-le en entier avant de toucher à n'importe quel fichier lié aux techniciens.

---

## Vue d'ensemble des applications

Le projet Djua Energy est composé de **trois applications distinctes** :

| Application   | Chemin                     | Rôles concernés                               | Port dev |
|---------------|---------------------------|-----------------------------------------------|----------|
| `backend2`    | `backend2/`               | API REST + WebSocket (tous rôles)             | `5000`   |
| `frontend`    | `frontend/`               | Admin, Shop Manager, Commercial               | `5173`   |
| `frontend-web`| `frontend-web/`           | **Technicien uniquement**                     | `5174`   |

---

## Règle absolue — Séparation des applications

### FRONTEND (frontend/)
- Accessible aux rôles : `admin`, `shop_manager`, `commercial`
- **Les techniciens N'ONT PAS accès à cette application.**
- Ne jamais ajouter de page/route/composant destiné au technicien dans ce dossier.
- Le login de cette app filtre les techniciens : si un compte `technician` tente de se connecter ici, il doit être redirigé ou bloqué.

### FRONTEND-WEB (frontend-web/)
- Application **exclusive** aux techniciens.
- Stack : React + TypeScript + Vite.
- Toute fonctionnalité destinée au technicien doit être développée **uniquement ici**.
- Cette app a son propre système de routes, contexte d'authentification, et design.

---

## Structure frontend-web/

```
frontend-web/
├── src/
│   ├── App.tsx                      # Router principal (routes technicien)
│   ├── pages/
│   │   ├── TechnicianApp.tsx        # Dashboard technicien
│   │   ├── TechnicianLogin.tsx      # Connexion technicien
│   │   └── InstallationDetail/     # Détail d'une installation assignée
│   ├── components/                  # Composants UI propres au technicien
│   ├── hooks/                       # React Query hooks (API calls)
│   ├── lib/
│   │   └── socket.ts               # WebSocket client (même backend)
│   └── stores/                     # Zustand stores (auth technicien)
```

---

## Flux d'assignation d'une installation

```
Admin/Commercial               Backend                   Technicien (frontend-web)
     │                            │                              │
     │  Assigne un technicien     │                              │
     ├───────────────────────────►│                              │
     │                            │  Notification push           │
     │                            ├─────────────────────────────►│
     │                            │  Message WhatsApp envoyé     │
     │                            │                              │
     │                            │  Technicien accepte          │
     │                            │◄─────────────────────────────│
     │  Statut → "En cours"       │                              │
     │◄───────────────────────────│                              │
     │                            │                              │
     │                            │  Technicien remonte infos    │
     │                            │◄─────────────────────────────│
     │  Statut → "Installé"       │                              │
     │◄───────────────────────────│                              │
```

---

## Endpoints API utilisés par frontend-web

| Méthode | Endpoint                                     | Description                                      |
|---------|----------------------------------------------|--------------------------------------------------|
| `POST`  | `/api/auth/login`                           | Connexion technicien                             |
| `GET`   | `/api/auth/me`                              | Profil technicien connecté                       |
| `GET`   | `/api/installations/technician/mine`        | Installations assignées au technicien            |
| `PATCH` | `/api/installations/:id/technician-accept`  | Technicien accepte l'installation                |
| `PATCH` | `/api/installations/:id/technician-update`  | Technicien remonte le statut / un problème       |
| `GET`   | `/api/installations/:id/messages`           | Messages du canal de l'installation              |
| `POST`  | `/api/installations/:id/messages`           | Envoyer un message dans le canal                 |

> Tous les appels API utilisent `withCredentials: true` (cookies JWT).
> Le backend tourne sur le port `5000`.

---

## Endpoints API liés aux techniciens (utilisés par frontend)

| Méthode | Endpoint                  | Rôle Admin | Rôle Commercial          |
|---------|--------------------------|------------|--------------------------|
| `GET`   | `/api/auth/technicians`  | Tous les techniciens | Uniquement ceux qu'il a créés (`createdBy`) |

> **Règle de filtrage côté backend** :
> - `admin` → retourne tous les techniciens
> - `commercial` → retourne uniquement `User.find({ role: 'technician', createdBy: req.user._id })`

---

## Statuts d'une installation

| Code statut           | Libellé affiché            | Qui peut le déclencher              |
|-----------------------|---------------------------|--------------------------------------|
| `pending`             | À planifier               | Création automatique                 |
| `planned`             | Planifiée                 | Admin / Commercial                   |
| `in_progress`         | En cours d'installation   | Technicien (acceptation)             |
| `blocked`             | En attente / Bloqué       | Technicien (remontée problème)       |
| `installed`           | Installée                 | Technicien (confirmation finale)     |
| `commissioned`        | Mise en service           | Admin / Shop Manager                 |
| `overdue`             | Date dépassée             | Automatique (vérification backend)   |

---

## Alertes automatiques

Le backend vérifie :
- Si `installation.plannedDate < Date.now()` ET `status !== 'installed'` AND `status !== 'commissioned'`
- → Un flag `isOverdue: true` est activé
- → Une alerte est créée dans le module suivi
- → Un message apparaît dans le canal de coordination de l'installation

---

## Notifications WhatsApp

Quand un technicien est assigné à une installation :
1. Le backend envoie un message WhatsApp au numéro du technicien (`user.phone`)
2. Le message contient : nom du client, adresse, date prévue, lien de confirmation

> **Configuration** : Variables d'environnement requises dans `backend2/.env`
> ```
> WHATSAPP_API_URL=...
> WHATSAPP_TOKEN=...
> ```

---

## Règles de développement (OBLIGATOIRES)

1. **Toute nouvelle fonctionnalité technicien** va dans `frontend-web/` uniquement.
2. **Ne jamais importer** un composant de `frontend/` dans `frontend-web/` et vice-versa.
3. **Les routes API** avec filtrage par rôle doivent lire `req.user.role` côté backend.
4. **Le commercial** ne voit que les techniciens qu'il a créés, jamais tous les techniciens.
5. **L'admin** voit tout et peut agir sur tout.
6. **Socket.io** : les deux apps se connectent au même WebSocket (port `5000`). Les rooms sont nommées `installation:{id}`.

---

## Tableau des accès par rôle

| Rôle          | Accès app          | Peut créer techniciens | Peut assigner           |
|---------------|--------------------|------------------------|-------------------------|
| Admin         | `frontend`         | Oui                    | Oui (tous techniciens)  |
| Shop Manager  | `frontend`         | Non                    | Oui (tous techniciens)  |
| Commercial    | `frontend`         | Oui                    | Oui (les siens uniquement) |
| Technicien    | **`frontend-web`** | Non                    | Non                     |

---

*Document Djua Energy — v1.0 — 2026-10-30*
