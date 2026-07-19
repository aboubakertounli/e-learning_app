# =============================================================================
# MAIN — Locals + ressources Clever Cloud
# =============================================================================

# ─── Locals (URLs auto + déploiement Git optionnel) ──────────────────────────

locals {
  auth_url     = "https://${replace(clevercloud_docker.auth.id, "app_", "app-")}.cleverapps.io"
  learning_url = "https://${replace(clevercloud_docker.learning.id, "app_", "app-")}.cleverapps.io"
  frontend_url = "https://${replace(clevercloud_docker.frontend.id, "app_", "app-")}.cleverapps.io"

  deployment_block = var.git_repository != "" ? merge({
    repository = var.git_repository
    commit       = "refs/heads/${var.git_branch}"
    }, var.github_authentication_basic != "" ? {
    authentication_basic = var.github_authentication_basic
  } : {}) : null
}

# ─── PostgreSQL (database-per-service) ───────────────────────────────────────

resource "clevercloud_postgresql" "auth" {
  name   = var.auth_db_name
  plan   = var.postgresql_plan
  region = var.region
}

resource "clevercloud_postgresql" "learning" {
  name   = var.learning_db_name
  plan   = var.postgresql_plan
  region = var.region
}

# ─── Auth service ────────────────────────────────────────────────────────────

resource "clevercloud_docker" "auth" {
  name               = var.auth_app_name
  region             = var.region
  min_instance_count = 1
  max_instance_count = 1
  smallest_flavor    = var.instance_flavor
  biggest_flavor     = var.instance_flavor

  app_folder     = "services/auth-service"
  container_port = 8080
  redirect_https = true

  dependencies = [clevercloud_postgresql.auth.id]

  environment = {
    NODE_ENV             = "production"
    PORT                 = "8080"
    JWT_SECRET           = var.jwt_secret
    JWT_EXPIRES_IN       = "7d"
    CC_HEALTH_CHECK_PATH = "/api/health"
    APP_FOLDER           = "services/auth-service"
  }

  dynamic "deployment" {
    for_each = local.deployment_block != null ? [local.deployment_block] : []
    content {
      repository           = deployment.value.repository
      commit               = deployment.value.commit
      authentication_basic = lookup(deployment.value, "authentication_basic", null)
    }
  }
}

# ─── Learning service ─────────────────────────────────────────────────────────

resource "clevercloud_docker" "learning" {
  name               = var.learning_app_name
  region             = var.region
  min_instance_count = 1
  max_instance_count = 1
  smallest_flavor    = var.instance_flavor
  biggest_flavor     = var.instance_flavor

  app_folder     = "services/learning-service"
  container_port = 8080
  redirect_https = true

  dependencies = [clevercloud_postgresql.learning.id]

  environment = {
    NODE_ENV             = "production"
    PORT                 = "8080"
    JWT_SECRET           = var.jwt_secret
    CC_HEALTH_CHECK_PATH = "/api/health"
    APP_FOLDER           = "services/learning-service"
  }

  dynamic "deployment" {
    for_each = local.deployment_block != null ? [local.deployment_block] : []
    content {
      repository           = deployment.value.repository
      commit               = deployment.value.commit
      authentication_basic = lookup(deployment.value, "authentication_basic", null)
    }
  }
}

# ─── Frontend (proxy nginx → backends) ───────────────────────────────────────

resource "clevercloud_docker" "frontend" {
  name               = var.frontend_app_name
  region             = var.region
  min_instance_count = 1
  max_instance_count = 1
  smallest_flavor    = var.instance_flavor
  biggest_flavor     = var.instance_flavor

  app_folder     = "services/frontend"
  container_port = 8080
  redirect_https = true

  dependencies = [
    clevercloud_docker.auth.id,
    clevercloud_docker.learning.id,
  ]

  environment = {
    APP_FOLDER           = "services/frontend"
    AUTH_SERVICE_URL     = local.auth_url
    LEARNING_SERVICE_URL = local.learning_url
  }

  dynamic "deployment" {
    for_each = local.deployment_block != null ? [local.deployment_block] : []
    content {
      repository           = deployment.value.repository
      commit               = deployment.value.commit
      authentication_basic = lookup(deployment.value, "authentication_basic", null)
    }
  }

  depends_on = [
    clevercloud_docker.auth,
    clevercloud_docker.learning,
  ]
}
