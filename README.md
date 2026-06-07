# Projet H5 — INSA Sports

Application web de gestion du H5 INSA (événements, matchs, pôles, messagerie temps réel).

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé

C'est tout.

---

## Mise en place

### 1. Cloner le repo

```bash
git clone <url-du-repo>
cd Projet-H5
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Ouvre `.env` et ajuste au minimum :

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe de la base de données |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth — générer avec `openssl rand -base64 32` |
| `DEFAULT_EMAIL_DOMAIN` | Domaine email autorisé à l'inscription (ex: `insa-cvl.fr`) |
| `DEFAULT_SCHOOL_NAME` | Nom de l'école associé au domaine |

Les autres variables (SMTP, LyfPay) sont optionnelles pour un environnement de test.

### 3. Lancer l'application

```bash
docker compose up -d --build
```

Le premier démarrage prend quelques minutes (build de l'image Next.js).

L'application est disponible sur **http://localhost:3000**.

> Le domaine défini dans `DEFAULT_EMAIL_DOMAIN` est automatiquement ajouté à la whitelist au démarrage.

---

## Créer un compte administrateur

1. S'inscrire sur http://localhost:3000/auth/register avec une adresse `@<DEFAULT_EMAIL_DOMAIN>`
2. Promouvoir le compte en super admin :

```bash
docker exec insa-sports-web node scripts/promote.js ton@email.fr
```

---

## Commandes utiles

```bash
# Démarrer (sans rebuild)
docker compose up -d

# Arrêter
docker compose down

# Voir les logs en live
docker compose logs -f

# Rebuild après modification du code
docker compose up -d --build

# Réinitialiser complètement (supprime la base de données)
docker compose down -v && docker compose up -d --build
```

---

## Ports exposés

| Service | Port |
|---|---|
| Application web | http://localhost:3000 |
| Serveur WebSocket | localhost:3002 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
