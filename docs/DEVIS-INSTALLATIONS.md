# Clients, devis et installations

Le parcours utilise `backend2` (Express/MongoDB), `frontend` (commercial et administration) et `frontend-web` (installation technicien). Le backend Adonis du dossier `backend` n'est pas utilisé par ce parcours.

## Utilisation

1. Le commercial prépare un devis standard ou une recommandation solaire, puis clique sur **Enregistrer client et devis**. Le téléphone est obligatoire pour le suivi. Le numéro définitif `DJ-AAAA-…` est créé par le serveur et affiché après enregistrement.
2. **Mes devis et clients**, dans la page Devis, recherche par nom, téléphone ou numéro. Plusieurs devis partagent le même dossier client. Les coordonnées client sont conservées avec chaque proposition; un nouveau devis ne modifie pas les anciennes propositions.
3. Le commercial ouvre le devis accepté, indique une date d'installation puis clique sur **Le client valide ce devis**. La date doit être aujourd'hui ou une date future, selon le calendrier **Africa/Kinshasa**. Une validation ne peut pas être écrasée par un envoi répété.
4. Le technicien utilise **Oui, j'ai un numéro de devis** dans `frontend-web`. Seuls les devis validés de son équipe sont importables. Téléphone, dimensionnement et appareils sont repris depuis la base. Un devis ne peut être affecté qu'à un kit.
5. À la réception de l'installation, le serveur reprend les données du devis et relie le kit au client, au commercial et au shop. Un deuxième envoi identique ne crée pas un deuxième kit.

## Dates et alertes

La date réelle contrôlée est le jour de création du kit reçu par le serveur (heure de Kinshasa), et non une date déclarée dans le navigateur. Cela contrôle le jour d'enregistrement; une saisie différée après une installation physique sera donc signalée.

Tout écart, en avance ou en retard, génère une seule alerte. Elle est visible dans le résumé de la page Devis et le suivi des devis du commercial concerné et du responsable de shop; l'administration les voit dans sa page Paramètres. Ces vues s'actualisent toutes les 30 secondes et proposent une actualisation manuelle.

Les alertes ont une expiration de **7 jours** et un index MongoDB TTL `expiresAt` (`expireAfterSeconds: 0`). L'API masque immédiatement les alertes expirées; MongoDB les efface ensuite lors de son passage TTL. Un nouvel envoi ne repousse pas leur expiration. Les devis et l'historique d'installation restent conservés.

## Accès et données

- Commercial : ses propres devis et statistiques.
- Responsable shop : devis de son équipe.
- Administration : tous les devis et alertes.
- Technicien : recherche exacte d'un devis validé de son shop et installation.

`SalesClient` est distinct de l'ancien modèle `Client`, qui représente une association à un kit. Le dossier commercial est identifié par shop et téléphone normalisé. Les formats RDC `0812345678` et `+243812345678` désignent le même client. Deux shops gardent des dossiers séparés.

Les devis PDF ou brouillons antérieurs non enregistrés n'ont pas de dossier serveur : il faut les enregistrer depuis la page Devis. Aucun import fictif n'est utilisé si le serveur est indisponible.

## Vérification

- `cd backend2; npm test -- tests/quotes.test.js tests/kit.test.js` : base MongoDB temporaire isolée.
- `cd frontend; npm run build`
- `cd frontend-web; npm run build`
- Scénario navigateur : démarrer `node backend2/tests/quote-browser-server.mjs`, puis les deux Vite sur 5188/5189 avec `VITE_API_URL=http://127.0.0.1:5190`, et exécuter `node verify-sales-flow.cjs` depuis `frontend`. Le serveur de test crée uniquement une base éphémère et des comptes de test. Ne pas le déployer.
