# LearnFlow

Plateforme e-learning en **microservices**, déployée sur **Clever Cloud** via **Terraform** (Infrastructure as Code).

Demo Deployment via Terraform — Clever Cloud Morocco.

---

## Contexte

LearnFlow est une application de démonstration composée de **2 microservices backend** et d'un **frontend React**. Chaque microservice possède **sa propre base PostgreSQL** (principe *database-per-service*).

Le dépôt contient uniquement :

- **`services/`** — code source (APIs Node.js + frontend)
- **`terraform/`** — infrastructure Clever Cloud déclarée en HCL

Le déploiement est **entièrement automatisé par Terraform** : une seule commande `terraform apply` crée l'infrastructure **et** déploie le code source depuis GitHub (bloc `deployment` dans `main.tf`).

```
terraform apply  →  infra (PostgreSQL + apps Docker)  +  build & run depuis GitHub
```

---

## Architecture

```
                    ┌─────────────────────┐
                    │  frontend (nginx)   │
                    │  services/frontend  │
                    └──────────┬──────────┘
                               │ proxy /api/*
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   ┌────────────────────┐           ┌────────────────────┐
   │  auth-service      │           │  learning-service  │
   │  services/auth-*   │           │  services/learning*│
   └─────────┬──────────┘           └─────────┬──────────┘
             ▼                                ▼
   ┌────────────────────┐           ┌────────────────────┐
   │  PostgreSQL        │           │  PostgreSQL        │
   │  (add-on Clever)   │           │  (add-on Clever)   │
   └────────────────────┘           └────────────────────┘
```

| Composant | Dossier | Rôle |
|-----------|---------|------|
| Auth | `services/auth-service` | Inscription, connexion, JWT, profils |
| Learning | `services/learning-service` | Cours, leçons, inscriptions, progression |
| Frontend | `services/frontend` | Interface utilisateur, proxy nginx vers les APIs |

**Communication :** HTTP entre services. Le learning service valide les JWT signés par le auth service (`JWT_SECRET` partagé). Aucune base de données partagée.

---

## Ce que Terraform crée

| Ressource | Type Clever Cloud | Fichier |
|-----------|-------------------|---------|
| `clevercloud_postgresql.auth` | Add-on PostgreSQL | `terraform/main.tf` |
| `clevercloud_postgresql.learning` | Add-on PostgreSQL | `terraform/main.tf` |
| `clevercloud_docker.auth` | App Docker | `terraform/main.tf` |
| `clevercloud_docker.learning` | App Docker | `terraform/main.tf` |
| `clevercloud_docker.frontend` | App Docker | `terraform/main.tf` |

**Fichiers Terraform :**

| Fichier | Rôle |
|---------|------|
| `config.tf` | Provider CleverCloud, versions, variables |
| `main.tf` | Locals, ressources, dépendances |
| `outputs.tf` | URLs publiques, deploy URLs Git |
| `terraform.tfvars.example` | Modèle de configuration (à copier) |

**Ordre de création automatique :**

```
PostgreSQL (auth + learning) → Docker (auth + learning) → Docker (frontend)
```

Le frontend reçoit automatiquement les URLs des backends (`AUTH_SERVICE_URL`, `LEARNING_SERVICE_URL`) au format `https://app-<APP_ID>.cleverapps.io`.

---

## Prérequis

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- [clever-tools](https://www.clever.cloud/developers/doc/cli/) — `npm install -g clever-tools`
- Compte Clever Cloud
- Dépôt GitHub contenant `services/` et `terraform/` (public ou privé avec PAT)

---

## Déploiement — étape par étape

### 1. Obtenir les credentials Clever Cloud

```powershell
clever login
clever profile
```

Noter l'**organisation** (`user_xxx` ou `orga_xxx`).

**OAuth pour Terraform** — une des deux options :

```powershell
# Option A — variables d'environnement
$env:CC_OAUTH_TOKEN    = "<token>"
$env:CC_OAUTH_SECRET   = "<secret>"
$env:CC_ORGANISATION  = "user_xxx"

# Option B — dans terraform.tfvars (voir étape 2)
```

### 2. Créer un Personal Access Token GitHub

Pour un dépôt **privé**, créer un fine-grained PAT avec accès **lecture** au dépôt :

GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/personal-access-tokens)

Format attendu dans `terraform.tfvars` : `"VOTRE_USER_GITHUB:ghp_VOTRE_PAT"`

### 3. Configurer les variables

```powershell
cd terraform
copy terraform.tfvars.example terraform.tfvars
```

Éditer `terraform.tfvars` :

```hcl
organisation = "user_xxx"
oauth_token  = "..."
oauth_secret = "..."
region       = "par"
jwt_secret   = "un-secret-long-et-aleatoire"

# Déploiement auto du code depuis GitHub
git_repository              = "https://github.com/VOTRE_USER/learnflow.git"
git_branch                  = "master"
github_authentication_basic = "VOTRE_USER_GITHUB:ghp_VOTRE_PAT"  # requis si dépôt privé
```

> `terraform.tfvars` ne doit **jamais** être commité (contient des secrets).

### 4. Initialiser Terraform

```powershell
terraform init
```

Télécharge le provider [`CleverCloud/clevercloud`](https://registry.terraform.io/providers/CleverCloud/clevercloud/latest/docs) v2.x.

### 5. Prévisualiser

```powershell
terraform plan
```

Attendu : **5 ressources à créer** (2 PostgreSQL + 3 Docker).

### 6. Déployer (infra + code)

```powershell
terraform apply
```

Terraform :
1. Crée les 2 PostgreSQL et les 3 apps Docker
2. Configure les variables d'environnement et les dépendances
3. **Clone le dépôt GitHub** et build chaque `Dockerfile` (`APP_FOLDER`)
4. Démarre les conteneurs sur le port **8080**

### 7. Vérifier

```powershell
curl.exe "$(terraform output -raw auth_health_url)"
curl.exe "$(terraform output -raw learning_health_url)"
curl.exe "$(terraform output -raw frontend_url)/api/courses"
```

Réponses attendues :

```json
{"status":"ok","service":"auth"}
{"status":"ok","service":"learning"}
{"courses":[]}
```

Ouvrir l'URL du frontend :

```powershell
terraform output -raw frontend_url
```

> **Mise à jour du code :** modifier le dépôt GitHub puis relancer `terraform apply` (Terraform redéploie depuis la branche configurée).

---

## Déploiement manuel (alternative)

Si `git_repository` est laissé vide dans `terraform.tfvars`, Terraform crée uniquement l'infrastructure. Le code se déploie ensuite via `git push` vers les URLs affichées par `terraform output` (`auth_deploy_url`, etc.).

---

## Variables d'environnement (gérées par Terraform)

### Auth & Learning

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `JWT_SECRET` | même valeur sur les deux services |
| `CC_HEALTH_CHECK_PATH` | `/api/health` |
| `APP_FOLDER` | `services/auth-service` ou `services/learning-service` |
| `POSTGRESQL_ADDON_*` | injectées automatiquement via `dependencies` |

### Frontend

| Variable | Valeur |
|----------|--------|
| `APP_FOLDER` | `services/frontend` |
| `AUTH_SERVICE_URL` | URL auto du backend auth |
| `LEARNING_SERVICE_URL` | URL auto du backend learning |

---

## Structure `services/`

```
services/
├── auth-service/
│   ├── Dockerfile
│   ├── src/              # API Express (register, login, JWT)
│   └── sql/init.sql      # Schéma users (migrations au démarrage)
├── learning-service/
│   ├── Dockerfile
│   ├── src/              # API Express (cours, leçons, inscriptions)
│   └── sql/init.sql      # Schéma courses, lessons, enrollments
└── frontend/
    ├── Dockerfile        # Build React + nginx
    ├── nginx.conf.template
    └── src/              # Interface React (catalogue, dashboards)
```

Chaque service écoute sur le port **8080** en production (requis par Clever Cloud Docker).

---

## Règles importantes

| Règle | Détail |
|-------|--------|
| Port | Toutes les apps sur **8080** |
| Monorepo | `APP_FOLDER` pointe vers le sous-dossier contenant le `Dockerfile` |
| JWT | `jwt_secret` identique sur auth et learning |
| URLs | Format Clever Cloud : `app-<APP_ID>.cleverapps.io` (pas le nom de l'app) |
| Secrets | `terraform.tfvars` gitignored — ne jamais committer |
| Destroy | `terraform destroy` supprime toute l'infrastructure |

---

## Commandes utiles

```powershell
terraform plan              # Prévisualiser
terraform apply             # Créer / modifier
terraform output            # Voir URLs et deploy URLs
terraform destroy           # Tout supprimer
clever logs --app <nom>     # Logs runtime (après git push)
```

---

## Références

- [Provider Terraform CleverCloud/clevercloud](https://registry.terraform.io/providers/CleverCloud/clevercloud/latest/docs)
- [Clever Cloud — Docker](https://www.clever.cloud/developers/doc/applications/docker/)
- [Clever Cloud — PostgreSQL add-on](https://www.clever.cloud/developers/doc/addons/postgresql/)
