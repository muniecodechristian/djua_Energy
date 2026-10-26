# Docker pour Djua Energy

Cette configuration lance `frontend` (React/Vite servi par Nginx), `backend2`
(Express, Socket.IO et son broker MQTT intégré) et MongoDB. Les anciens dossiers
`backend` et `frontend-web` ne sont pas utilisés.

## Premier démarrage sur Windows

1. Ouvre Docker Desktop et attends que le moteur Linux soit prêt.
2. Arrête les serveurs locaux qui utilisent déjà les ports 5000 ou 1883.
3. Depuis PowerShell, à la racine de ce dépôt :

```powershell
cd djua_Energy
docker compose up --build -d
docker compose ps
```

- Application (dashboard) : http://localhost:8080
- Site marketing (Next.js) : http://localhost:3000
- API et vérification du serveur : http://localhost:5000
- Documentation API : http://localhost:5000/api-docs
- MQTT : localhost:1883 (utilisateur `djua_local`, mot de passe `local-mqtt-only`)
- Clé HTTP IoT locale : `local-iot-only`

Ces identifiants sont réservés à cet environnement local. Les ports publiés sont
limités à ton PC. MongoDB reste accessible seulement entre les conteneurs.

La base Docker est séparée de ta base actuelle. Elle est initialement vide ;
le backend lance automatiquement sa synchronisation avec l'API Orange Energy.
Cette synchronisation et l'IA utilisent des services externes et nécessitent
Internet. Aucun service IA n'est créé par ce Compose.

Le fichier `backend2/.env` existant n'est ni lu par Compose ni copié dans l'image.
Pour changer un paramètre local, modifie `environment` dans `compose.yaml`.
Ne colle pas de secrets de production dans ce fichier suivi par Git.
Les variables `DOCKER_JWT_SECRET`, `DOCKER_MQTT_USER`, `DOCKER_MQTT_PASS` et
`DOCKER_IOT_API_KEY` peuvent aussi être définies dans ta session PowerShell.

## Commandes utiles

```powershell
# Voir les logs (Ctrl+C ferme seulement l'affichage)
docker compose logs -f backend

# Reconstruire après une modification du code
docker compose up --build -d

# Arrêter et supprimer les conteneurs, en conservant les données MongoDB
docker compose down

# Relancer les conteneurs existants
docker compose up -d
```

Ne lance pas `docker compose down -v` si tu souhaites conserver les données :
`-v` supprime aussi le volume MongoDB.

## Comprendre les fichiers

- `backend2/Dockerfile` installe les dépendances Node de production et lance le serveur.
- `frontend/Dockerfile` compile React puis copie le résultat dans Nginx.
- `frontend-site/Dockerfile` compile Next.js (mode standalone) puis lance le serveur Node.
- `frontend/nginx.conf` permet d'actualiser directement une route comme `/parc`.
- Les `.dockerignore` excluent les dépendances locales, builds et fichiers `.env`.
- `compose.yaml` relie les services ; le backend attend que MongoDB soit prêt,
  puis le frontend attend que le backend réponde.
- Le volume `mongo-data` conserve les données lorsque les conteneurs sont recréés.

`mongo` est le nom réseau de la base dans Docker. Le navigateur utilise
`localhost:5000` pour l'API et Socket.IO, car il tourne sur ton PC.
`VITE_API_URL` est intégré au frontend pendant le build : un changement de cette
adresse nécessite de reconstruire l'image du frontend.

## Render et Vercel

Tu peux conserver tes déploiements actuels avec leurs commandes habituelles.
Ces fichiers servent ici au lancement local. Le Compose utilise le mode
`development` du backend pour les cookies en HTTP ; il n'est pas une configuration
de production à déployer telle quelle.

Le Dockerfile du backend utilise par défaut `NODE_ENV=production` ; Compose le
remplace uniquement pour cet environnement local. Pour un hébergement Docker,
il faut fournir les variables et secrets de l'hébergeur, une base adaptée et HTTPS.

Référence : https://docs.docker.com/compose/how-tos/startup-order/
