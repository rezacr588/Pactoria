#!/bin/bash

# Quick Start Script - For when everything is already configured
# This is a simplified version that assumes prerequisites are met

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pactoria Quick Start${NC}"
echo ""

# Navigate to web directory
cd "$(dirname "$0")/apps/web"

# Start Supabase if not running
if ! supabase status >/dev/null 2>&1; then
    echo "Starting Supabase..."
    supabase start
else
    echo "Supabase is already running ✓"
fi

echo ""
echo -e "${GREEN}Services available at:${NC}"
echo "  • Web App:        http://localhost:3000"
echo "  • Supabase Studio: http://127.0.0.1:54323"
echo "  • Email Testing:   http://127.0.0.1:54324"
echo ""

# Start Next.js
echo "Starting Next.js development server..."
npm run dev
