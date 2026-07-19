# =============================================================================
# OUTPUTS — URLs, IDs, deploy URLs
# =============================================================================

output "auth_app_id" {
  description = "ID de l'application auth"
  value       = clevercloud_docker.auth.id
}

output "learning_app_id" {
  description = "ID de l'application learning"
  value       = clevercloud_docker.learning.id
}

output "frontend_app_id" {
  description = "ID de l'application frontend"
  value       = clevercloud_docker.frontend.id
}

output "auth_url" {
  description = "URL publique du service auth"
  value       = local.auth_url
}

output "learning_url" {
  description = "URL publique du service learning"
  value       = local.learning_url
}

output "frontend_url" {
  description = "URL publique du frontend"
  value       = local.frontend_url
}

output "auth_health_url" {
  value = "${local.auth_url}/api/health"
}

output "learning_health_url" {
  value = "${local.learning_url}/api/health"
}

output "auth_deploy_url" {
  description = "URL Git SSH pour déployer le code (auth)"
  value       = clevercloud_docker.auth.deploy_url
}

output "learning_deploy_url" {
  description = "URL Git SSH pour déployer le code (learning)"
  value       = clevercloud_docker.learning.deploy_url
}

output "frontend_deploy_url" {
  description = "URL Git SSH pour déployer le code (frontend)"
  value       = clevercloud_docker.frontend.deploy_url
}

output "auth_postgresql_host" {
  description = "Host PostgreSQL auth (sensible)"
  value       = clevercloud_postgresql.auth.host
  sensitive   = true
}

output "learning_postgresql_host" {
  description = "Host PostgreSQL learning (sensible)"
  value       = clevercloud_postgresql.learning.host
  sensitive   = true
}
