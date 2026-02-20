# Guide de Déploiement - Projet H5

L'application utilise Next.js, Prisma (PostgreSQL), et un serveur WebSocket personnalisé (avec Redis) pour les mises à jour en temps réel. Un déploiement sur un serveur dédié, un VPS ou une VM (ex: Proxmox) est recommandé.

## Prérequis
- Node.js (v18 ou v20 recommandé)
- PostgreSQL (Base de données)
- Redis (Pour le serveur WebSocket)
- PM2 (Pour faire tourner les processus en arrière-plan) : `npm install -g pm2`

## 1. Variables d'Environnement
Créez un fichier `.env` à la racine du projet (`web-app/.env`) avec les valeurs adaptées à votre serveur de production :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/nom_bdd?schema=public"

# Redis (WebSocket)
REDIS_URL="redis://localhost:6379"

# NextAuth (Sécurité)
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="votre_secret_tres_long_et_aleatoire" # Générer avec: openssl rand -base64 32

# Emails (Config SMTP)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@votre-domaine.com"

# LyfPay (Si utilisé)
LYFPAY_API_URL="https://payment-api.lyf.eu"
LYFPAY_CLIENT_ID="votre_client_id"
LYFPAY_CLIENT_SECRET="votre_secret"
LYFPAY_MERCHANT_ID="votre_merchant_id"
```

## 2. Installation et Build

Sur votre serveur, clonez le repo, allez dans le dossier `web-app` et lancez :

```bash
# Installer les dépendances
npm install

# Appliquer la structure de la base de données
npx prisma db push

# Compiler l'application Next.js (Ceci va aussi générer Prisma Client)
npm run build
```

## 3. Lancement en Production (avec PM2)

L'application nécessite deux processus : le serveur Next.js classique et le serveur WebSocket.

```bash
# 1. Lancer le site web (Port par défaut 3000)
pm2 start npm --name "h5-web" -- start

# 2. Lancer le serveur WebSocket (Port 3001)
pm2 start npm --name "h5-ws" -- run start:ws

# 3. Sauvegarder la configuration pour le redémarrage automatique
pm2 save
pm2 startup
```

## 4. Configuration Nginx (Reverse Proxy)

Pour exposer votre application sur Internet (ports 80/443), utilisez Nginx.
Attention : Le serveur WebSocket tourne sur le port 3001 et le front tente de s'y connecter (actuellement en dur sur localhost:3000 dans `server.js`, il faudra peut-être adapter les CORS dans `server.js` pour autoriser votre nom de domaine en production).

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Mises à jour (GitOps / Manuel)
Pour mettre à jour l'application en production :
1. `git pull`
2. `npm install`
3. `npx prisma db push` (Si modification de la BDD)
4. `npm run build`
5. `pm2 restart h5-web h5-ws`
