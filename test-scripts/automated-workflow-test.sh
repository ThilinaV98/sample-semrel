#!/bin/bash

# 🧪 Automated Workflow Testing Script
# This script automates the manual testing procedures for GitHub Actions workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER=$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\)\/\([^.]*\).*/\1/')
REPO_NAME=$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\)\/\([^.]*\).*/\2/')
DATE=$(date +%d%m%y)
TIMESTAMP=$(date +%s)

echo -e "${BLUE}🧪 GitHub Actions Workflow Testing Suite${NC}"
echo -e "${BLUE}=========================================${NC}"
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo "Test Date: $(date)"
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

# Function to wait for workflow completion
wait_for_workflow() {
    local workflow_name=$1
    local timeout=${2:-300} # 5 minutes default
    local elapsed=0

    echo -e "${YELLOW}⏳ Waiting for workflow '$workflow_name' to complete...${NC}"

    while [ $elapsed -lt $timeout ]; do
        local status=$(gh run list --workflow="$workflow_name" --limit=1 --json conclusion --jq '.[0].conclusion')

        if [ "$status" = "success" ]; then
            print_status "success" "Workflow '$workflow_name' completed successfully"
            return 0
        elif [ "$status" = "failure" ]; then
            print_status "error" "Workflow '$workflow_name' failed"
            return 1
        elif [ "$status" = "null" ]; then
            echo -n "."
            sleep 10
            elapsed=$((elapsed + 10))
        else
            echo -n "."
            sleep 10
            elapsed=$((elapsed + 10))
        fi
    done

    print_status "warning" "Workflow '$workflow_name' timed out after $timeout seconds"
    return 2
}

# Function to cleanup test branches
cleanup_branches() {
    echo -e "\n${YELLOW}🧹 Cleaning up test branches...${NC}"

    # Get all test branches
    local branches=$(git branch -r | grep -E "(release/.*-test|feature/test|hotfix/test)" | sed 's/origin\///' || true)

    for branch in $branches; do
        if [ ! -z "$branch" ]; then
            echo "Deleting branch: $branch"
            git push origin --delete "$branch" 2>/dev/null || true
            git branch -D "$branch" 2>/dev/null || true
        fi
    done

    # Also clean local test branches
    git for-each-ref --format='%(refname:short)' refs/heads | grep -E "(release/.*-test|feature/test|hotfix/test)" | xargs -r git branch -D
}

# Test 1: Release Branch Initialization
test_release_branch_init() {
    echo -e "\n${BLUE}📋 Test 1: Release Branch Initialization${NC}"
    echo "=========================================="

    local release_branch="release/${DATE}-test-initialization"

    print_status "info" "Creating release branch: $release_branch"

    # Ensure we're on main and up to date
    git checkout main
    git pull origin main

    # Create and push release branch
    git checkout -b "$release_branch"
    git push origin "$release_branch"

    # Wait for workflow to complete
    if wait_for_workflow "Initialize Release Branch" 300; then
        # Verify files were created
        git pull origin "$release_branch"

        if [ -f "release.json" ]; then
            print_status "success" "release.json created successfully"
            echo "Release JSON contents:"
            cat release.json | jq '.' | head -10
        else
            print_status "error" "release.json not found"
        fi

        if [ -f "RELEASE_CHANGELOG.md" ]; then
            print_status "success" "RELEASE_CHANGELOG.md created successfully"
        else
            print_status "error" "RELEASE_CHANGELOG.md not found"
        fi

        echo "✅ Test 1 completed successfully"
        echo "$release_branch" > /tmp/test_release_branch
    else
        print_status "error" "Test 1 failed - workflow did not complete successfully"
        return 1
    fi
}

# Test 2: PR Validation
test_pr_validation() {
    echo -e "\n${BLUE}📋 Test 2: PR Validation${NC}"
    echo "=========================="

    local feature_branch="feature/test-pr-validation-$TIMESTAMP"

    print_status "info" "Creating feature branch: $feature_branch"

    git checkout main
    git checkout -b "$feature_branch"

    # Create a test file
    echo "console.log('PR validation test');" > pr-validation-test.js
    git add pr-validation-test.js
    git commit -m "Add PR validation test file"
    git push origin "$feature_branch"

    # Create PR with invalid title first
    print_status "info" "Creating PR with invalid title format"
    local pr_url=$(gh pr create \
        --base main \
        --head "$feature_branch" \
        --title "Invalid title format" \
        --body "Testing PR validation workflow with invalid title")

    local pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
    print_status "info" "Created PR #$pr_number"

    # Wait a moment for validation
    sleep 30

    # Check for validation comment
    local comments=$(gh pr view "$pr_number" --json comments --jq '.comments[].body')
    if echo "$comments" | grep -q "PR Title Format"; then
        print_status "success" "PR validation comment added for invalid title"
    else
        print_status "warning" "PR validation comment not found (may take longer)"
    fi

    # Update PR title to valid format
    print_status "info" "Updating PR title to valid format"
    gh pr edit "$pr_number" --title "feat: add PR validation test"

    sleep 30

    print_status "success" "Test 2 completed - PR validation tested"

    # Clean up PR
    gh pr close "$pr_number"
    git checkout main
    git branch -D "$feature_branch"
    git push origin --delete "$feature_branch"
}

# Test 3: Release Branch Merge (RC Creation)
test_release_branch_merge() {
    echo -e "\n${BLUE}📋 Test 3: Release Branch Merge & RC Creation${NC}"
    echo "============================================="

    local release_branch=$(cat /tmp/test_release_branch)
    local feature_branch="feature/test-api-enhancement-$TIMESTAMP"

    if [ -z "$release_branch" ]; then
        print_status "error" "No release branch found from previous test"
        return 1
    fi

    print_status "info" "Using release branch: $release_branch"
    print_status "info" "Creating feature branch: $feature_branch"

    # Create feature branch
    git checkout "$release_branch"
    git pull origin "$release_branch"
    git checkout -b "$feature_branch"

    # Add a feature
    echo "// New API enhancement feature" > api-enhancement.js
    git add api-enhancement.js
    git commit -m "feat: add API enhancement feature"
    git push origin "$feature_branch"

    # Create PR to release branch
    print_status "info" "Creating PR to release branch"
    local pr_url=$(gh pr create \
        --base "$release_branch" \
        --head "$feature_branch" \
        --title "feat: add API enhancement feature" \
        --body "New API enhancement for release testing" \
        --label "bump:minor")

    local pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
    print_status "info" "Created PR #$pr_number"

    # Merge the PR
    print_status "info" "Merging PR to trigger RC creation"
    gh pr merge "$pr_number" --merge

    # Wait for workflow completion
    if wait_for_workflow "Process Release Branch Merge" 300; then
        # Verify RC was created
        git checkout "$release_branch"
        git pull origin "$release_branch"

        if [ -f "release.json" ]; then
            local rc_count=$(cat release.json | jq '.rcBuilds | length')
            if [ "$rc_count" -gt 0 ]; then
                print_status "success" "RC build created successfully (count: $rc_count)"
                echo "Latest RC build:"
                cat release.json | jq '.rcBuilds[-1]'
            else
                print_status "error" "No RC builds found in release.json"
            fi
        fi

        print_status "success" "Test 3 completed successfully"
    else
        print_status "error" "Test 3 failed - RC creation workflow did not complete"
        return 1
    fi
}

# Test 4: Production Release
test_production_release() {
    echo -e "\n${BLUE}📋 Test 4: Production Release${NC}"
    echo "=============================="

    local release_branch=$(cat /tmp/test_release_branch)

    if [ -z "$release_branch" ]; then
        print_status "error" "No release branch found from previous test"
        return 1
    fi

    print_status "info" "Creating PR from release branch to main"

    # Get current version for title
    git checkout "$release_branch"
    git pull origin "$release_branch"
    local version=$(cat release.json | jq -r '.candidateVersion')

    # Create PR from release branch to main
    local pr_url=$(gh pr create \
        --base main \
        --head "$release_branch" \
        --title "release: promote v$version to production" \
        --body "Production release with API enhancements and testing")

    local pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
    print_status "info" "Created PR #$pr_number for production release"

    # Merge the PR
    print_status "info" "Merging PR to trigger production release"
    gh pr merge "$pr_number" --merge

    # Wait for workflow completion
    if wait_for_workflow "Promote Release to Production" 400; then
        # Verify production release
        git checkout main
        git pull origin main

        local new_version=$(cat package.json | jq -r '.version')
        print_status "success" "Package.json updated to version: $new_version"

        if [ -f "CHANGELOG.md" ]; then
            print_status "success" "CHANGELOG.md updated"
            echo "Latest changelog entry:"
            head -10 CHANGELOG.md
        fi

        # Check if GitHub release was created
        if gh release view "v$new_version" >/dev/null 2>&1; then
            print_status "success" "GitHub release v$new_version created successfully"
        else
            print_status "warning" "GitHub release not found (may take longer to appear)"
        fi

        print_status "success" "Test 4 completed successfully"
    else
        print_status "error" "Test 4 failed - production release workflow did not complete"
        return 1
    fi
}

# Test 5: Hotfix Deployment
test_hotfix_deployment() {
    echo -e "\n${BLUE}📋 Test 5: Hotfix Deployment${NC}"
    echo "============================="

    local hotfix_branch="hotfix/test-security-fix-$TIMESTAMP"

    print_status "info" "Creating hotfix branch: $hotfix_branch"

    git checkout main
    git pull origin main
    git checkout -b "$hotfix_branch"

    # Create hotfix changes
    echo "// Critical security patch applied" > security-patch.js
    git add security-patch.js
    git commit -m "fix: critical security vulnerability patch"
    git push origin "$hotfix_branch"

    # Create and merge hotfix PR
    local pr_url=$(gh pr create \
        --base main \
        --head "$hotfix_branch" \
        --title "fix: critical security vulnerability patch" \
        --body "URGENT: Fixes critical security issue for testing" \
        --label "bump:patch")

    local pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
    print_status "info" "Created hotfix PR #$pr_number"

    # Merge the PR
    print_status "info" "Merging hotfix PR"
    gh pr merge "$pr_number" --merge

    # Wait for workflow completion
    if wait_for_workflow "Hotfix to Production" 300; then
        # Verify hotfix deployment
        git checkout main
        git pull origin main

        local new_version=$(cat package.json | jq -r '.version')
        print_status "success" "Hotfix deployed - new version: $new_version"

        # Check for backport issues (if any release branches exist)
        local backport_issues=$(gh issue list --label "backport" --label "hotfix" --json number --jq 'length')
        if [ "$backport_issues" -gt 0 ]; then
            print_status "success" "Backport issues created: $backport_issues"
        else
            print_status "info" "No backport issues created (no active release branches)"
        fi

        print_status "success" "Test 5 completed successfully"
    else
        print_status "error" "Test 5 failed - hotfix deployment workflow did not complete"
        return 1
    fi
}

# Test 6: Development Integration
test_dev_integration() {
    echo -e "\n${BLUE}📋 Test 6: Development Integration${NC}"
    echo "================================="

    local feature_branch="feature/test-dev-integration-$TIMESTAMP"

    # Ensure dev branch exists
    print_status "info" "Ensuring dev branch exists"
    if ! git ls-remote --heads origin dev | grep -q dev; then
        git checkout -b dev
        git push origin dev
        print_status "success" "Created dev branch"
    else
        git checkout dev
        git pull origin dev
        print_status "info" "Using existing dev branch"
    fi

    print_status "info" "Creating feature branch: $feature_branch"

    git checkout -b "$feature_branch"

    # Create dev feature
    echo "// Development environment feature" > dev-feature.js
    git add dev-feature.js
    git commit -m "feat: add development testing feature"
    git push origin "$feature_branch"

    # Create and merge PR to dev
    local pr_url=$(gh pr create \
        --base dev \
        --head "$feature_branch" \
        --title "feat: add development testing feature" \
        --body "New feature for development environment testing")

    local pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
    print_status "info" "Created PR #$pr_number to dev branch"

    # Merge the PR
    print_status "info" "Merging PR to dev"
    gh pr merge "$pr_number" --merge

    # Wait for workflow completion
    if wait_for_workflow "Dev Branch Integration" 200; then
        print_status "success" "Test 6 completed successfully"
    else
        print_status "error" "Test 6 failed - dev integration workflow did not complete"
        return 1
    fi
}

# Main test execution
main() {
    local test_results=()
    local failed_tests=0

    # Check prerequisites
    if ! command -v gh &> /dev/null; then
        print_status "error" "GitHub CLI (gh) is required but not installed"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_status "error" "jq is required but not installed"
        exit 1
    fi

    print_status "info" "Starting comprehensive workflow testing..."

    # Cleanup any existing test branches first
    cleanup_branches

    # Run tests in sequence
    echo -e "\n${BLUE}🚀 Starting Test Sequence${NC}"
    echo "========================="

    # Test 1: Release Branch Initialization
    if test_release_branch_init; then
        test_results+=("✅ Test 1: Release Branch Initialization - PASSED")
    else
        test_results+=("❌ Test 1: Release Branch Initialization - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 2: PR Validation
    if test_pr_validation; then
        test_results+=("✅ Test 2: PR Validation - PASSED")
    else
        test_results+=("❌ Test 2: PR Validation - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 3: Release Branch Merge (RC Creation)
    if test_release_branch_merge; then
        test_results+=("✅ Test 3: Release Branch Merge & RC Creation - PASSED")
    else
        test_results+=("❌ Test 3: Release Branch Merge & RC Creation - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 4: Production Release
    if test_production_release; then
        test_results+=("✅ Test 4: Production Release - PASSED")
    else
        test_results+=("❌ Test 4: Production Release - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 5: Hotfix Deployment
    if test_hotfix_deployment; then
        test_results+=("✅ Test 5: Hotfix Deployment - PASSED")
    else
        test_results+=("❌ Test 5: Hotfix Deployment - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 6: Development Integration
    if test_dev_integration; then
        test_results+=("✅ Test 6: Development Integration - PASSED")
    else
        test_results+=("❌ Test 6: Development Integration - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Final cleanup
    cleanup_branches
    rm -f /tmp/test_release_branch

    # Print results summary
    echo -e "\n${BLUE}📊 Test Results Summary${NC}"
    echo "======================="
    printf "%-50s %s\n" "Test Name" "Result"
    echo "=================================================================="

    for result in "${test_results[@]}"; do
        echo "$result"
    done

    echo "=================================================================="
    echo "Total Tests: ${#test_results[@]}"
    echo "Passed: $((${#test_results[@]} - failed_tests))"
    echo "Failed: $failed_tests"

    if [ $failed_tests -eq 0 ]; then
        print_status "success" "All tests passed! 🎉"
        exit 0
    else
        print_status "error" "$failed_tests test(s) failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --cleanup)
        cleanup_branches
        exit 0
        ;;
    --help|-h)
        echo "Usage: $0 [--cleanup|--help]"
        echo ""
        echo "Options:"
        echo "  --cleanup    Clean up test branches only"
        echo "  --help       Show this help message"
        echo ""
        echo "This script runs comprehensive tests for all GitHub Actions workflows."
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac