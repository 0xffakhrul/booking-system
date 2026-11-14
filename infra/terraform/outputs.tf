output "public_ip" {
  description = "The server's public IPv4 address."
  value       = one(tencentcloud_lighthouse_instance.prod.public_addresses)
}
