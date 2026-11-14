
resource "tencentcloud_lighthouse_instance" "prod" {
  instance_name = "booking-prod"
  zone          = "ap-singapore-3"
  bundle_id     = "bundle_starter_nmc_lin_med2_01"
  blueprint_id  = "lhbp-1l4ptuvm" # Ubuntu 24.04
  renew_flag    = "NOTIFY_AND_AUTO_RENEW"

  lifecycle {
    prevent_destroy = true
    ignore_changes = [blueprint_id]
  }
}

resource "tencentcloud_lighthouse_key_pair" "deploy" {
  key_name = "booking"
}

resource "tencentcloud_lighthouse_key_pair_attachment" "deploy" {
  key_id      = tencentcloud_lighthouse_key_pair.deploy.id
  instance_id = tencentcloud_lighthouse_instance.prod.id
}

resource "tencentcloud_lighthouse_firewall_rule" "prod" {
  instance_id = tencentcloud_lighthouse_instance.prod.id

  firewall_rules {
    protocol                  = "TCP"
    port                      = "22"
    cidr_block                = var.admin_cidr
    action                    = "ACCEPT"
    firewall_rule_description = "SSH from admin only"
  }

  firewall_rules {
    protocol                  = "TCP"
    port                      = "80"
    cidr_block                = "0.0.0.0/0"
    action                    = "ACCEPT"
    firewall_rule_description = "HTTP, redirects to HTTPS"
  }

  firewall_rules {
    protocol                  = "TCP"
    port                      = "443"
    cidr_block                = "0.0.0.0/0"
    action                    = "ACCEPT"
    firewall_rule_description = "HTTPS"
  }

  firewall_rules {
    protocol                  = "UDP"
    port                      = "443"
    cidr_block                = "0.0.0.0/0"
    action                    = "ACCEPT"
    firewall_rule_description = "HTTP/3"
  }

  firewall_rules {
    protocol                  = "ICMP"
    port                      = "ALL"
    cidr_block                = "0.0.0.0/0"
    action                    = "ACCEPT"
    firewall_rule_description = "Ping"
  }
}
