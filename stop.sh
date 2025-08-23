#!/bin/bash

# Stop Script - Cleanly shutdown all Pactoria services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Pactoria Services...${NC}"
echo ""

# Stop any running Next.js processes
if pgrep -f "next dev" > /dev/null; then
    echo "Stopping Next.js development server..."
    pkill -f "next dev"
    echo -e "${GREEN}✓${NC} Next.js stopped"
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Check if Supabase is running
if command -v supabase >/dev/null 2>&1; then
    if supabase status >/dev/null 2>&1; then
        echo "Stopping Supabase services..."
        supabase stop
        echo -e "${GREEN}✓${NC} Supabase stopped"
    else
        echo "Supabase is not running"
    fi
fi

# Optional: Stop Docker containers if using docker-compose
if [ -f docker-compose.yml ] && command -v docker-compose >/dev/null 2>&1; then
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        echo "Stopping Docker Compose services..."
        docker-compose down
        echo -e "${GREEN}✓${NC} Docker Compose services stopped"
    fi
fi

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"
