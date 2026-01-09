#!/bin/bash

# Database Migration Runner for WhosGotStock
# This script runs all database migrations in order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Usage: DATABASE_URL=postgresql://user@host:5432/dbname ./run-migrations.sh"
    exit 1
fi

echo -e "${GREEN}Starting database migrations...${NC}"
echo "Database: $DATABASE_URL"
echo ""

# Migration files in order
MIGRATIONS=(
    "init.sql"
    "migrate-suppliers.sql"
    "migrations/001_add_description_column.sql"
    "migrations/002_add_category_column.sql"
    "migrations/004_create_supplier_specific_tables.sql"
    "migrations/005_create_user_auth_tables.sql"
)

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for migration in "${MIGRATIONS[@]}"; do
    migration_path="$SCRIPT_DIR/$migration"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${YELLOW}Warning: Migration file not found: $migration${NC}"
        continue
    fi
    
    echo -e "${GREEN}Running: $migration${NC}"
    
    if psql "$DATABASE_URL" -f "$migration_path" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Success: $migration${NC}"
    else
        # Check if it's a "already exists" error (which is OK)
        if psql "$DATABASE_URL" -f "$migration_path" 2>&1 | grep -q "already exists\|duplicate\|already present"; then
            echo -e "${YELLOW}⚠ Skipped (already applied): $migration${NC}"
        else
            echo -e "${RED}✗ Error running: $migration${NC}"
            echo "Run manually to see full error:"
            echo "  psql \"$DATABASE_URL\" -f \"$migration_path\""
            exit 1
        fi
    fi
    echo ""
done

echo -e "${GREEN}All migrations completed!${NC}"
echo ""
echo "Verifying database schema..."
psql "$DATABASE_URL" -c "\d products" > /dev/null 2>&1 && echo "✓ products table exists"
psql "$DATABASE_URL" -c "\d suppliers" > /dev/null 2>&1 && echo "✓ suppliers table exists"
psql "$DATABASE_URL" -c "\d settings" > /dev/null 2>&1 && echo "✓ settings table exists"

echo ""
echo -e "${GREEN}Database setup complete!${NC}"
