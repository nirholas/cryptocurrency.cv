#!/bin/bash
#
# Production Health Check
# Comprehensive health check for all services
#
# Usage: 
#   ./scripts/health-check.sh              # Check production
#   ./scripts/health-check.sh --local      # Check localhost
#   ./scripts/health-check.sh --url=URL    # Check custom URL
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default URL
BASE_URL="https://cryptocurrency.cv"
TIMEOUT=10
VERBOSE=false
FAILED=0
PASSED=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            BASE_URL="http://localhost:3000"
            shift
            ;;
        --url=*)
            BASE_URL="${1#*=}"
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--local] [--url=URL] [--verbose]"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🏥 Health Check - ${BASE_URL}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

check_endpoint() {
    local endpoint=$1
    local expected=${2:-200}
    local description=${3:-""}
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
        --connect-timeout $TIMEOUT \
        --max-time $((TIMEOUT * 2)) \
        "$BASE_URL$endpoint" 2>/dev/null) || response="000:0"
    
    local code=$(echo "$response" | cut -d':' -f1)
    local time=$(echo "$response" | cut -d':' -f2)
    
    if [ "$code" == "$expected" ]; then
        echo -e "${GREEN}✅${NC} $endpoint ${GREEN}($code)${NC} - ${time}s"
        ((PASSED++))
    elif [ "$code" == "000" ]; then
        echo -e "${RED}❌${NC} $endpoint ${RED}(unreachable)${NC}"
        ((FAILED++))
    else
        echo -e "${RED}❌${NC} $endpoint ${RED}($code)${NC} expected $expected"
        ((FAILED++))
    fi
    
    if [ "$VERBOSE" = true ] && [ -n "$description" ]; then
        echo -e "   ${BLUE}ℹ️  $description${NC}"
    fi
}

check_json_endpoint() {
    local endpoint=$1
    local key=${2:-""}
    
    local response
    response=$(curl -s --connect-timeout $TIMEOUT "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ -z "$response" ]; then
        echo -e "${RED}❌${NC} $endpoint ${RED}(no response)${NC}"
        ((FAILED++))
        return
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        if [ -n "$key" ]; then
            local value=$(echo "$response" | jq -r ".$key" 2>/dev/null)
            echo -e "${GREEN}✅${NC} $endpoint ${GREEN}($key: $value)${NC}"
        else
            echo -e "${GREEN}✅${NC} $endpoint ${GREEN}(valid JSON)${NC}"
        fi
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $endpoint ${RED}(invalid JSON)${NC}"
        ((FAILED++))
    fi
}

# Core endpoints
echo -e "${YELLOW}📋 Core Endpoints${NC}"
check_endpoint "/" 200 "Main page"
check_endpoint "/api/health" 200 "Health endpoint"
check_json_endpoint "/api/health" "status"

echo ""
echo -e "${YELLOW}📰 News API${NC}"
check_endpoint "/api/news?limit=1" 200 "News feed"
check_endpoint "/api/news/categories" 200 "Categories"
check_endpoint "/api/sources" 200 "Sources"
check_endpoint "/api/stats" 200 "Statistics"

echo ""
echo -e "${YELLOW}🔍 Search & Discovery${NC}"
check_endpoint "/api/search?q=bitcoin" 200 "Search"
check_endpoint "/api/trending" 200 "Trending"
check_endpoint "/api/breaking" 200 "Breaking news"

echo ""
echo -e "${YELLOW}📊 Market Data${NC}"
check_endpoint "/api/fear-greed" 200 "Fear & Greed"
check_endpoint "/api/prices" 200 "Prices"
check_endpoint "/api/markets" 200 "Markets"

echo ""
echo -e "${YELLOW}🤖 AI Features${NC}"
check_endpoint "/api/sentiment" 200 "Sentiment"
check_endpoint "/api/narratives" 200 "Narratives"
check_endpoint "/api/claims" 200 "Claims"

echo ""
echo -e "${YELLOW}💹 Trading${NC}"
check_endpoint "/api/signals" 200 "Signals"
check_endpoint "/api/whale-alerts" 200 "Whale alerts"
check_endpoint "/api/funding" 200 "Funding rates"

echo ""
echo -e "${YELLOW}📄 Static Resources${NC}"
check_endpoint "/robots.txt" 200 "Robots.txt"
check_endpoint "/sitemap.xml" 200 "Sitemap"
check_endpoint "/manifest.json" 200 "PWA Manifest"

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! ($PASSED/$((PASSED + FAILED)))${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED checks failed, $PASSED passed${NC}"
    exit 1
fi
