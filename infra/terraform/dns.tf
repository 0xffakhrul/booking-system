resource "cloudflare_dns_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = var.app_hostname
  type    = "A"
  content = one(tencentcloud_lighthouse_instance.prod.public_addresses)
  ttl     = 300
  proxied = false
  comment = "booking-system, managed by Terraform"
}
