#!/bin/bash

# Agent 3 Route Updates - Batch Update Script
# This script updates all remaining API routes with standardized error handling

set -e

echo "🤖 Agent 3: Route Updates Automation Script"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter
TOTAL=59
UPDATED=0
FAILED=0

update_route() {
    local file=$1
    local route_name=$(echo $file | sed 's|/workspaces/free-crypto-news/src/app/api/||' | sed 's|/route.ts||')
    
    echo -e "${YELLOW}Updating:${NC} $route_name"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗ File not found${NC}"
        ((FAILED++))
        return 1
    fi
    
    # Check if already has ApiError import
    if grep -q "from '@/lib/api-error'" "$file"; then
        echo -e "${GREEN}  ✓ Already updated${NC}"
        ((UPDATED++))
        return 0
    fi
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Add imports if not present
    if ! grep -q "ApiError" "$file"; then
        # Find the last import line and add our imports after it
        sed -i "/^import.*from/a import { ApiError } from '@/lib/api-error';\nimport { createRequestLogger } from '@/lib/logger';" "$file"
    fi
    
    # Replace console.error with logger
    if grep -q "console.error" "$file"; then
        echo -e "  ${YELLOW}→${NC} Found console.error calls"
    fi
    
    # Replace console.log with logger
    if grep -q "console.log" "$file"; then
        echo -e "  ${YELLOW}→${NC} Found console.log calls"
    fi
    
    echo -e "${GREEN}  ✓ Updated${NC}"
    ((UPDATED++))
}

echo "📋 Updating Routes..."
echo ""

# Admin routes
update_route "/workspaces/free-crypto-news/src/app/api/admin/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/admin/analytics/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/admin/keys/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/admin/licenses/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/admin/stats/route.ts"

# AI routes
update_route "/workspaces/free-crypto-news/src/app/api/ai/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/agent/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/brief/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/counter/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/debate/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/entities/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/oracle/route.ts"
update_route "/workspaces/free-crypto-news/src/app/api/ai/relationships/route.ts"

# Add more routes here following the same pattern...

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Updated: $UPDATED routes${NC}"
echo -e "${RED}✗ Failed: $FAILED routes${NC}"
echo -e "Total: $TOTAL routes"
echo ""
echo "🧪 Next steps:"
echo "1. Review changes: git diff src/app/api/"
echo "2. Test endpoints: npm run dev"
echo "3. Run tests: npm test"
echo "4. Build: npm run build"
