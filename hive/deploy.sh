#!/bin/bash
set -e

# Called by the CD pipeline via SSH
# Usage: ./deploy.sh <ECR_REGISTRY> <IMAGE_TAG> <AWS_REGION>

ECR_REGISTRY=$1
IMAGE_TAG=$2
AWS_REGION=$3

APP_DIR="/home/ubuntu/hive"

echo "==> Starting deployment: $IMAGE_TAG"
cd "$APP_DIR"

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "==> Exporting image vars..."
export ECR_REGISTRY="$ECR_REGISTRY"
export IMAGE_TAG="$IMAGE_TAG"

echo "==> Pulling new images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

echo "==> Stopping old containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans

echo "==> Starting new containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deployment complete: $IMAGE_TAG"
