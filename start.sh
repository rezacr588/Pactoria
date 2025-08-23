#!/bin/bash

# Pactoria Contract Management Platform - Startup Script
# This script starts all necessary services for the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is running
is_docker_running() {
    docker info >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    print_error "$service_name failed to start within 60 seconds"
    return 1
}

# ASCII Art Banner
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Pactoria Contract Management Platform              ║"
echo "║     Real-time Collaborative Contract Management        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 20 or later."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_warning "Node.js version is below 20. Consider upgrading for better compatibility."
fi

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check Docker
if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker Desktop."
    echo "Visit: https://docs.docker.com/desktop/"
    exit 1
fi

# Check Supabase CLI
if ! command_exists supabase; then
    print_error "Supabase CLI is not installed. Installing..."
    if command_exists brew; then
        brew install supabase/tap/supabase
    else
        npm install -g supabase
    fi
fi

print_success "All prerequisites are installed!"

# Step 2: Start Docker if not running
if ! is_docker_running; then
    print_status "Docker is not running. Starting Docker Desktop..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open -a Docker
        print_status "Waiting for Docker to start (this may take a minute)..."
        
        # Wait for Docker to be ready
        DOCKER_ATTEMPTS=0
        while ! is_docker_running && [ $DOCKER_ATTEMPTS -lt 30 ]; do
            sleep 2
            DOCKER_ATTEMPTS=$((DOCKER_ATTEMPTS + 1))
        done
        
        if ! is_docker_running; then
            print_error "Docker failed to start. Please start Docker Desktop manually and run this script again."
            exit 1
        fi
    else
        print_error "Please start Docker manually and run this script again."
        exit 1
    fi
fi

print_success "Docker is running!"

# Step 3: Navigate to web directory and setup environment
cd "$(dirname "$0")/apps/web" || exit 1
print_status "Working directory: $(pwd)"

# Check for .env.local file
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        print_warning ".env.local not found. Creating from .env.example..."
        cp .env.example .env.local
        print_warning "Please update .env.local with your Supabase credentials!"
        print_status "Opening .env.local for editing..."
        ${EDITOR:-nano} .env.local
    else
        print_error ".env.local file not found and no .env.example available!"
        print_status "Please create .env.local with the following variables:"
        echo "  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>"
        echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
        exit 1
    fi
else
    # Verify that required environment variables are set
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local || ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
        print_warning "Required environment variables may not be set in .env.local"
        print_status "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured."
    else
        print_success "Environment configuration found!"
    fi
fi

# Step 4: Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    print_status "Installing dependencies..."
    npm install
    
    # Install Playwright browsers if needed for E2E testing
    if [ -f "playwright.config.ts" ]; then
        print_status "Installing Playwright browsers for E2E testing..."
        npx playwright install
    fi
else
    print_status "Dependencies already installed. Checking for updates..."
    npm install
fi

print_success "Dependencies are ready!"

# Step 5: Start Supabase
print_status "Starting Supabase services..."

# Check if Supabase is already running
SUPABASE_STATUS=$(supabase status 2>&1 || true)
if echo "$SUPABASE_STATUS" | grep -q "supabase is not running"; then
    supabase start
else
    print_status "Supabase is already running. Restarting to ensure clean state..."
    supabase stop
    sleep 2
    supabase start
fi

# Get Supabase status and display URLs
print_success "Supabase services started!"
echo ""
print_status "Supabase Service URLs:"
echo "  📡 API URL:     http://127.0.0.1:54321"
echo "  🎨 Studio URL:  http://127.0.0.1:54323"
echo "  📧 Inbucket:    http://127.0.0.1:54324 (email testing)"
echo "  🗄️  DB URL:      postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""

# Step 6: Run database migrations (if any)
if [ -d "../../supabase/migrations" ] && [ "$(ls -A ../../supabase/migrations 2>/dev/null)" ]; then
    print_status "Applying database migrations..."
    supabase db push
    print_success "Database migrations applied!"
fi

# Step 7: Generate TypeScript types
print_status "Generating TypeScript types from database schema..."
supabase gen types typescript --local > ../../types/supabase.ts 2>/dev/null || true

# Step 8: Start Next.js development server
print_status "Starting Next.js development server..."
echo ""
echo "════════════════════════════════════════════════════════"
echo "  🚀 Application starting at http://localhost:3000"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Available commands (in a new terminal):"
echo "  • npm run build        - Build for production"
echo "  • npm run test:e2e     - Run E2E tests"
echo "  • npm run lint         - Run linting"
echo "  • npm run type-check   - Check TypeScript types"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "════════════════════════════════════════════════════════"
echo ""

# Trap Ctrl+C to cleanup
trap cleanup INT

cleanup() {
    echo ""
    print_status "Shutting down services..."
    
    # Ask if user wants to stop Supabase
    read -p "Stop Supabase services as well? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase stop
        print_success "Supabase stopped"
    fi
    
    print_success "Application stopped. Goodbye!"
    exit 0
}

# Start the Next.js dev server
npm run dev
