terraform {
  required_version = ">= 1.10"

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.83"
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
