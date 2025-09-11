# GitHub Actions Workflow Testing Guide

> **Version**: 1.0.0  
> **Last Updated**: 2024  
> **Tools**: Act v0.2.80+, Docker

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Workflow Testing Matrix](#workflow-testing-matrix)
5. [Testing Commands](#testing-commands)
6. [Event Fixtures](#event-fixtures)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [CI/CD Pipeline Validation](#cicd-pipeline-validation)

---

## Overview

This guide provides comprehensive instructions for testing GitHub Actions workflows locally using [Act](https://github.com/nektos/act). All workflows in `.github/workflows/` can be tested before pushing to GitHub.

### Current Workflows

| Workflow | Purpose | Triggers | Test Priority |
|----------|---------|----------|---------------|
| `feature-validation.yml` | PR validation | PR to dev | 🔥 Critical |
| `dev-integration.yml` | Integration testing | Push to dev | 🔥 Critical |
| `release-preparation.yml` | Release creation | Manual dispatch | 🟡 Important |
| `semantic-release.yml` | Production release | Push to main | 🔥 Critical |
| `hotfix.yml` | Emergency fixes | Push to hotfix/* | 🟡 Important |

---

## Prerequisites

### Required Tools

```bash
# 1. Install Act
brew install act

# 2. Verify Docker is running
docker --version

# 3. Check Act version (v0.2.80+)
act --version
```

### Environment Setup

```bash
# 1. Create secrets file (copy from template)
cp .secrets.example .secrets

# 2. Edit secrets with your values
# GITHUB_TOKEN=your_token_here
# NPM_TOKEN=your_npm_token_here

# 3. Verify configuration
cat .actrc
```

---

## Quick Start

### Test All Workflows

```bash
# Quick validation of all workflows
./scripts/test-workflows.sh

# Or individual workflow
act -W .github/workflows/feature-validation.yml
```

### Common Test Commands

```bash
# Test PR validation
act pull_request -W .github/workflows/feature-validation.yml

# Test dev integration
act push -W .github/workflows/dev-integration.yml

# Test release workflow
act push -W .github/workflows/semantic-release.yml

# Test hotfix workflow
act push -W .github/workflows/hotfix.yml --env GITHUB_REF=refs/heads/hotfix/critical-fix
```

---

## Workflow Testing Matrix

### 1. Feature Validation (`feature-validation.yml`)

**Purpose**: Validates PRs from feature branches to dev

#### Test Scenarios

```bash
# Test PR from feature to dev (standard)
act pull_request \
  -W .github/workflows/feature-validation.yml \
  -e test/fixtures/pull_request_event.json

# Test PR with different branch names
act pull_request \
  -W .github/workflows/feature-validation.yml \
  -e test/fixtures/pr_hotfix_event.json

# Test specific jobs only
act pull_request \
  -W .github/workflows/feature-validation.yml \
  --job lint

# Test with verbose output
act pull_request \
  -W .github/workflows/feature-validation.yml \
  --verbose
```

#### Expected Outcomes
- ✅ Lint and code quality checks pass
- ✅ Build and test jobs complete
- ✅ Commit message validation passes
- ✅ Security scan completes
- ✅ PR status comment posted

#### Common Issues
```bash
# Issue: Super-Linter fails
# Solution: Check .github/linters/.eslintrc.yml exists

# Issue: Tests fail due to coverage
# Solution: Ensure coverage ≥80%
npm run test:coverage
```

### 2. Dev Integration (`dev-integration.yml`)

**Purpose**: Integration testing when code is pushed to dev

#### Test Scenarios

```bash
# Test dev push
act push \
  -W .github/workflows/dev-integration.yml \
  -e test/fixtures/push_dev_event.json

# Test with specific Node version matrix
act push \
  -W .github/workflows/dev-integration.yml \
  --matrix node-version:18.x

# Test health check functionality
act push \
  -W .github/workflows/dev-integration.yml \
  --job integration \
  --env NODE_ENV=test
```

#### Expected Outcomes
- ✅ Full test suite passes with coverage
- ✅ Application starts and health check passes
- ✅ Pre-release validation completes
- ✅ Quality metrics generated
- ✅ Integration status reported

### 3. Release Preparation (`release-preparation.yml`)

**Purpose**: Manual workflow to create release branches

#### Test Scenarios

```bash
# Test release creation (workflow_dispatch)
act workflow_dispatch \
  -W .github/workflows/release-preparation.yml \
  -e test/fixtures/workflow_dispatch_event.json

# Test with different inputs
act workflow_dispatch \
  -W .github/workflows/release-preparation.yml \
  --input source_branch=dev \
  --input release_type=minor \
  --input pre_release_identifier=rc

# Test validation steps only
act workflow_dispatch \
  -W .github/workflows/release-preparation.yml \
  --job validate-source
```

#### Expected Outcomes
- ✅ Source branch validation passes
- ✅ Version calculation completes
- ✅ Release branch created
- ✅ Package.json version updated
- ✅ Release notes generated
- ✅ QA testing issue created

### 4. Semantic Release (`semantic-release.yml`)

**Purpose**: Automated releases when code is merged to main

#### Test Scenarios

```bash
# Test main branch push
act push \
  -W .github/workflows/semantic-release.yml \
  -e test/fixtures/push_main_event.json

# Test PR merge to main
act pull_request \
  -W .github/workflows/semantic-release.yml \
  -e test/fixtures/pr_closed_event.json

# Test dry-run mode
act push \
  -W .github/workflows/semantic-release.yml \
  --env DRY_RUN=true

# Test specific release type
act push \
  -W .github/workflows/semantic-release.yml \
  --env FORCE_RELEASE_TYPE=patch
```

#### Expected Outcomes
- ✅ Pre-release validation passes
- ✅ Semantic release creates version and changelog
- ✅ GitHub release published
- ✅ Dev branch synchronized
- ✅ Release branches cleaned up
- ✅ Related issues closed

### 5. Hotfix Workflow (`hotfix.yml`)

**Purpose**: Emergency fixes that go directly to production

#### Test Scenarios

```bash
# Test hotfix branch push
act push \
  -W .github/workflows/hotfix.yml \
  --env GITHUB_REF=refs/heads/hotfix/critical-security-fix \
  -e test/fixtures/push_hotfix_event.json

# Test hotfix PR
act pull_request \
  -W .github/workflows/hotfix.yml \
  -e test/fixtures/pr_hotfix_to_main_event.json

# Test different severity levels
act push \
  -W .github/workflows/hotfix.yml \
  --env GITHUB_REF=refs/heads/hotfix/config-update \
  --job impact-analysis
```

#### Expected Outcomes
- ✅ Expedited validation passes
- ✅ Impact analysis determines severity
- ✅ Coverage thresholds enforced
- ✅ Approval gates function
- ✅ Auto-sync to dev branch
- ✅ Hotfix summary generated

---

## Testing Commands

### Individual Job Testing

```bash
# Test specific jobs within workflows
act -j job-name -W .github/workflows/workflow-name.yml

# Examples:
act -j lint -W .github/workflows/feature-validation.yml
act -j build-test -W .github/workflows/feature-validation.yml
act -j integration -W .github/workflows/dev-integration.yml
act -j semantic-release -W .github/workflows/semantic-release.yml
```

### Environment Variables

```bash
# Set specific environment variables
act push -W .github/workflows/dev-integration.yml \
  --env NODE_ENV=test \
  --env LOG_LEVEL=debug \
  --env COVERAGE_THRESHOLD=75

# Use secrets file
act push -W .github/workflows/semantic-release.yml \
  --secret-file .secrets

# Override specific secrets
act push -W .github/workflows/semantic-release.yml \
  --secret GITHUB_TOKEN=your_test_token
```

### Matrix Testing

```bash
# Test specific matrix combinations
act push -W .github/workflows/feature-validation.yml \
  --matrix node-version:20.x

# Test all matrix combinations
act push -W .github/workflows/feature-validation.yml \
  --matrix node-version:18.x,20.x
```

### Debugging Commands

```bash
# Verbose output
act push -W .github/workflows/workflow.yml --verbose

# List available jobs
act -l -W .github/workflows/workflow.yml

# Dry run (don't execute, just show what would run)
act push -W .github/workflows/workflow.yml --dryrun

# Use different platforms
act push -W .github/workflows/workflow.yml \
  -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

---

## Event Fixtures

### Available Test Events

| Event File | Purpose | Workflow |
|------------|---------|----------|
| `pull_request_event.json` | Standard PR to dev | feature-validation |
| `push_dev_event.json` | Push to dev branch | dev-integration |
| `push_main_event.json` | Push to main branch | semantic-release |
| `push_hotfix_event.json` | Push to hotfix branch | hotfix |
| `workflow_dispatch_event.json` | Manual release trigger | release-preparation |
| `pr_closed_event.json` | Merged PR | semantic-release |
| `pr_hotfix_event.json` | Hotfix PR | hotfix |

### Creating Custom Events

```bash
# Generate real GitHub event
gh api repos/OWNER/REPO/events | jq '.[0]' > custom_event.json

# Use custom event
act push -e custom_event.json -W .github/workflows/workflow.yml
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Docker Permission Errors**
```bash
# Issue: Permission denied accessing Docker
# Solution: Ensure Docker is running and user has permissions
sudo usermod -a -G docker $USER
newgrp docker
```

#### 2. **Missing Action Images**
```bash
# Issue: Action image not found
# Solution: Pull required images
docker pull catthehacker/ubuntu:act-latest
docker pull node:20
```

#### 3. **Secrets Not Available**
```bash
# Issue: Missing GITHUB_TOKEN
# Solution: Create .secrets file or use --secret flag
echo "GITHUB_TOKEN=your_token" >> .secrets
```

#### 4. **Workflow Syntax Errors**
```bash
# Issue: Invalid workflow YAML
# Solution: Validate syntax
act --validate -W .github/workflows/workflow.yml
```

#### 5. **Network Issues**
```bash
# Issue: Cannot reach external services
# Solution: Use host network
act push -W .github/workflows/workflow.yml --network host
```

#### 6. **Container Space Issues**
```bash
# Issue: No space left on device
# Solution: Clean up Docker
docker system prune -a
```

### Performance Optimization

```bash
# Use container reuse for faster runs
act push -W .github/workflows/workflow.yml --reuse

# Disable image pulling for faster startup
act push -W .github/workflows/workflow.yml --pull=false

# Use bind mounts instead of copying
act push -W .github/workflows/workflow.yml --bind
```

---

## Best Practices

### 1. **Pre-Commit Testing**

```bash
#!/bin/bash
# Script: scripts/pre-commit-test.sh
echo "🧪 Testing workflows before commit..."

# Test critical workflows
act pull_request -W .github/workflows/feature-validation.yml --dryrun
act push -W .github/workflows/dev-integration.yml --dryrun

echo "✅ All workflows validated"
```

### 2. **Continuous Testing Strategy**

```yaml
# Add to package.json scripts
{
  "scripts": {
    "test:workflows": "./scripts/test-workflows.sh",
    "test:workflow:feature": "act pull_request -W .github/workflows/feature-validation.yml",
    "test:workflow:dev": "act push -W .github/workflows/dev-integration.yml",
    "test:workflow:release": "act workflow_dispatch -W .github/workflows/release-preparation.yml"
  }
}
```

### 3. **Security Considerations**

```bash
# Use test secrets, never production
cp .secrets.example .secrets.test
act push -W .github/workflows/workflow.yml --secret-file .secrets.test

# Avoid logging sensitive data
act push -W .github/workflows/workflow.yml --quiet

# Use readonly mode for validation
act push -W .github/workflows/workflow.yml --dryrun
```

### 4. **Team Development**

```bash
# Standardize Act version
echo "act>=0.2.80" > requirements-act.txt

# Share common configuration
git add .actrc test/fixtures/
git commit -m "chore: add Act testing configuration"

# Document workflow dependencies
echo "Dependencies: Docker, Act, Node 18+" > TESTING-REQUIREMENTS.md
```

---

## CI/CD Pipeline Validation

### End-to-End Testing Flow

1. **Feature Development**
   ```bash
   # Test feature validation
   act pull_request -W .github/workflows/feature-validation.yml
   ```

2. **Integration Testing**
   ```bash
   # Test dev integration
   act push -W .github/workflows/dev-integration.yml
   ```

3. **Release Preparation**
   ```bash
   # Test release creation
   act workflow_dispatch -W .github/workflows/release-preparation.yml
   ```

4. **Production Release**
   ```bash
   # Test semantic release
   act push -W .github/workflows/semantic-release.yml
   ```

5. **Hotfix Validation**
   ```bash
   # Test emergency fixes
   act push -W .github/workflows/hotfix.yml \
     --env GITHUB_REF=refs/heads/hotfix/test
   ```

### Validation Checklist

- [ ] All workflows can be triggered locally
- [ ] Required secrets are configured
- [ ] Environment variables work correctly
- [ ] Job dependencies execute in order
- [ ] Artifacts are generated correctly
- [ ] Error handling works as expected
- [ ] Performance is within acceptable limits

---

## Quick Reference

### Most Common Commands

```bash
# Test feature PR
act pull_request -W .github/workflows/feature-validation.yml

# Test dev integration
act push -W .github/workflows/dev-integration.yml

# Test release workflow
act push -W .github/workflows/semantic-release.yml

# Test hotfix
act push -W .github/workflows/hotfix.yml \
  --env GITHUB_REF=refs/heads/hotfix/test

# Test with secrets
act push -W .github/workflows/workflow.yml --secret-file .secrets

# Debug mode
act push -W .github/workflows/workflow.yml --verbose

# Dry run
act push -W .github/workflows/workflow.yml --dryrun
```

### Useful Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `--verbose` | Detailed logging | `act push --verbose` |
| `--dryrun` | Validate without running | `act push --dryrun` |
| `--reuse` | Reuse containers | `act push --reuse` |
| `--pull=false` | Don't pull images | `act push --pull=false` |
| `--secret-file` | Use secrets file | `act push --secret-file .secrets` |
| `--env` | Set environment variable | `act push --env NODE_ENV=test` |
| `--job` | Run specific job | `act push --job build` |
| `--matrix` | Test matrix values | `act push --matrix node-version:18.x` |

---

*This guide ensures reliable, testable CI/CD workflows that work consistently both locally and in GitHub Actions.*