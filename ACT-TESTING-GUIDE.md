# Act Testing Best Practices Guide

> **Version**: 1.0.0  
> **Last Updated**: 2024  
> **Act Version**: v0.2.80+

## 📋 Table of Contents

1. [Act Overview](#act-overview)
2. [Installation & Setup](#installation--setup)
3. [Configuration Best Practices](#configuration-best-practices)
4. [Testing Strategies](#testing-strategies)
5. [Performance Optimization](#performance-optimization)
6. [Security Considerations](#security-considerations)
7. [Debugging Workflows](#debugging-workflows)
8. [Common Pitfalls](#common-pitfalls)
9. [Team Development](#team-development)
10. [Advanced Techniques](#advanced-techniques)

---

## Act Overview

[Act](https://github.com/nektos/act) runs your GitHub Actions locally using Docker containers, enabling:
- **Fast Feedback**: Test changes without pushing to GitHub
- **Cost Savings**: Avoid consuming GitHub Actions minutes
- **Offline Development**: Work without internet connectivity
- **Debugging**: Interactive debugging with full control

### When to Use Act

✅ **Use Act For:**
- Pre-commit workflow validation
- Debugging workflow issues
- Testing complex conditional logic
- Developing new workflows
- CI/CD pipeline validation

❌ **Don't Use Act For:**
- Testing platform-specific features (Windows/macOS runners)
- GitHub-specific integrations (GitHub Apps, etc.)
- Performance benchmarking (different hardware)
- Final production validation (always test on GitHub)

---

## Installation & Setup

### Prerequisites

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify Docker installation
docker --version
docker info

# Install Act
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows (using Chocolatey)
choco install act-cli
```

### Initial Configuration

```bash
# Create Act configuration file
cat > .actrc << 'EOF'
# Default runner images
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
-P ubuntu-20.04=catthehacker/ubuntu:act-20.04

# Container settings
--container-architecture linux/amd64
--network host
--reuse

# Environment
--env ACT=true
--pull=false
EOF

# Create secrets template
cat > .secrets.example << 'EOF'
# GitHub Personal Access Token
GITHUB_TOKEN=your_github_token_here

# NPM Token (if publishing packages)
NPM_TOKEN=your_npm_token_here

# Other service tokens
SLACK_WEBHOOK_URL=your_slack_webhook_url
EOF

# Copy and configure secrets
cp .secrets.example .secrets
# Edit .secrets with actual values
```

### Directory Structure

```
project/
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   └── linters/           # Linter configurations
├── test/
│   └── fixtures/          # Event payload fixtures
├── scripts/
│   ├── test-workflows.sh  # Automated testing script
│   └── validate-workflows.sh
├── .actrc                 # Act configuration
├── .secrets               # Local secrets (gitignored)
└── .secrets.example       # Secrets template
```

---

## Configuration Best Practices

### 1. Runner Image Selection

```bash
# Use official Act images for consistency
-P ubuntu-latest=catthehacker/ubuntu:act-latest

# Use specific versions for reproducibility
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04

# Use smaller images for simple workflows
-P ubuntu-latest=catthehacker/ubuntu:act-20.04-slim
```

### 2. Resource Management

```bash
# Enable container reuse for faster runs
--reuse

# Use host network for better performance
--network host

# Bind mount for faster file access
--bind

# Limit resource usage
--container-cap-add SYS_PTRACE
--container-cap-drop ALL
```

### 3. Environment Configuration

```bash
# Set Act environment variable
--env ACT=true

# Use specific Node.js version
--env NODE_VERSION=20

# Set timezone
--env TZ=UTC

# Disable telemetry
--env CI=true
```

### 4. Secrets Management

```bash
# Use secrets file for multiple secrets
--secret-file .secrets

# Override individual secrets
--secret GITHUB_TOKEN=test_token

# Use environment variables
--env GITHUB_TOKEN=$GITHUB_TOKEN
```

---

## Testing Strategies

### 1. Layered Testing Approach

```bash
# Layer 1: Syntax Validation (fastest)
act --validate -W .github/workflows/workflow.yml

# Layer 2: Dry Run (fast)
act push --dryrun -W .github/workflows/workflow.yml

# Layer 3: Individual Job Testing (medium)
act push --job build -W .github/workflows/workflow.yml

# Layer 4: Full Workflow Testing (comprehensive)
act push -W .github/workflows/workflow.yml
```

### 2. Test Matrix Strategy

```bash
# Test different Node.js versions
act push --matrix node-version:18.x -W .github/workflows/ci.yml
act push --matrix node-version:20.x -W .github/workflows/ci.yml

# Test different operating systems
act push --matrix os:ubuntu-latest -W .github/workflows/ci.yml
act push --matrix os:ubuntu-22.04 -W .github/workflows/ci.yml

# Test different event types
act push -W .github/workflows/ci.yml
act pull_request -W .github/workflows/ci.yml
act workflow_dispatch -W .github/workflows/release.yml
```

### 3. Event-Driven Testing

```bash
# Create realistic event fixtures
mkdir -p test/fixtures

# Pull request event
cat > test/fixtures/pr_event.json << 'EOF'
{
  "action": "opened",
  "pull_request": {
    "head": {"ref": "feature/new-feature"},
    "base": {"ref": "dev"}
  }
}
EOF

# Use event fixtures
act pull_request -e test/fixtures/pr_event.json
```

### 4. Conditional Logic Testing

```bash
# Test different branch conditions
act push --env GITHUB_REF=refs/heads/main
act push --env GITHUB_REF=refs/heads/dev
act push --env GITHUB_REF=refs/heads/feature/test

# Test different event conditions
act push --env GITHUB_EVENT_NAME=push
act workflow_dispatch --env GITHUB_EVENT_NAME=workflow_dispatch

# Test matrix conditions
act push --matrix include:'[{"os":"ubuntu-latest","node":"18"}]'
```

---

## Performance Optimization

### 1. Container Optimization

```bash
# Use container reuse
act push --reuse

# Pre-pull required images
docker pull catthehacker/ubuntu:act-latest
docker pull node:18
docker pull node:20

# Use smaller base images when possible
-P ubuntu-latest=catthehacker/ubuntu:act-20.04-slim
```

### 2. Caching Strategies

```bash
# Use Act's built-in caching
act push --cache-server-path /tmp/act-cache

# Cache Docker layers
export DOCKER_BUILDKIT=1

# Cache npm dependencies
act push --env NPM_CONFIG_CACHE=/tmp/.npm
```

### 3. Parallel Execution

```bash
#!/bin/bash
# Run multiple workflows in parallel

workflows=(
    "feature-validation.yml"
    "dev-integration.yml"
    "semantic-release.yml"
)

for workflow in "${workflows[@]}"; do
    {
        echo "Testing $workflow..."
        act push -W ".github/workflows/$workflow" --dryrun
    } &
done

wait
echo "All workflows tested!"
```

### 4. Resource Monitoring

```bash
# Monitor Docker resource usage
docker stats

# Monitor Act performance
time act push -W .github/workflows/ci.yml

# Check container resource limits
docker inspect act-container-name | jq '.[0].HostConfig'
```

---

## Security Considerations

### 1. Secrets Management

```bash
# Use separate secrets for testing
cp .secrets.example .secrets.test

# Never use production secrets
# GITHUB_TOKEN=test_token_with_limited_scope

# Use readonly tokens when possible
# GITHUB_TOKEN=ghp_readonly_token

# Avoid logging secrets
act push --quiet
```

### 2. Network Security

```bash
# Use isolated networks for sensitive workflows
act push --network act-network

# Block internet access for security testing
act push --network none

# Use custom DNS for testing
act push --network host --env DNS_SERVER=127.0.0.1
```

### 3. Container Security

```bash
# Run with minimal capabilities
--container-cap-drop ALL
--container-cap-add NET_BIND_SERVICE

# Use non-root user when possible
--env USER_ID=1000
--env GROUP_ID=1000

# Mount read-only when possible
--volume /host/path:/container/path:ro
```

### 4. Sensitive Data Protection

```bash
# Mask sensitive output
act push --env ACTIONS_STEP_DEBUG=false

# Use temporary directories
export ACT_TEMP_DIR=$(mktemp -d)
act push --artifact-server-path "$ACT_TEMP_DIR"

# Clean up after testing
trap "rm -rf $ACT_TEMP_DIR" EXIT
```

---

## Debugging Workflows

### 1. Verbose Debugging

```bash
# Enable verbose output
act push --verbose

# Enable debug logging
act push --env ACTIONS_STEP_DEBUG=true

# Enable runner debug
act push --env ACTIONS_RUNNER_DEBUG=true
```

### 2. Interactive Debugging

```bash
# Use interactive mode (experimental)
act push --interactive

# SSH into running container
docker exec -it act-container-name bash

# Attach to running container
docker attach act-container-name
```

### 3. Step-by-Step Debugging

```bash
# Test individual steps
act push --job build --verbose

# Use debug action
# Add to workflow:
- name: Debug Information
  run: |
    echo "GitHub Context: ${{ toJson(github) }}"
    echo "Environment: $(env)"
    echo "Working Directory: $(pwd)"
    ls -la
```

### 4. Log Analysis

```bash
# Capture logs
act push 2>&1 | tee act-debug.log

# Parse error messages
grep -i "error\|failed\|exception" act-debug.log

# Analyze timing
grep "took.*ms" act-debug.log | sort -n
```

---

## Common Pitfalls

### 1. Environment Differences

❌ **Problem**: Workflow works locally but fails on GitHub

✅ **Solution**:
```bash
# Test with GitHub-like environment
act push --env GITHUB_ACTIONS=true
act push --env CI=true
act push --platform ubuntu-latest=ubuntu:20.04
```

### 2. Path Issues

❌ **Problem**: File paths work differently in containers

✅ **Solution**:
```yaml
# Use relative paths
- name: Build
  run: npm run build
  working-directory: ./app

# Check working directory
- name: Debug paths
  run: |
    pwd
    ls -la
    echo $GITHUB_WORKSPACE
```

### 3. Action Compatibility

❌ **Problem**: Some GitHub Actions don't work with Act

✅ **Solution**:
```bash
# Check Act compatibility
act --list-actions

# Use alternative actions for local testing
# Instead of: actions/checkout@v4
# Use: act-compatible checkout action
```

### 4. Network Access

❌ **Problem**: Network requests fail in containers

✅ **Solution**:
```bash
# Use host network
act push --network host

# Configure DNS
act push --env DNS_SERVER=8.8.8.8

# Test network connectivity
- name: Test network
  run: |
    curl -I https://github.com
    nslookup github.com
```

### 5. Resource Limitations

❌ **Problem**: Out of memory or disk space

✅ **Solution**:
```bash
# Increase Docker resources
# Docker Desktop > Settings > Resources

# Clean up containers regularly
docker system prune -f

# Monitor resource usage
docker stats --no-stream
```

---

## Team Development

### 1. Standardization

```bash
# Standardize Act version
echo "act>=0.2.80" > .act-version

# Commit shared configuration
git add .actrc test/fixtures/
git commit -m "chore: add Act testing configuration"

# Document testing requirements
cat > TESTING-REQUIREMENTS.md << 'EOF'
# Testing Requirements

## Prerequisites
- Docker Desktop
- Act v0.2.80+
- Node.js 18+

## Quick Start
```bash
./scripts/test-workflows.sh
```
EOF
```

### 2. CI Integration

```yaml
# .github/workflows/test-workflows.yml
name: Test Workflows with Act

on: [push, pull_request]

jobs:
  test-workflows:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Act
        run: |
          curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
      - name: Test workflows
        run: ./scripts/test-workflows.sh --dry-run
```

### 3. Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Testing workflows with Act..."
./scripts/test-workflows.sh --dry-run

if [[ $? -ne 0 ]]; then
    echo "❌ Workflow tests failed. Commit aborted."
    exit 1
fi

echo "✅ All workflows valid."
```

### 4. Documentation

```markdown
## Workflow Testing

Test workflows locally before pushing:

```bash
# Quick validation
./scripts/validate-workflows.sh

# Full test suite
./scripts/test-workflows.sh

# Test specific workflow
./scripts/test-single-workflow.sh --workflow feature-validation.yml --event pull_request
```
```

---

## Advanced Techniques

### 1. Custom Event Generation

```bash
# Generate events from GitHub API
gh api repos/OWNER/REPO/events | jq '.[0]' > event.json

# Create parameterized events
generate_pr_event() {
    local branch="$1"
    local target="$2"
    
    jq -n \
        --arg branch "$branch" \
        --arg target "$target" \
        '{
            action: "opened",
            pull_request: {
                head: {ref: $branch},
                base: {ref: $target}
            }
        }' > "test/fixtures/pr_${branch}_to_${target}.json"
}

generate_pr_event "feature/auth" "dev"
```

### 2. Dynamic Matrix Testing

```bash
# Test all matrix combinations
generate_matrix_tests() {
    local workflow="$1"
    
    # Extract matrix from workflow
    matrix_values=$(yq eval '.jobs.*.strategy.matrix' ".github/workflows/$workflow")
    
    # Generate test combinations
    echo "$matrix_values" | jq -r 'to_entries[] | .key + ":" + (.value | join(","))'
}

# Test each combination
for matrix in $(generate_matrix_tests "ci.yml"); do
    IFS=':' read -r key values <<< "$matrix"
    for value in ${values//,/ }; do
        act push --matrix "$key:$value" -W .github/workflows/ci.yml
    done
done
```

### 3. Workflow Dependency Testing

```bash
# Test workflow dependencies
test_workflow_chain() {
    local workflows=("$@")
    
    for workflow in "${workflows[@]}"; do
        echo "Testing $workflow..."
        if ! act push -W ".github/workflows/$workflow" --dryrun; then
            echo "❌ $workflow failed"
            return 1
        fi
    done
    
    echo "✅ All workflows in chain passed"
}

# Test complete CI/CD chain
test_workflow_chain \
    "feature-validation.yml" \
    "dev-integration.yml" \
    "semantic-release.yml"
```

### 4. Performance Benchmarking

```bash
#!/bin/bash
# Benchmark workflow performance

benchmark_workflow() {
    local workflow="$1"
    local iterations="${2:-5}"
    
    echo "Benchmarking $workflow ($iterations iterations)..."
    
    total_time=0
    for ((i=1; i<=iterations; i++)); do
        echo "Run $i/$iterations"
        
        start_time=$(date +%s%N)
        act push -W ".github/workflows/$workflow" --dryrun >/dev/null 2>&1
        end_time=$(date +%s%N)
        
        run_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        total_time=$((total_time + run_time))
        
        echo "  Time: ${run_time}ms"
    done
    
    average_time=$((total_time / iterations))
    echo "Average time: ${average_time}ms"
}

# Benchmark all workflows
for workflow in .github/workflows/*.yml; do
    benchmark_workflow "$(basename "$workflow")" 3
done
```

---

## Quick Reference

### Essential Commands

```bash
# Validate syntax
act --validate -W .github/workflows/workflow.yml

# Dry run
act push --dryrun

# Test specific job
act push --job job-name

# Use event file
act pull_request -e test/fixtures/pr_event.json

# Set environment variables
act push --env VAR=value

# Use secrets
act push --secret-file .secrets

# Verbose output
act push --verbose

# List available jobs
act -l
```

### Configuration Files

```bash
# .actrc - Act configuration
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--network host
--reuse

# .secrets - Local secrets (gitignored)
GITHUB_TOKEN=your_token
NPM_TOKEN=your_npm_token

# .secrets.example - Template
GITHUB_TOKEN=your_github_token_here
NPM_TOKEN=your_npm_token_here
```

### Testing Scripts

```bash
# Full test suite
./scripts/test-workflows.sh

# Quick validation
./scripts/validate-workflows.sh

# Single workflow
./scripts/test-single-workflow.sh --workflow ci.yml --event push
```

---

*This guide enables reliable, efficient local testing of GitHub Actions workflows using Act, ensuring your CI/CD pipelines work correctly before deployment.*