output "public_ip" {
  description = "The server's public IPv4 address."
  value       = one(tencentcloud_lighthouse_instance.prod.public_addresses)
}

output "app_url" {
  description = "Where the app is served once Caddy is up."
  value       = "https://${cloudflare_dns_record.app.name}"
}
