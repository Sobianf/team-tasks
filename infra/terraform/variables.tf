variable "location" {
  description = "Azure region for resources"
  default     = "Central India"
}

variable "vm_size" {
  description = "Size of the virtual machine"
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  default     = "azureuser"
}

variable "ssh_source_cidr" {
  description = "CIDR allowed to SSH (lock to your IP for security)"
  default     = "*"
}

variable "ssh_pubkey_path" {
  description = "Path to your SSH public key file"
  default     = "~/.ssh/id_rsa.pub"
}

variable "app_port" {
  description = "Public application port to allow inbound"
  default     = 80
}
