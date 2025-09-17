#!/bin/bash

# 🧪 Master Test Runner
# Executes all testing scripts in sequence with comprehensive reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Test configuration
TEST_SCRIPTS_DIR="$(pwd)/test-scripts"
REPORT_DIR="$(pwd)/test-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/test-report-$TIMESTAMP.md"

mkdir -p "$REPORT_DIR"

echo -e "${CYAN}${BOLD}🧪 Master Test Suite for GitHub Actions${NC}"
echo -e "${CYAN}${BOLD}===========================================${NC}"
echo "Test Suite: GitHub Actions Workflows, Custom Actions, and Utility Scripts"
echo "Timestamp: $(date)"
echo "Report File: $REPORT_FILE"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️ $message${NC}"
    else
        echo -e "${BLUE}ℹ️ $message${NC}"
    fi
}

# Function to log to report file
log_to_report() {
    echo "$1" >> "$REPORT_FILE"
}

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << EOF
# GitHub Actions Test Suite Report

**Generated**: $(date)
**Repository**: $(git config --get remote.origin.url 2>/dev/null || 'Unknown')
**Branch**: $(git branch --show-current 2>/dev/null || 'Unknown')
**Commit**: $(git rev-parse --short HEAD 2>/dev/null || 'Unknown')

---

## Executive Summary

This report contains the results of comprehensive testing for:
- GitHub Actions Workflows (6 workflows)
- Custom GitHub Actions (3 actions)
- Utility JavaScript Scripts (3 scripts)

EOF
}

# Function to run test with timeout and capture output
run_test_with_capture() {
    local test_name=$1
    local test_script=$2
    local timeout_seconds=${3:-600} # 10 minutes default

    local test_start=$(date +%s)
    local test_output_file="/tmp/test-output-$$.txt"
    local test_status=0

    echo -e "\n${BLUE}🔄 Running: $test_name${NC}"
    echo "Script: $test_script"
    echo "Timeout: ${timeout_seconds}s"
    echo ""

    # Run test with timeout and capture output
    if timeout "$timeout_seconds" bash "$test_script" > "$test_output_file" 2>&1; then
        test_status=0
        print_status "success" "$test_name completed successfully"
    else
        test_status=$?
        if [ $test_status -eq 124 ]; then
            print_status "error" "$test_name timed out after ${timeout_seconds}s"
        else
            print_status "error" "$test_name failed with exit code $test_status"
        fi
    fi

    local test_end=$(date +%s)
    local test_duration=$((test_end - test_start))

    # Log to report
    log_to_report ""
    log_to_report "## Test: $test_name"
    log_to_report ""
    log_to_report "**Status**: $([ $test_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
    log_to_report "**Duration**: ${test_duration}s"
    log_to_report "**Script**: \`$test_script\`"
    log_to_report ""

    if [ -f "$test_output_file" ]; then
        log_to_report "### Output"
        log_to_report "\`\`\`"
        # Include last 50 lines of output to avoid huge reports
        tail -n 50 "$test_output_file" >> "$REPORT_FILE"
        log_to_report "\`\`\`"
        log_to_report ""

        # Show summary output on console
        echo "Last few lines of output:"
        tail -n 10 "$test_output_file" | sed 's/^/  /'
    fi

    rm -f "$test_output_file"
    return $test_status
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}🔍 Checking Prerequisites${NC}"
    echo "=========================="

    local all_good=true

    # Check required commands
    local required_commands=("node" "npm" "git" "gh" "jq")

    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            local version=$(case "$cmd" in
                "node") node --version ;;
                "npm") npm --version ;;
                "git") git --version | cut -d' ' -f3 ;;
                "gh") gh --version | head -1 | cut -d' ' -f3 ;;
                "jq") jq --version ;;
            esac)
            print_status "success" "$cmd is available ($version)"
        else
            print_status "error" "$cmd is required but not installed"
            all_good=false
        fi
    done

    # Check GitHub authentication
    if gh auth status &>/dev/null; then
        local gh_user=$(gh api user --jq '.login' 2>/dev/null || 'Unknown')
        print_status "success" "GitHub CLI authenticated as $gh_user"
    else
        print_status "warning" "GitHub CLI not authenticated - workflow tests may fail"
    fi

    # Check repository status
    if git status &>/dev/null; then
        local repo_status=$(git status --porcelain | wc -l)
        if [ "$repo_status" -eq 0 ]; then
            print_status "success" "Git repository is clean"
        else
            print_status "warning" "Git repository has uncommitted changes ($repo_status files)"
        fi
    else
        print_status "error" "Not in a git repository"
        all_good=false
    fi

    # Log prerequisites to report
    log_to_report "## Prerequisites Check"
    log_to_report ""
    log_to_report "| Tool | Status | Version |"
    log_to_report "|------|--------|---------|"

    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            local version=$(case "$cmd" in
                "node") node --version ;;
                "npm") npm --version ;;
                "git") git --version | cut -d' ' -f3 ;;
                "gh") gh --version | head -1 | cut -d' ' -f3 ;;
                "jq") jq --version ;;
            esac)
            log_to_report "| $cmd | ✅ Available | $version |"
        else
            log_to_report "| $cmd | ❌ Missing | - |"
        fi
    done

    log_to_report ""

    if ! $all_good; then
        print_status "error" "Prerequisites check failed. Please install missing tools."
        exit 1
    fi

    return 0
}

# Function to run test suite
run_test_suite() {
    local test_results=()
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local suite_start=$(date +%s)

    echo -e "\n${CYAN}${BOLD}🚀 Starting Complete Test Suite${NC}"
    echo "================================="

    # Test 1: Utility Scripts (fastest, good for early feedback)
    if [ -f "$TEST_SCRIPTS_DIR/test-utility-scripts.sh" ]; then
        total_tests=$((total_tests + 1))
        if run_test_with_capture "Utility Scripts Testing" "$TEST_SCRIPTS_DIR/test-utility-scripts.sh" 300; then
            test_results+=("✅ Utility Scripts Testing - PASSED")
            passed_tests=$((passed_tests + 1))
        else
            test_results+=("❌ Utility Scripts Testing - FAILED")
            failed_tests=$((failed_tests + 1))
        fi
    else
        print_status "warning" "Utility scripts test not found"
    fi

    # Test 2: Custom Actions (medium complexity)
    if [ -f "$TEST_SCRIPTS_DIR/test-custom-actions.sh" ]; then
        total_tests=$((total_tests + 1))
        if run_test_with_capture "Custom Actions Testing" "$TEST_SCRIPTS_DIR/test-custom-actions.sh" 600; then
            test_results+=("✅ Custom Actions Testing - PASSED")
            passed_tests=$((passed_tests + 1))
        else
            test_results+=("❌ Custom Actions Testing - FAILED")
            failed_tests=$((failed_tests + 1))
        fi
    else
        print_status "warning" "Custom actions test not found"
    fi

    # Test 3: Workflow Integration (most complex, requires GitHub)
    if [ "$1" != "--skip-workflows" ] && [ -f "$TEST_SCRIPTS_DIR/automated-workflow-test.sh" ]; then
        total_tests=$((total_tests + 1))
        if run_test_with_capture "GitHub Workflows Testing" "$TEST_SCRIPTS_DIR/automated-workflow-test.sh" 1800; then
            test_results+=("✅ GitHub Workflows Testing - PASSED")
            passed_tests=$((passed_tests + 1))
        else
            test_results+=("❌ GitHub Workflows Testing - FAILED")
            failed_tests=$((failed_tests + 1))
        fi
    elif [ "$1" = "--skip-workflows" ]; then
        print_status "info" "Skipping workflow tests (--skip-workflows flag)"
    else
        print_status "warning" "Workflow test not found"
    fi

    local suite_end=$(date +%s)
    local suite_duration=$((suite_end - suite_start))

    # Generate final report
    log_to_report "## Test Suite Summary"
    log_to_report ""
    log_to_report "**Total Duration**: ${suite_duration}s ($(date -d@$suite_duration -u +%H:%M:%S 2>/dev/null || echo "${suite_duration}s"))"
    log_to_report ""
    log_to_report "| Metric | Value |"
    log_to_report "|--------|-------|"
    log_to_report "| Total Tests | $total_tests |"
    log_to_report "| Passed | $passed_tests |"
    log_to_report "| Failed | $failed_tests |"
    log_to_report "| Success Rate | $(( passed_tests * 100 / total_tests ))% |"
    log_to_report ""

    # Print results summary
    echo -e "\n${CYAN}${BOLD}📊 Test Suite Results Summary${NC}"
    echo "=============================="
    printf "%-40s %s\n" "Test Name" "Result"
    echo "=================================================================="

    for result in "${test_results[@]}"; do
        echo "$result"
    done

    echo "=================================================================="
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo "Duration: ${suite_duration}s"
    echo ""

    # Final status
    if [ $failed_tests -eq 0 ]; then
        print_status "success" "All tests passed! 🎉"
        log_to_report "## Final Result: ✅ ALL TESTS PASSED"
        return 0
    else
        print_status "error" "$failed_tests test(s) failed"
        log_to_report "## Final Result: ❌ SOME TESTS FAILED"
        return 1
    fi
}

# Function to generate summary report
generate_summary_report() {
    local summary_file="$REPORT_DIR/latest-test-summary.md"

    echo -e "\n${BLUE}📄 Generating Summary Report${NC}"

    # Create symlink to latest report
    ln -sf "$(basename "$REPORT_FILE")" "$summary_file"

    # Add recommendations to report
    cat >> "$REPORT_FILE" << 'EOF'

## Recommendations

### If Tests Pass ✅
- The GitHub Actions workflows are ready for production use
- Consider setting up automated testing in CI/CD
- Monitor workflow performance in production

### If Tests Fail ❌
1. **Check Prerequisites**: Ensure all required tools are installed and configured
2. **Review Logs**: Check the detailed output above for specific error messages
3. **Authentication**: Verify GitHub CLI is properly authenticated
4. **Permissions**: Ensure repository permissions allow workflow execution
5. **Network**: Check internet connectivity for GitHub API calls

### Maintenance
- Run this test suite regularly (weekly or before major releases)
- Update test scenarios when adding new workflows
- Keep test dependencies up to date

EOF

    print_status "success" "Report generated: $REPORT_FILE"
    print_status "info" "Latest report symlink: $summary_file"

    # Show report location
    echo ""
    echo "📁 Test Reports Directory:"
    ls -la "$REPORT_DIR"/ | tail -5
}

# Main execution
main() {
    local exit_code=0

    # Parse command line arguments
    local skip_workflows=false
    local cleanup_only=false

    for arg in "$@"; do
        case $arg in
            --skip-workflows)
                skip_workflows=true
                ;;
            --cleanup)
                cleanup_only=true
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-workflows  Skip the workflow integration tests"
                echo "  --cleanup         Clean up test artifacts and exit"
                echo "  --help           Show this help message"
                echo ""
                echo "This script runs all testing scripts in sequence:"
                echo "  1. Utility Scripts Testing"
                echo "  2. Custom Actions Testing"
                echo "  3. GitHub Workflows Testing (optional)"
                echo ""
                echo "Reports are saved to: $REPORT_DIR"
                exit 0
                ;;
        esac
    done

    # Handle cleanup
    if $cleanup_only; then
        echo -e "${YELLOW}🧹 Cleaning up test artifacts...${NC}"

        # Clean up test directories
        rm -rf "$(pwd)/test-actions"
        rm -rf "$(pwd)/test-scripts-utilities"
        rm -rf "$(pwd)/test-reports"

        # Clean up any temporary test branches
        if command -v git &> /dev/null; then
            "$TEST_SCRIPTS_DIR/automated-workflow-test.sh" --cleanup 2>/dev/null || true
        fi

        print_status "success" "Test artifacts cleaned up"
        exit 0
    fi

    # Initialize
    init_report

    # Run tests
    if ! check_prerequisites; then
        exit 1
    fi

    # Run the test suite
    if $skip_workflows; then
        run_test_suite "--skip-workflows"
        exit_code=$?
    else
        run_test_suite
        exit_code=$?
    fi

    # Generate reports
    generate_summary_report

    echo -e "\n${CYAN}${BOLD}🏁 Test Suite Complete${NC}"
    echo "Report saved to: $REPORT_FILE"

    exit $exit_code
}

# Execute main function with all arguments
main "$@"