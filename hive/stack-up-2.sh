#!/bin/bash

# Step 4: Build images fresh
echo "🏗️ Building images..."
docker compose -f $COMPOSE_FILE build  

docker compose -f $COMPOSE_FILE up --build --no-start

# Step 5: Start containers in detached mode
echo "⚡ Starting containers..."
docker compose -f $COMPOSE_FILE start 


# # Create containers of the docker stack.
# docker compose --profile Base build
# docker compose --profile Running up --build --no-start

# # Start the docker stack.
# docker compose --profile Running start
