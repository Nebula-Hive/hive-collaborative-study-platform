#!/bin/bash

# ==============================
# Safe Docker Compose Automation (Docker Compose v2+ plugin)
# ==============================
# Stops, cleans, rebuilds, and starts your Docker Compose project safely.
# Usage: ./docker_up_safe.sh
# Optional: set PRUNE=true to remove unused images/volumes for this project only


COMPOSE_FILE="docker-compose.yml"
PRUNE=${PRUNE:-false}  # Set PRUNE=true if you want to clean unused images/volumes

echo "🚀 Starting Docker Compose automation..."

# Step 1: Stop and remove containers, networks, and volumes for this project
echo "🛑 Stopping and removing containers..."
docker compose -f $COMPOSE_FILE stop 
docker system prune -a -f
docker volume prune -a -f

# Step 2 (Optional): Remove dangling images and volumes safely
if [ "$PRUNE" = true ]; then
    echo "🧹 Removing unused images and volumes for this project..."

    # Remove dangling images (untagged)
    dangling_images=$(docker images -f "dangling=true" -q)
    if [ -n "$dangling_images" ]; then
        docker rmi $dangling_images || echo "⚠️ Some images could not be removed"
    else
        echo "No dangling images to remove"
    fi

    # Remove unused volumes
    unused_volumes=$(docker volume ls -qf "dangling=true")
    if [ -n "$unused_volumes" ]; then
        docker volume rm $unused_volumes || echo "⚠️ Some volumes could not be removed"
    else
        echo "No unused volumes to remove"
    fi
fi

# Step 3: Pull latest images
echo "⬇️ Pulling latest images..."
docker compose -f $COMPOSE_FILE pull

# Step 4: Build images fresh
echo "🏗️ Building images..."
docker compose -f $COMPOSE_FILE build --no-cache

# Step 5: Start containers in detached mode
echo "⚡ Starting containers..."
docker compose -f $COMPOSE_FILE up -d

