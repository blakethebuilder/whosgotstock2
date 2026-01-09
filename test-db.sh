#!/bin/bash

# Quick database test script
# Usage: ./test-db.sh [database_url]

set -e

if [ -z "$1" ]; then
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set"
    echo ""
    echo "Usage:"
    echo "  ./test-db.sh postgresql://user:password@host:5432/whosgotstock"
    echo "  OR"
    echo "  export DATABASE_URL=postgresql://user:password@host:5432/whosgotstock"
    echo "  ./test-db.sh"
    exit 1
  fi
else
  export DATABASE_URL="$1"
fi

echo "🔍 Testing database connection..."
echo ""

# Run the test script from worker directory (where pg is installed)
cd worker
node ../database/test-connection.js
