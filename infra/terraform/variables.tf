variable "region" {
  description = "Tencent Cloud region the server lives in."
  type        = string
  default     = "ap-singapore"
}

variable "admin_cidr" {
  description = "The only address allowed to SSH in, e.g. 203.0.113.7/32. Set it in terraform.tfvars."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0)) && var.admin_cidr != "0.0.0.0/0"
    error_message = "admin_cidr must be a CIDR block (like 203.0.113.7/32), and not the whole internet."
  }
}
