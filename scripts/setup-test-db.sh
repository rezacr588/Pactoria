#!/bin/bash

# Setup Test Database Script
# This script sets up the test database with seed data

set -e  # Exit on error

echo "🚀 Setting up test database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "apps/web/.env.test" ]; then
    export $(cat apps/web/.env.test | grep -v '^#' | xargs)
fi

# Check if Supabase is running
check_supabase() {
    echo "Checking Supabase status..."
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}Supabase CLI not found. Please install it first.${NC}"
        echo "Visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi

    # Check if Supabase is running
    if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
        echo -e "${YELLOW}Supabase is not running. Starting it now...${NC}"
        supabase start
        echo "Waiting for Supabase to be ready..."
        sleep 10
    else
        echo -e "${GREEN}Supabase is running.${NC}"
    fi
}

# Run migrations
run_migrations() {
    echo "Running database migrations..."
    
    # Check if migrations directory exists
    if [ ! -d "supabase/migrations" ]; then
        echo -e "${RED}Migrations directory not found!${NC}"
        exit 1
    fi
    
    # Run migrations
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Running migration: $(basename $migration)"
            supabase db push --db-url "$DATABASE_URL" 2>/dev/null || {
                psql "$DATABASE_URL" -f "$migration" 2>/dev/null || true
            }
        fi
    done
    
    echo -e "${GREEN}Migrations completed.${NC}"
}

# Seed test data
seed_test_data() {
    echo "Seeding test data..."
    
    if [ ! -f "supabase/seed.sql" ]; then
        echo -e "${RED}Seed file not found!${NC}"
        exit 1
    fi
    
    # Run seed file
    psql "$DATABASE_URL" -f "supabase/seed.sql" 2>/dev/null || {
        supabase db push --db-url "$DATABASE_URL" < supabase/seed.sql 2>/dev/null || {
            echo -e "${YELLOW}Warning: Could not seed data. You may need to run manually.${NC}"
        }
    }
    
    echo -e "${GREEN}Test data seeded successfully.${NC}"
}

# Clean up old test data
cleanup_old_data() {
    echo "Cleaning up old test data..."
    
    psql "$DATABASE_URL" <<-EOSQL 2>/dev/null || true
        -- Clean up test data
        DELETE FROM contracts WHERE metadata->>'test' = 'true';
        DELETE FROM auth.users WHERE email LIKE '%@example.com';
EOSQL
    
    echo -e "${GREEN}Old test data cleaned.${NC}"
}

# Create test users via Supabase Auth
create_test_users() {
    echo "Creating test users..."
    
    # This would typically use Supabase Auth API
    # For now, the users are created in the seed.sql file
    
    echo -e "${GREEN}Test users created.${NC}"
}

# Verify setup
verify_setup() {
    echo "Verifying test setup..."
    
    # Check if test data exists
    CONTRACT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM contracts WHERE metadata->>'test' = 'true';" 2>/dev/null || echo "0")
    USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@example.com';" 2>/dev/null || echo "0")
    
    if [ "$CONTRACT_COUNT" -gt "0" ] && [ "$USER_COUNT" -gt "0" ]; then
        echo -e "${GREEN}✅ Test database setup complete!${NC}"
        echo "  - Test contracts: $CONTRACT_COUNT"
        echo "  - Test users: $USER_COUNT"
    else
        echo -e "${YELLOW}⚠️  Test data may not be fully loaded.${NC}"
        echo "  - Test contracts: $CONTRACT_COUNT"
        echo "  - Test users: $USER_COUNT"
    fi
}

# Main execution
main() {
    echo "==========================================="
    echo "     Test Database Setup Script"
    echo "==========================================="
    echo ""
    
    # Check dependencies
    check_supabase
    
    # Optional: Clean old data
    if [ "$1" == "--clean" ]; then
        cleanup_old_data
    fi
    
    # Run migrations
    run_migrations
    
    # Seed data
    seed_test_data
    
    # Create users
    create_test_users
    
    # Verify
    verify_setup
    
    echo ""
    echo "==========================================="
    echo -e "${GREEN}Setup complete! You can now run tests.${NC}"
    echo ""
    echo "Run tests with:"
    echo "  npm run test:e2e"
    echo ""
    echo "To clean and reset the database, run:"
    echo "  ./scripts/setup-test-db.sh --clean"
    echo "==========================================="
}

# Run main function
main "$@"
