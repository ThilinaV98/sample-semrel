#!/bin/bash

# Quick Workflow Validation Script
# Performs fast syntax validation of all GitHub Actions workflows
# Version: 1.0.0

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 GitHub Actions Workflow Validation${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check if Act is installed
if ! command -v act >/dev/null 2>&1; then
    echo -e "${RED}❌ Act is not installed${NC}"
    echo -e "Install with: brew install act"
    exit 1
fi

# Check if workflows directory exists
if [[ ! -d ".github/workflows" ]]; then
    echo -e "${RED}❌ No .github/workflows directory found${NC}"
    exit 1
fi

echo -e "${YELLOW}Validating workflow files...${NC}"
echo

TOTAL=0
VALID=0
INVALID=0

# Validate each workflow file
for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [[ -f "$workflow" ]]; then
        ((TOTAL++))
        filename=$(basename "$workflow")
        
        echo -n "Checking $filename... "
        
        # Use Act to validate the workflow syntax
        if act --validate -W "$workflow" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ VALID${NC}"
            ((VALID++))
        else
            echo -e "${RED}❌ INVALID${NC}"
            ((INVALID++))
            
            # Show the specific error
            echo -e "${YELLOW}Error details:${NC}"
            act --validate -W "$workflow" 2>&1 | head -5
            echo
        fi
    fi
done

echo
echo -e "${BLUE}Validation Summary:${NC}"
echo -e "Total workflows: $TOTAL"
echo -e "${GREEN}Valid: $VALID${NC}"
echo -e "${RED}Invalid: $INVALID${NC}"

if [[ $INVALID -eq 0 ]]; then
    echo -e "${GREEN}🎉 All workflows are valid!${NC}"
    exit 0
else
    echo -e "${RED}💥 $INVALID workflow(s) have syntax errors${NC}"
    exit 1
fi