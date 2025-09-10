#!/bin/bash

# Single Workflow Testing Script
# Test individual workflows with specific scenarios
# Version: 1.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default values
WORKFLOW=""
EVENT_TYPE=""
EVENT_FILE=""
JOB=""
VERBOSE=false
DRY_RUN=false
SECRETS_FILE=".secrets"

# Usage function
usage() {
    echo "Usage: $0 --workflow <workflow.yml> --event <event_type> [OPTIONS]"
    echo
    echo "Required:"
    echo "  --workflow <file>     Workflow file name (e.g., feature-validation.yml)"
    echo "  --event <type>        Event type (push, pull_request, workflow_dispatch)"
    echo
    echo "Optional:"
    echo "  --event-file <file>   Specific event fixture file"
    echo "  --job <job_name>      Run specific job only"
    echo "  --verbose             Show verbose output"
    echo "  --dry-run             Validate without running"
    echo "  --secrets <file>      Secrets file (default: .secrets)"
    echo "  --env <VAR=value>     Set environment variable"
    echo "  --help                Show this help"
    echo
    echo "Examples:"
    echo "  # Test feature validation"
    echo "  $0 --workflow feature-validation.yml --event pull_request"
    echo
    echo "  # Test specific job with verbose output"
    echo "  $0 --workflow feature-validation.yml --event pull_request --job lint --verbose"
    echo
    echo "  # Test hotfix with custom environment"
    echo "  $0 --workflow hotfix.yml --event push --env GITHUB_REF=refs/heads/hotfix/test"
    echo
    echo "  # Dry run validation"
    echo "  $0 --workflow semantic-release.yml --event push --dry-run"
}

# Environment variables array
ENV_VARS=()

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --workflow)
            WORKFLOW="$2"
            shift 2
            ;;
        --event)
            EVENT_TYPE="$2"
            shift 2
            ;;
        --event-file)
            EVENT_FILE="$2"
            shift 2
            ;;
        --job)
            JOB="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --secrets)
            SECRETS_FILE="$2"
            shift 2
            ;;
        --env)
            ENV_VARS+=("$2")
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$WORKFLOW" ]]; then
    echo -e "${RED}❌ Workflow file is required${NC}"
    usage
    exit 1
fi

if [[ -z "$EVENT_TYPE" ]]; then
    echo -e "${RED}❌ Event type is required${NC}"
    usage
    exit 1
fi

# Check if Act is installed
if ! command -v act >/dev/null 2>&1; then
    echo -e "${RED}❌ Act is not installed. Install with: brew install act${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if workflow file exists
WORKFLOW_PATH=".github/workflows/$WORKFLOW"
if [[ ! -f "$WORKFLOW_PATH" ]]; then
    echo -e "${RED}❌ Workflow file not found: $WORKFLOW_PATH${NC}"
    echo -e "Available workflows:"
    ls .github/workflows/*.yml 2>/dev/null | xargs -I {} basename {} || echo "  None found"
    exit 1
fi

# Auto-detect event file if not specified
if [[ -z "$EVENT_FILE" ]]; then
    case "$EVENT_TYPE" in
        "pull_request")
            if [[ "$WORKFLOW" == *"hotfix"* ]]; then
                EVENT_FILE="pr_hotfix_to_main_event.json"
            else
                EVENT_FILE="pull_request_event.json"
            fi
            ;;
        "push")
            if [[ "$WORKFLOW" == *"dev"* ]]; then
                EVENT_FILE="push_dev_event.json"
            elif [[ "$WORKFLOW" == *"hotfix"* ]]; then
                EVENT_FILE="push_hotfix_event.json"
            elif [[ "$WORKFLOW" == *"semantic"* ]]; then
                EVENT_FILE="push_main_event.json"
            else
                EVENT_FILE="push_event.json"
            fi
            ;;
        "workflow_dispatch")
            EVENT_FILE="workflow_dispatch_event.json"
            ;;
    esac
fi

# Check if event file exists
EVENT_PATH=""
if [[ -n "$EVENT_FILE" ]]; then
    EVENT_PATH="test/fixtures/$EVENT_FILE"
    if [[ ! -f "$EVENT_PATH" ]]; then
        echo -e "${YELLOW}⚠️  Event file not found: $EVENT_PATH${NC}"
        echo -e "Available event files:"
        ls test/fixtures/*.json 2>/dev/null | xargs -I {} basename {} || echo "  None found"
        echo -e "${YELLOW}Continuing without event file...${NC}"
        EVENT_PATH=""
    fi
fi

# Display test configuration
echo -e "${BLUE}🧪 Single Workflow Test${NC}"
echo -e "${BLUE}======================${NC}"
echo
echo -e "${CYAN}Configuration:${NC}"
echo -e "Workflow: $WORKFLOW"
echo -e "Event Type: $EVENT_TYPE"
echo -e "Event File: ${EVENT_FILE:-'(none)'}"
if [[ -n "$JOB" ]]; then
    echo -e "Job: $JOB"
fi
echo -e "Verbose: $VERBOSE"
echo -e "Dry Run: $DRY_RUN"
echo -e "Secrets File: $SECRETS_FILE"
if [[ ${#ENV_VARS[@]} -gt 0 ]]; then
    echo -e "Environment Variables:"
    for var in "${ENV_VARS[@]}"; do
        echo -e "  $var"
    done
fi
echo

# Build Act command
ACT_CMD="act $EVENT_TYPE -W $WORKFLOW_PATH"

# Add event file if available
if [[ -n "$EVENT_PATH" && -f "$EVENT_PATH" ]]; then
    ACT_CMD="$ACT_CMD -e $EVENT_PATH"
fi

# Add job specification
if [[ -n "$JOB" ]]; then
    ACT_CMD="$ACT_CMD --job $JOB"
fi

# Add secrets file if it exists
if [[ -f "$SECRETS_FILE" ]]; then
    ACT_CMD="$ACT_CMD --secret-file $SECRETS_FILE"
else
    echo -e "${YELLOW}⚠️  Secrets file not found: $SECRETS_FILE${NC}"
fi

# Add environment variables
for var in "${ENV_VARS[@]}"; do
    ACT_CMD="$ACT_CMD --env $var"
done

# Add flags
if [[ "$VERBOSE" == true ]]; then
    ACT_CMD="$ACT_CMD --verbose"
fi

if [[ "$DRY_RUN" == true ]]; then
    ACT_CMD="$ACT_CMD --dryrun"
fi

# Display command
echo -e "${YELLOW}Command:${NC}"
echo -e "$ACT_CMD"
echo

# Execute the command
echo -e "${PURPLE}Executing workflow test...${NC}"
echo

if eval "$ACT_CMD"; then
    echo
    echo -e "${GREEN}✅ Test completed successfully!${NC}"
    exit 0
else
    echo
    echo -e "${RED}❌ Test failed!${NC}"
    echo
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo -e "1. Run with --verbose for detailed output"
    echo -e "2. Use --dry-run to validate syntax only"
    echo -e "3. Check if required secrets are configured"
    echo -e "4. Verify Docker has sufficient resources"
    echo -e "5. Test specific jobs with --job <job_name>"
    exit 1
fi