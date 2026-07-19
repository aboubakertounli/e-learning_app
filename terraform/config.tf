# =============================================================================
# CONFIG — Provider, versions, variables
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    clevercloud = {
      source  = "CleverCloud/clevercloud"
      version = "~> 2.0"
    }
  }
}

provider "clevercloud" {
  organisation = var.organisation
  token        = var.oauth_token != "" ? var.oauth_token : null
  secret       = var.oauth_secret != "" ? var.oauth_secret : null
}

# ─── Organisation ─────────────────────────────────────────────────────────────

variable "organisation" {
  description = "ID organisation Clever Cloud (user_xxx ou orga_xxx)"
  type        = string
}

variable "oauth_token" {
  description = "OAuth1 token Clever Cloud (ou via CC_OAUTH_TOKEN)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oauth_secret" {
  description = "OAuth1 secret Clever Cloud (ou via CC_OAUTH_SECRET)"
  type        = string
  sensitive   = true
  default     = ""
}

# ─── Région & sizing ─────────────────────────────────────────────────────────

variable "region" {
  description = "Région Clever Cloud"
  type        = string
  default     = "par"
}

variable "postgresql_plan" {
  description = "Plan PostgreSQL (dev, s, m, …)"
  type        = string
  default     = "dev"
}

variable "instance_flavor" {
  description = "Taille d'instance des applications Docker"
  type        = string
  default     = "XS"
}

# ─── Noms des ressources ─────────────────────────────────────────────────────

variable "auth_app_name" {
  type    = string
  default = "learnflow-tf-auth"
}

variable "learning_app_name" {
  type    = string
  default = "learnflow-tf-learning"
}

variable "frontend_app_name" {
  type    = string
  default = "learnflow-tf-frontend"
}

variable "auth_db_name" {
  type    = string
  default = "postgresql-tf-auth"
}

variable "learning_db_name" {
  type    = string
  default = "postgresql-tf-learning"
}

# ─── Application ─────────────────────────────────────────────────────────────

variable "jwt_secret" {
  description = "Secret JWT partagé entre auth et learning"
  type        = string
  sensitive   = true
}

# ─── Déploiement Git (optionnel) ─────────────────────────────────────────────

variable "git_repository" {
  description = "URL du dépôt Git — vide = infra seulement, code via git push"
  type        = string
  default     = ""
}

variable "git_branch" {
  description = "Branche à déployer"
  type        = string
  default     = "master"
}

variable "github_authentication_basic" {
  description = "Auth dépôt privé GitHub : USER:PAT_TOKEN"
  type        = string
  sensitive   = true
  default     = ""
}
