terraform {
  required_version = ">= 1.10"

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.83"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.29"
    }
  }

  backend "cos" {
    region = "ap-singapore"
    prefix = "booking-system"
    key    = "prod.tfstate"
  }
}

provider "tencentcloud" {
  region = var.region
}

provider "cloudflare" {}
