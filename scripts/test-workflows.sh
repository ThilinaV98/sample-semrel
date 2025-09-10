#!/bin/bash

# GitHub Actions Workflow Testing Script
# Uses Act to test all workflows locally before pushing to GitHub
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
WORKFLOWS_DIR=".github/workflows"
FIXTURES_DIR="test/fixtures"
SECRETS_FILE=".secrets"
ACTRC_FILE=".actrc"

# Check if Act is installed
command -v act >/dev/null 2>&1 || {
    echo -e "${RED}❌ Act is not installed. Please install it first:"
    echo -e "   brew install act${NC}"
    exit 1
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .actrc exists
if [[ ! -f "$ACTRC_FILE" ]]; then
    echo -e "${YELLOW}⚠️  No .actrc file found. Using default Act configuration.${NC}"
fi

# Check if secrets file exists
if [[ ! -f "$SECRETS_FILE" ]]; then
    echo -e "${YELLOW}⚠️  No .secrets file found. Some workflows may fail.${NC}"
    echo -e "   Copy .secrets.example to .secrets and add your tokens.${NC}"
fi

echo -e "${BLUE}🧪 GitHub Actions Workflow Testing${NC}"
echo -e "${BLUE}=================================${NC}"
echo

# Function to print section headers
print_section() {
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}$(echo "$1" | sed 's/./-/g')${NC}"
    echo
}

# Function to test a workflow
test_workflow() {
    local workflow_file="$1"
    local event_type="$2"
    local event_file="$3"
    local description="$4"
    local extra_args="$5"
    
    echo -e "${CYAN}Testing: ${workflow_file}${NC}"
    echo -e "Event: $event_type"
    echo -e "Description: $description"
    echo
    
    local cmd="act $event_type -W $WORKFLOWS_DIR/$workflow_file"
    
    if [[ -n "$event_file" && -f "$FIXTURES_DIR/$event_file" ]]; then
        cmd="$cmd -e $FIXTURES_DIR/$event_file"
    fi
    
    if [[ -f "$SECRETS_FILE" ]]; then
        cmd="$cmd --secret-file $SECRETS_FILE"
    fi
    
    if [[ -n "$extra_args" ]]; then
        cmd="$cmd $extra_args"
    fi
    
    echo -e "${YELLOW}Command: $cmd${NC}"
    echo
    
    if eval "$cmd"; then
        echo -e "${GREEN}✅ $workflow_file - $description: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $workflow_file - $description: FAILED${NC}"
        return 1
    fi
}

# Function to run dry-run tests (faster validation)
dry_run_test() {
    local workflow_file="$1"
    local event_type="$2"
    local description="$3"
    
    echo -e "${CYAN}Dry-run: ${workflow_file}${NC}"
    
    local cmd="act $event_type -W $WORKFLOWS_DIR/$workflow_file --dryrun"
    
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $workflow_file - $description: VALID${NC}"
        return 0
    else
        echo -e "${RED}❌ $workflow_file - $description: INVALID${NC}"
        return 1
    fi
}

# Parse command line arguments
RUN_MODE="full"  # full, dry-run, or specific workflow
SPECIFIC_WORKFLOW=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            RUN_MODE="dry-run"
            shift
            ;;
        --workflow)
            RUN_MODE="specific"
            SPECIFIC_WORKFLOW="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --dry-run          Only validate workflow syntax (fast)"
            echo "  --workflow <name>  Test specific workflow file"
            echo "  --verbose          Show verbose output"
            echo "  --help            Show this help message"
            echo
            echo "Examples:"
            echo "  $0                              # Test all workflows"
            echo "  $0 --dry-run                    # Quick validation only"
            echo "  $0 --workflow feature-validation.yml  # Test specific workflow"
            echo "  $0 --verbose                    # Show detailed output"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Add verbose flag to commands if requested
VERBOSE_FLAG=""
if [[ "$VERBOSE" == true ]]; then
    VERBOSE_FLAG="--verbose"
fi

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}Configuration:${NC}"
echo -e "Run Mode: $RUN_MODE"
echo -e "Verbose: $VERBOSE"
if [[ -n "$SPECIFIC_WORKFLOW" ]]; then
    echo -e "Specific Workflow: $SPECIFIC_WORKFLOW"
fi
echo -e "Act Version: $(act --version 2>/dev/null || echo 'Unknown')"
echo -e "Docker Status: $(docker info >/dev/null 2>&1 && echo 'Running' || echo 'Not Running')"
echo

# Quick validation mode
if [[ "$RUN_MODE" == "dry-run" ]]; then
    print_section "Quick Workflow Validation (Dry-run)"
    
    workflows=(
        "feature-validation.yml pull_request Feature PR validation"
        "dev-integration.yml push Dev branch integration"
        "release-preparation.yml workflow_dispatch Release branch creation"
        "semantic-release.yml push Production release"
        "hotfix.yml push Emergency hotfix"
    )
    
    for workflow_info in "${workflows[@]}"; do
        IFS=' ' read -r workflow event description <<< "$workflow_info"
        ((TOTAL_TESTS++))
        if dry_run_test "$workflow" "$event" "$description"; then
            ((PASSED_TESTS++))
        else
            ((FAILED_TESTS++))
        fi
        echo
    done
    
# Specific workflow testing
elif [[ "$RUN_MODE" == "specific" ]]; then
    print_section "Testing Specific Workflow: $SPECIFIC_WORKFLOW"
    
    case "$SPECIFIC_WORKFLOW" in
        "feature-validation.yml")
            ((TOTAL_TESTS++))
            if test_workflow "feature-validation.yml" "pull_request" "pull_request_event.json" "Feature PR validation" "$VERBOSE_FLAG"; then
                ((PASSED_TESTS++))
            else
                ((FAILED_TESTS++))
            fi
            ;;
        "dev-integration.yml")
            ((TOTAL_TESTS++))
            if test_workflow "dev-integration.yml" "push" "push_dev_event.json" "Dev integration" "$VERBOSE_FLAG"; then
                ((PASSED_TESTS++))
            else
                ((FAILED_TESTS++))
            fi
            ;;
        "release-preparation.yml")
            ((TOTAL_TESTS++))
            if test_workflow "release-preparation.yml" "workflow_dispatch" "workflow_dispatch_event.json" "Release preparation" "$VERBOSE_FLAG"; then
                ((PASSED_TESTS++))
            else
                ((FAILED_TESTS++))
            fi
            ;;
        "semantic-release.yml")
            ((TOTAL_TESTS++))
            if test_workflow "semantic-release.yml" "push" "push_main_event.json" "Semantic release" "$VERBOSE_FLAG"; then
                ((PASSED_TESTS++))
            else
                ((FAILED_TESTS++))
            fi
            ;;
        "hotfix.yml")
            ((TOTAL_TESTS++))
            if test_workflow "hotfix.yml" "push" "push_hotfix_event.json" "Hotfix workflow" "--env GITHUB_REF=refs/heads/hotfix/critical-security-fix $VERBOSE_FLAG"; then
                ((PASSED_TESTS++))
            else
                ((FAILED_TESTS++))
            fi
            ;;
        *)
            echo -e "${RED}❌ Unknown workflow: $SPECIFIC_WORKFLOW${NC}"
            echo -e "Available workflows:"
            ls "$WORKFLOWS_DIR"/*.yml | xargs -I {} basename {}
            exit 1
            ;;
    esac

# Full test suite
else
    print_section "1. Feature Validation Tests"
    
    # Test 1: Feature PR validation
    ((TOTAL_TESTS++))
    if test_workflow "feature-validation.yml" "pull_request" "pull_request_event.json" "Standard feature PR to dev" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    echo
    
    print_section "2. Dev Integration Tests"
    
    # Test 2: Dev branch integration
    ((TOTAL_TESTS++))
    if test_workflow "dev-integration.yml" "push" "push_dev_event.json" "Dev branch push integration" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    echo
    
    print_section "3. Release Preparation Tests"
    
    # Test 3: Manual release preparation
    ((TOTAL_TESTS++))
    if test_workflow "release-preparation.yml" "workflow_dispatch" "workflow_dispatch_event.json" "Manual release branch creation" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    echo
    
    print_section "4. Semantic Release Tests"
    
    # Test 4: Production release
    ((TOTAL_TESTS++))
    if test_workflow "semantic-release.yml" "push" "push_main_event.json" "Production release from main" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    
    # Test 5: PR merge to main
    ((TOTAL_TESTS++))
    if test_workflow "semantic-release.yml" "pull_request" "pr_closed_event.json" "PR merge to main" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    echo
    
    print_section "5. Hotfix Tests"
    
    # Test 6: Hotfix branch push
    ((TOTAL_TESTS++))
    if test_workflow "hotfix.yml" "push" "push_hotfix_event.json" "Hotfix branch push" "--env GITHUB_REF=refs/heads/hotfix/critical-security-fix $VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    
    # Test 7: Hotfix PR to main
    ((TOTAL_TESTS++))
    if test_workflow "hotfix.yml" "pull_request" "pr_hotfix_to_main_event.json" "Hotfix PR to main" "$VERBOSE_FLAG"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    echo
fi

# Print final results
print_section "Test Results Summary"

echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}🎉 All workflow tests passed!${NC}"
    echo -e "${GREEN}Your GitHub Actions are ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}💥 $FAILED_TESTS test(s) failed.${NC}"
    echo -e "${YELLOW}Please review the errors above and fix the issues.${NC}"
    echo
    echo -e "${BLUE}Troubleshooting tips:${NC}"
    echo -e "1. Check that all required secrets are in .secrets file"
    echo -e "2. Ensure Docker is running and has enough resources"
    echo -e "3. Verify workflow YAML syntax with: act --validate"
    echo -e "4. Review logs with --verbose flag for more details"
    echo -e "5. Test individual workflows with: $0 --workflow <name>"
    exit 1
fi