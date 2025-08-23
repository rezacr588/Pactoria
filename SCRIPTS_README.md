# Pactoria Startup Scripts

This project includes several convenience scripts to help you run the Pactoria Contract Management Platform.

## Available Scripts

### 🚀 `./start.sh` - Full Startup Script
The comprehensive startup script that handles everything from checking prerequisites to starting all services.

**Features:**
- Checks for all required dependencies (Node.js 20+, Docker, Supabase CLI)
- Automatically starts Docker Desktop if not running (macOS)
- Sets up environment variables from `.env.example` if needed
- Installs npm dependencies and Playwright browsers
- Starts Supabase services (database, auth, realtime, storage)
- Runs database migrations
- Generates TypeScript types from database schema
- Starts the Next.js development server
- Provides graceful shutdown with Ctrl+C

**Usage:**
```bash
./start.sh
```

### ⚡ `./quick-start.sh` - Quick Start
A simplified script for when everything is already configured and you just want to start the services quickly.

**Prerequisites:**
- Dependencies already installed
- `.env.local` already configured
- Docker already running

**Usage:**
```bash
./quick-start.sh
```

### 🛑 `./stop.sh` - Stop All Services
Cleanly stops all running services including Next.js and Supabase.

**Usage:**
```bash
./stop.sh
```

## Docker Compose Alternative

If you prefer using Docker Compose for everything (including the web app):

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Manual Commands

If you prefer to run commands manually:

```bash
# Navigate to web directory
cd apps/web

# Start Supabase
supabase start

# In a new terminal, start Next.js
npm run dev

# To stop Supabase
supabase stop
```

## Service URLs

Once running, the following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| Web Application | http://localhost:3000 | Main Next.js application |
| Supabase Studio | http://127.0.0.1:54323 | Database management UI |
| API Gateway | http://127.0.0.1:54321 | Supabase API endpoint |
| Email Testing | http://127.0.0.1:54324 | Inbucket for testing emails |
| PostgreSQL | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct database connection |

## Troubleshooting

### Docker not starting
- Ensure Docker Desktop is installed: https://docs.docker.com/desktop/
- On macOS, the script will try to start Docker automatically
- On other systems, start Docker manually before running the scripts

### Port conflicts
If you get port conflict errors:
```bash
# Check what's using port 3000 (Next.js)
lsof -i :3000

# Check what's using port 54321-54324 (Supabase)
lsof -i :54321
```

### Supabase issues
```bash
# Reset Supabase completely
supabase stop --backup
supabase db reset

# Check Supabase status
supabase status
```

### Node.js version issues
The application requires Node.js 20 or later. Check your version:
```bash
node --version
```

If you need to upgrade, consider using nvm:
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20
```

## Development Workflow

1. **First time setup**: Run `./start.sh` - it will guide you through the complete setup
2. **Daily development**: Run `./quick-start.sh` for faster startup
3. **Stopping work**: Run `./stop.sh` or press Ctrl+C in the terminal
4. **Running tests**: `npm run test:e2e` (in the apps/web directory)
5. **Building for production**: `npm run build` (in the apps/web directory)

## Notes

- The scripts are designed for macOS/Linux. Windows users should use WSL or Git Bash.
- Always ensure your `.env.local` file is properly configured with Supabase credentials.
- The `start.sh` script includes safety checks and will not proceed if prerequisites are missing.
- Data in local Supabase is persistent between restarts unless you explicitly reset the database.
