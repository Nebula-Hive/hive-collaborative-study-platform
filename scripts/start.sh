#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HIVE_DIR="$PROJECT_ROOT/hive"

safe_clear() {
  if [ -n "${TERM:-}" ] && command -v clear >/dev/null 2>&1; then
    clear
  else
    printf '\n'
  fi
}

safe_clear

echo ""

echo -e "${CYAN}              🐝  HIVE PLATFORM STARTUP  🐝               ${NC}"
echo -e "${CYAN}          Collaborative Study Platform Setup             ${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}✗ Error: Docker is not running${NC}"
  echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Change to hive directory
cd "$HIVE_DIR" || {
  echo -e "${RED}✗ Error: Could not find hive directory${NC}"
  exit 1
}

collect_changed_files() {
  {
    git -C "$PROJECT_ROOT" diff --name-only HEAD -- 2>/dev/null
    git -C "$PROJECT_ROOT" diff --name-only --cached -- 2>/dev/null
    git -C "$PROJECT_ROOT" ls-files --others --exclude-standard 2>/dev/null
  } | awk 'NF' | sort -u
}

map_file_to_service() {
  case "$1" in
    hive/frontend/*)
      echo "frontend"
      ;;
    hive/services/api-gateway/*)
      echo "api-gateway"
      ;;
    hive/services/auth-service/*)
      echo "auth-service"
      ;;
    hive/services/chat-service/*)
      echo "chat-service"
      ;;
    hive/services/note-service/*)
      echo "note-service"
      ;;
    hive/services/progress-service/*)
      echo "progress-service"
      ;;
    hive/services/rag-service/*)
      echo "rag-service"
      ;;
    hive/services/resource-service/*)
      echo "resource-service"
      ;;
    hive/services/session-service/*)
      echo "session-service"
      ;;
    hive/services/user-service/*)
      echo "user-service"
      ;;
    hive/frontend/package.json|hive/frontend/Dockerfile)
      echo "frontend"
      ;;
    hive/services/api-gateway/package.json|hive/services/api-gateway/Dockerfile)
      echo "api-gateway"
      ;;
    hive/services/auth-service/package.json|hive/services/auth-service/Dockerfile)
      echo "auth-service"
      ;;
    hive/services/chat-service/package.json|hive/services/chat-service/Dockerfile)
      echo "chat-service"
      ;;
    hive/services/note-service/package.json|hive/services/note-service/Dockerfile)
      echo "note-service"
      ;;
    hive/services/progress-service/package.json|hive/services/progress-service/Dockerfile)
      echo "progress-service"
      ;;
    hive/services/rag-service/requirements.txt|hive/services/rag-service/Dockerfile)
      echo "rag-service"
      ;;
    hive/services/resource-service/package.json|hive/services/resource-service/Dockerfile)
      echo "resource-service"
      ;;
    hive/services/session-service/package.json|hive/services/session-service/Dockerfile)
      echo "session-service"
      ;;
    hive/services/user-service/package.json|hive/services/user-service/Dockerfile)
      echo "user-service"
      ;;
    hive/docker-compose.yml|hive/.env|hive/.env.example)
      echo "__full_stack__"
      ;;
  esac
}

compose_targets=()
compose_mode="plain"

target_exists() {
  local candidate
  for candidate in "${compose_targets[@]}"; do
    if [ "$candidate" = "$1" ]; then
      return 0
    fi
  done
  return 1
}

build_start_plan() {
  local changed_files file service
  changed_files="$(collect_changed_files)"
  compose_targets=()
  compose_mode="plain"

  if [ -z "$changed_files" ]; then
    return
  fi

  while IFS= read -r file; do
    [ -n "$file" ] || continue
    service="$(map_file_to_service "$file")"
    case "$service" in
      __full_stack__)
        compose_mode="full"
        compose_targets=()
        return
        ;;
      "")
        continue
        ;;
      *)
        if ! target_exists "$service"; then
          compose_targets+=("$service")
        fi
        ;;
    esac
  done <<EOF
$changed_files
EOF

  if [ ${#compose_targets[@]} -gt 0 ]; then
    compose_mode="targeted"
  fi
}

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠ Warning: .env file not found${NC}"
  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your actual credentials${NC}"
  else
    echo -e "${RED}✗ Error: .env.example not found${NC}"
    exit 1
  fi
  echo ""
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Starting Services                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}Stopping any existing containers...${NC}"
#docker compose down > /dev/null 2>&1
# Stop any services running already.
# docker compose stop
docker compose down

# Clean docker system wide settings.
docker system prune -a -f 

# Clean some docker volumes.
docker volume prune -f

echo -e "${GREEN}✓ Cleaned up existing containers${NC}"
echo ""

# Start services
build_start_plan

if [ "$compose_mode" = "targeted" ]; then
  echo -e "${YELLOW}Starting only changed services with Docker Compose...${NC}"
elif [ "$compose_mode" = "full" ]; then
  echo -e "${YELLOW}Starting the full stack because shared config changed...${NC}"
else
  echo -e "${YELLOW}Starting services without rebuilding images...${NC}"
fi

echo -e "${BLUE}This may take a few minutes on first run...${NC}"
echo ""

# Build all the images (including base images).
docker compose build

# Create containers of the docker stack.
docker compose  up --no-start

# Start the docker stack.
docker compose start


start_compose
compose_status=$?

if [ "$compose_status" -ne 0 ]; then
  echo ""
  echo -e "${YELLOW}Initial start failed; retrying after a clean shutdown...${NC}"
  docker compose down --remove-orphans > /dev/null 2>&1
  sleep 3
  compose_mode="full"
  start_compose
  compose_status=$?
fi

if [ "$compose_status" -ne 0 ]; then
  echo ""
  echo -e "${RED}✗ Error: Failed to start services${NC}"
  echo -e "${YELLOW}Check the logs above for details${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Docker Compose started successfully${NC}"
echo ""

# Wait for services to become healthy
echo -e "${BLUE}              Waiting for Services to be Healthy          ${NC}"
echo ""
echo -e "${YELLOW}This usually takes 1-2 minutes...${NC}"
echo ""

# Run the wait-for-healthy script
"$SCRIPT_DIR/wait-for-healthy.sh"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${CYAN}]             HIVE PLATFORM IS READY!                 ${NC}"
  echo ""
  echo -e "${BLUE}Quick Commands:${NC}"
  echo -e "  ${GREEN}$SCRIPT_DIR/check-health.sh${NC}     - Check service health status"
  echo -e "  ${GREEN}docker compose logs -f${NC} - View all logs (from hive/ directory)"
  echo -e "  ${GREEN}docker compose ps${NC}      - List all containers (from hive/ directory)"
  echo -e "  ${GREEN}docker compose down${NC}    - Stop all services (from hive/ directory)"
  echo ""
else
  echo ""
  echo -e "${RED}Some services failed to become healthy${NC}"
  echo -e "${YELLOW}Run '$SCRIPT_DIR/check-health.sh' to see which services need attention${NC}"
  exit 1
fi
