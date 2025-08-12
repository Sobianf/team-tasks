#!/bin/bash
set -euxo pipefail

# Update the package list
apt-get update -y

# Install Docker and curl
apt-get install -y docker.io curl

# Enable and start Docker service
systemctl enable docker
systemctl start docker

# Add the default admin user to the docker group
usermod -aG docker azureuser || true
