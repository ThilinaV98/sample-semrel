# Manual Workflow Testing Guide - Advanced Branching Strategy

> **Version**: 5.1.0  
> **Last Updated**: 2025-01-12  
> **Purpose**: Comprehensive testing guide for the new branching strategy with QA release process

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Workflow Architecture](#workflow-architecture)
4. [Test Scenario 1: Direct Feature to Release](#test-scenario-1-direct-feature-to-release)
5. [Test Scenario 2: Feature via Dev Branch](#test-scenario-2-feature-via-dev-branch)
6. [Test Scenario 3: Hotfix Deployment](#test-scenario-3-hotfix-deployment)
7. [Test Scenario 4: Multiple Features in Release](#test-scenario-4-multiple-features-in-release)
8. [Test Scenario 5: Pre-release to Production](#test-scenario-5-pre-release-to-production)
9. [Expected Outcomes](#expected-outcomes)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide tests the advanced branching strategy with:
- **Dual-path feature workflow** (direct to release OR via dev)
- **Pre-release versions** for QA testing
- **Two GitHub Actions** workflows
- **Semantic versioning** with conventional commits

### Current Setup ✅ **WORKING ARCHITECTURE**

#### Branches
- **main**: Production code only
- **dev**: Integration testing (optional)
- **release/DDMMYY-description**: QA testing with pre-releases
- **feature/***: Feature development
- **hotfix/***: Critical fixes

#### Workflows
1. **release-preparation.yml**: Triggers on PR merge OR push to release/* branches
2. **semantic-release.yml**: Triggers on push to main (after PR merge)

#### Version Format
- Production: `3.1.0` (stable release)
- Pre-release: `3.1.0-rc.120925` (from release/120925-description)
- Note: Date format is DDMMYY (day-month-year with 2-digit year)

---

## Prerequisites

### Initial Setup

```bash
# 1. Navigate to project directory
cd /Users/cosmo/Documents/Course/sample-semrel

# 2. Create dev branch if not exists
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev

# 3. Verify workflows exist
ls -la .github/workflows/
# Should show:
# - release-preparation.yml
# - semantic-release.yml

# 4. Check .releaserc.json configuration
cat .releaserc.json | grep -A10 "branches"
# Should only include "main" branch for production releases

# 5. Clean up old test files (optional)
rm -f src/payment-*.js src/dashboard-*.js src/analytics-*.js src/api-*.js
```

### Required Dependencies

```bash
# Verify semantic-release and plugins
npm ls semantic-release @semantic-release/git @semantic-release/changelog

# Install if missing
npm install --save-dev semantic-release \
  @semantic-release/git \
  @semantic-release/changelog \
  @semantic-release/github \
  @semantic-release/npm \
  @semantic-release/commit-analyzer \
  @semantic-release/release-notes-generator
```

---

## Workflow Architecture

### Path 1: Direct to Release
```
main → feature/* → release/* → main
         ↓            ↓          ↓
    (develop)    (QA + RC)  (production)
```

### Path 2: Via Dev Branch
```
main → feature/* → dev → (testing only)
         ↓          ↓
    (develop)  (integrate)
```

### Hotfix Path
```
main → hotfix/* → main
         ↓          ↓
   (critical)  (immediate)
```

---

## Quick Test - Verified Working Flow

**Purpose**: Simplified test that demonstrates the complete working workflow

```bash
# 1. Create feature branch
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main && git pull
git checkout -b feature/test-$TIMESTAMP
echo "// Test feature" > src/test-$TIMESTAMP.js
git add . && git commit -m "feat: add test feature"
git push -u origin feature/test-$TIMESTAMP

# 2. Create release branch (DDMMYY-description format)
RELEASE_DATE=$(date +%d%m%y)
git checkout main
git checkout -b release/$RELEASE_DATE-test
git push -u origin release/$RELEASE_DATE-test

# 3. Merge feature to release (triggers release-preparation.yml)
# Create and merge test feature PR
PR_OUTPUT=$(gh pr create --base release/$RELEASE_DATE-test --head feature/test-$TIMESTAMP \
  --title "feat: test feature" --body "Test implementation")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch

# 4. Wait for pre-release version
sleep 30
git checkout release/$RELEASE_DATE-test && git pull
grep version package.json  # Should show X.Y.Z-rc.DDMMYY

# 5. Merge to main (triggers semantic-release.yml)
# Create and merge production release PR
PR_OUTPUT=$(gh pr create --base main --head release/$RELEASE_DATE-test \
  --title "Release $RELEASE_DATE" --body "Production release")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch

# 6. Verify production release
sleep 30
git checkout main && git pull
grep version package.json  # Should show X.Y.Z (no rc suffix)
gh release list --limit=1  # Should show new release
```

---

## Test Scenario 1: Direct Feature to Release

**Purpose**: Test feature going directly to release branch for QA

### Step 1.1: Create Feature Branch

```bash
# Start from main
git checkout main && git pull origin main

# Create feature with timestamp
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout -b feature/payment-gateway-$TIMESTAMP

# Add feature code
cat > src/payment-$TIMESTAMP.js << EOF
// Payment Gateway Feature
// Created: $(date)
export class PaymentGateway {
  constructor() {
    this.provider = 'stripe';
    this.version = '2.0';
  }
  
  processPayment(amount) {
    console.log(\`Processing \${amount} via \${this.provider}\`);
    return { success: true, transactionId: Date.now() };
  }
}
EOF

# Commit with conventional message
git add .
git commit -m "feat: implement payment gateway integration

- Add Stripe payment provider
- Support for credit card processing
- Implement transaction logging
- Created at $(date)"

# Push feature branch
git push -u origin feature/payment-gateway-$TIMESTAMP
```

### Step 1.2: Create Release Branch

```bash
# Create release branch from main
# Format: release/DDMMYY-description
RELEASE_DATE=$(date +%d%m%y)  # Format: DDMMYY (e.g., 120925 for Sept 12, 2025)
RELEASE_DESC="payment-gateway"  # Short lowercase description
git checkout main
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC
git push -u origin release/$RELEASE_DATE-$RELEASE_DESC
```

### Step 1.3: Merge Feature to Release

```bash
# Create PR from feature to release
# Create and merge PR from feature to release (triggers release-preparation.yml)
PR_OUTPUT=$(gh pr create \
  --base release/$RELEASE_DATE-$RELEASE_DESC \
  --head feature/payment-gateway-$TIMESTAMP \
  --title "feat: payment gateway integration" \
  --body "## Description
Payment gateway implementation for processing transactions

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual QA completed")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch
```

### Step 1.4: Verify Pre-release Creation

```bash
# Check the release branch for updates
git checkout release/$RELEASE_DATE-$RELEASE_DESC
git pull origin release/$RELEASE_DATE-$RELEASE_DESC

# Verify pre-release version in package.json
grep version package.json
# Should show: "version": "X.Y.Z-rc.DDMMYY" (e.g., "3.1.0-rc.120925")

# Check CHANGELOG.md for draft
head -30 CHANGELOG.md

# Check RELEASE_NOTES.md
cat RELEASE_NOTES.md
```

### Step 1.5: QA Testing Phase

```bash
# Simulate QA finding and fixing
echo "// QA fix for payment validation" >> src/payment-$TIMESTAMP.js
git add .
git commit -m "fix: add payment amount validation"
git push
```

### Step 1.6: Merge to Production

```bash
# After QA approval, create PR to main
# Create and merge PR to main (triggers semantic-release.yml)
PR_OUTPUT=$(gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "Release v$RELEASE_DATE - Payment Gateway" \
  --body "## Release Summary
✅ QA Testing Complete
✅ All tests passing
✅ Ready for production

## Features
- Payment gateway integration

## Fixes
- Payment validation added")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch
```

### Step 1.7: Verify Production Release

```bash
# Pull latest main
git checkout main && git pull origin main

# Check version (should be stable, no -rc suffix)
grep version package.json

# Check GitHub releases
gh release list --limit=3

# Verify CHANGELOG.md updated
head -50 CHANGELOG.md
```

**Expected Results**:
- ✅ Pre-release version created (X.Y.Z-rc.YYYYMMDD)
- ✅ RELEASE_NOTES.md generated
- ✅ Stable version after merge to main
- ✅ GitHub release created
- ✅ CHANGELOG.md updated

---

## Test Scenario 2: Feature via Dev Branch

**Purpose**: Test feature going to dev for integration testing

### Step 2.1: Create Feature Branch

```bash
# Create feature from main
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main && git pull origin main
git checkout -b feature/user-analytics-$TIMESTAMP

# Add feature
echo "// User Analytics - $(date)
export const trackEvent = (event) => {
  console.log('Tracking:', event);
  return { tracked: true, timestamp: Date.now() };
};" > src/analytics-$TIMESTAMP.js

git add .
git commit -m "feat: add user analytics tracking"
git push -u origin feature/user-analytics-$TIMESTAMP
```

### Step 2.2: Merge to Dev Branch

```bash
# Create and merge PR to dev for testing
PR_OUTPUT=$(gh pr create \
  --base dev \
  --title "feat: user analytics" \
  --body "Adding analytics for integration testing")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch

# Verify in dev
git checkout dev && git pull origin dev
ls -la src/analytics-*.js
```

### Step 2.3: Integration Testing

```bash
# Dev branch is for testing only
echo "Dev branch updated with analytics feature"
echo "Run integration tests here"
echo "Features tested in dev can later be included in releases"
```

**Expected Results**:
- ✅ Feature merged to dev
- ✅ No version change (dev doesn't trigger releases)
- ✅ Available for integration testing

---

## Test Scenario 3: Hotfix Deployment

**Purpose**: Test critical fix direct to production

### Step 3.1: Create Hotfix

```bash
# Create hotfix from main
git checkout main && git pull origin main
git checkout -b hotfix/critical-security-patch

# Apply critical fix
cat > src/security-patch.js << EOF
// CRITICAL: Security patch
// CVE-2025-001 mitigation
// Applied: $(date)
export const validateInput = (input) => {
  // Prevent SQL injection
  return input.replace(/[';]/g, '');
};
EOF

git add .
git commit -m "fix: patch critical SQL injection vulnerability

BREAKING CHANGE: Input validation now required
CVE-2025-001 mitigation"

git push -u origin hotfix/critical-security-patch
```

### Step 3.2: Deploy Hotfix

```bash
# Direct PR to main (bypasses release process)
# Create and merge hotfix PR immediately
PR_OUTPUT=$(gh pr create \
  --base main \
  --title "🚨 HOTFIX: Critical security patch" \
  --body "## Critical Security Fix
⚠️ CVE-2025-001 SQL Injection vulnerability

## Impact
- High severity
- Immediate deployment required

## Changes
- Input validation added
- SQL injection prevention")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch
```

### Step 3.3: Verify Hotfix Release

```bash
# Check version bump (should be major due to BREAKING CHANGE)
git checkout main && git pull origin main
grep version package.json

# Verify release
gh release list --limit=1
```

**Expected Results**:
- ✅ Direct merge to main
- ✅ Major version bump (BREAKING CHANGE)
- ✅ Immediate production release

---

## Test Scenario 4: Multiple Features in Release

**Purpose**: Test multiple features in single release

### Step 4.1: Create Multiple Features

```bash
# Feature 1: Dashboard
TIMESTAMP1=$(date +%Y%m%d%H%M)
git checkout main && git pull origin main
git checkout -b feature/dashboard-$TIMESTAMP1
echo "// Dashboard Component - $(date)" > src/dashboard-$TIMESTAMP1.js
git add . && git commit -m "feat: add admin dashboard"
git push -u origin feature/dashboard-$TIMESTAMP1

# Feature 2: Notifications (wait 1 minute for different timestamp)
sleep 60
TIMESTAMP2=$(date +%Y%m%d%H%M)
git checkout main
git checkout -b feature/notifications-$TIMESTAMP2
echo "// Notifications - $(date)" > src/notifications-$TIMESTAMP2.js
git add . && git commit -m "feat: implement push notifications"
git push -u origin feature/notifications-$TIMESTAMP2

# Feature 3: Reports
sleep 60
TIMESTAMP3=$(date +%Y%m%d%H%M)
git checkout main
git checkout -b feature/reports-$TIMESTAMP3
echo "// Reports Module - $(date)" > src/reports-$TIMESTAMP3.js
git add . && git commit -m "feat: add reporting module"
git push -u origin feature/reports-$TIMESTAMP3
```

### Step 4.2: Create Release and Merge Features

```bash
# Create release branch
RELEASE_DATE=$(date +%d%m%y)  # DDMMYY format
RELEASE_DESC="multi-feature"  # Description for this release
git checkout main
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC
git push -u origin release/$RELEASE_DATE-$RELEASE_DESC

# Create and merge all features to release branch
PR_OUTPUT1=$(gh pr create --base release/$RELEASE_DATE-$RELEASE_DESC --head feature/dashboard-$TIMESTAMP1 \
  --title "feat: dashboard" --body "Admin dashboard")
PR_NUM1=$(echo $PR_OUTPUT1 | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM1"
gh pr merge $PR_NUM1 --merge --delete-branch

PR_OUTPUT2=$(gh pr create --base release/$RELEASE_DATE-$RELEASE_DESC --head feature/notifications-$TIMESTAMP2 \
  --title "feat: notifications" --body "Push notifications")
PR_NUM2=$(echo $PR_OUTPUT2 | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM2"
gh pr merge $PR_NUM2 --merge --delete-branch

PR_OUTPUT3=$(gh pr create --base release/$RELEASE_DATE-$RELEASE_DESC --head feature/reports-$TIMESTAMP3 \
  --title "feat: reports" --body "Reporting module")
PR_NUM3=$(echo $PR_OUTPUT3 | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM3"
gh pr merge $PR_NUM3 --merge --delete-branch
```

### Step 4.3: Verify Combined Pre-release

```bash
# Check pre-release version
git checkout release/$RELEASE_DATE-$RELEASE_DESC && git pull
grep version package.json

# Check combined RELEASE_NOTES.md
cat RELEASE_NOTES.md | grep -A20 "Release Highlights"
```

### Step 4.4: Deploy Combined Release

```bash
# Merge to main
# Create and merge release PR to main
PR_OUTPUT=$(gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "Release v$RELEASE_DATE - Multi-feature" \
  --body "## Features
- Admin dashboard
- Push notifications  
- Reporting module

## QA Status
✅ All features tested")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch
```

**Expected Results**:
- ✅ Single pre-release with all features
- ✅ Combined RELEASE_NOTES.md
- ✅ One production release with all features

---

## Test Scenario 5: Pre-release to Production

**Purpose**: Test full pre-release workflow

### Step 5.1: Create and Test Pre-release

```bash
# Create feature
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main && git pull origin main
git checkout -b feature/api-v2-$TIMESTAMP

# Add breaking change
cat > src/api-v2-$TIMESTAMP.js << EOF
// API Version 2
// Breaking changes included
export const apiV2 = {
  version: '2.0.0',
  endpoint: '/api/v2',
  breaking: true
};
EOF

git add .
git commit -m "feat!: implement API v2 with breaking changes

BREAKING CHANGE: API v1 endpoints deprecated
- New authentication required
- Response format changed"

git push -u origin feature/api-v2-$TIMESTAMP

# Create release branch
RELEASE_DATE=$(date +%d%m%y)  # DDMMYY format
RELEASE_DESC="api-v2"  # Description for API v2 release
git checkout main
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC
git push -u origin release/$RELEASE_DATE-$RELEASE_DESC

# Create and merge feature to release
PR_OUTPUT=$(gh pr create --base release/$RELEASE_DATE-$RELEASE_DESC --head feature/api-v2-$TIMESTAMP \
  --title "feat!: API v2" --body "Breaking API changes")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch
```

### Step 5.2: QA Testing on Pre-release

```bash
# Pull release branch
git checkout release/$RELEASE_DATE-$RELEASE_DESC && git pull

# Check pre-release version (should be major bump)
grep version package.json
# Example: "version": "2.0.0-rc.20250112"

# Simulate QA testing
echo "// QA: Add deprecation warnings" >> src/api-v2-$TIMESTAMP.js
git add . && git commit -m "fix: add API deprecation warnings"
git push
```

### Step 5.3: Production Deployment

```bash
# Final merge to main
# Create and merge final production release PR
PR_OUTPUT=$(gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "🚀 MAJOR RELEASE: API v2.0" \
  --body "## ⚠️ Breaking Changes
- API v1 deprecated
- New auth required

## Migration Guide
See RELEASE_NOTES.md")
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch

# Verify major version
git checkout main && git pull
grep version package.json
# Should show: "version": "2.0.0"
```

**Expected Results**:
- ✅ Pre-release: 2.0.0-rc.YYYYMMDD
- ✅ Production: 2.0.0
- ✅ Breaking change documented

---

## Expected Outcomes

### Release Preparation Workflow

| Action | Expected Result | Duration |
|--------|----------------|----------|
| Feature → Release PR | Workflow triggers | Immediate |
| Version analysis | Pre-release version generated | ~20s |
| CHANGELOG draft | Draft changelog created | ~15s |
| RELEASE_NOTES.md | QA checklist generated | ~10s |
| package.json update | RC version applied | ~5s |
| Git commit | Changes pushed to release branch | ~10s |
| **Total** | **Pre-release ready** | **~1 minute** |

### Semantic Release Workflow

| Action | Expected Result | Duration |
|--------|----------------|----------|
| Release → Main PR | Workflow triggers | Immediate |
| Branch validation | Ensures release/* or hotfix/* | ~5s |
| Pre-release removal | Converts RC to stable | ~10s |
| Semantic versioning | Final version determined | ~30s |
| CHANGELOG update | Production changelog | ~15s |
| GitHub release | Tagged release created | ~30s |
| **Total** | **Production deployed** | **~1.5 minutes** |

### Version Bumping Rules

| Commit Type | Version Change | Pre-release Example | Production Example |
|------------|---------------|-------------------|-------------------|
| `fix:` | Patch | 1.0.0-rc.1 → 1.0.1-rc.1 | 1.0.0 → 1.0.1 |
| `feat:` | Minor | 1.0.0-rc.1 → 1.1.0-rc.1 | 1.0.0 → 1.1.0 |
| `feat!:` | Major | 1.0.0-rc.1 → 2.0.0-rc.1 | 1.0.0 → 2.0.0 |

---

## Troubleshooting Guide

### Issue 1: Release Preparation Not Triggering

**Problem**: Feature merge to release branch doesn't trigger workflow

**Solution**:
```bash
# Verify workflow file triggers on both PR and push
cat .github/workflows/release-preparation.yml | grep -A10 "on:"

# Check workflow runs
gh run list --workflow=release-preparation.yml --limit 5

# The workflow should trigger on:
# - PR merge to release/* branches
# - Direct push to release/* branches
```

### Issue 2: Pre-release Version Not Applied

**Problem**: package.json not showing RC version

**Solution**:
```bash
# Check release branch name format
git branch -r | grep release/
# Must match: release/DDMMYY-description (e.g., release/120925-payment)

# Pull latest changes from release branch
git checkout release/DDMMYY-description
git pull origin release/DDMMYY-description

# Verify workflow ran successfully
gh run list --workflow=release-preparation.yml --limit=3
```

### Issue 3: Semantic Release Not Creating Release

**Problem**: Semantic-release runs but doesn't create a release

**Solution**:
```bash
# Check if running on push event (not PR event)
gh run view [RUN_ID] --log | grep "triggered by"

# Semantic-release v22 doesn't publish on PR events
# Workflow must trigger on push to main

# If needed, trigger manually:
gh workflow run semantic-release.yml --ref main
```

### Issue 4: Version Conflicts

**Problem**: Manual version edits conflict with automation

**Solution**:
```bash
# Never manually edit version in package.json
# Let workflows handle all versioning

# To fix conflicts:
git checkout main && git pull
npm version $(node -p "require('./package.json').version") --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: sync version"
git push
```

### Issue 5: PR Creation Fails - No Commits Between Branches

**Problem**: Error "No commits between release/vXXXXXX and feature/..."

**Solution**:
```bash
# This error occurs when using wrong branch name format
# WRONG: release/v120925 or release/v$RELEASE_DATE
# CORRECT: release/120925-description or release/$RELEASE_DATE-$RELEASE_DESC

# Always use this format for release branches:
RELEASE_DATE=$(date +%d%m%y)  # DDMMYY format
RELEASE_DESC="feature-name"   # lowercase with hyphens
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC

# Example correct command:
gh pr create --base release/120925-payment --head feature/payment-202509121234
# NOT: gh pr create --base release/v120925 --head feature/payment-202509121234
```

### Issue 6: Branch Configuration Errors

**Problem**: Semantic-release fails with EPRERELEASEBRANCHES error

**Solution**:
```bash
# Simplify .releaserc.json to only include main branch
cat .releaserc.json | jq '.branches'
# Should show: ["main"]

# Pre-release versions are handled by release-preparation.yml
# Production releases only happen on main branch

# Fix by editing .releaserc.json:
"branches": ["main"]
```

---

## Testing Checklist

### Pre-release Testing
- [ ] Feature branch created from main
- [ ] Conventional commits used
- [ ] Release branch created with DDMMYY-description format
- [ ] Feature PR merged to release branch
- [ ] Pre-release version generated (X.Y.Z-rc.TIMESTAMP)
- [ ] RELEASE_NOTES.md created
- [ ] CHANGELOG draft added
- [ ] QA testing completed on release branch

### Production Release
- [ ] Release branch PR created to main
- [ ] Semantic-release workflow triggered
- [ ] Pre-release suffix removed
- [ ] Stable version applied
- [ ] GitHub release created
- [ ] CHANGELOG.md finalized
- [ ] Version tags created

### Validation
- [ ] No ERELEASEBRANCHES errors
- [ ] No duplicate tag errors
- [ ] Correct version bumps applied
- [ ] All workflows completed successfully

---

## Quick Reference Commands

```bash
# Create feature branch
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout -b feature/name-$TIMESTAMP

# Create release branch
RELEASE_DATE=$(date +%d%m%y)  # DDMMYY format
RELEASE_DESC="feature-name"  # Your feature description
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC

# Feature to release PR
gh pr create --base release/$RELEASE_DATE-$RELEASE_DESC --head feature/name-$TIMESTAMP

# Release to main PR
gh pr create --base main --head release/$RELEASE_DATE-$RELEASE_DESC

# Create hotfix
git checkout -b hotfix/critical-issue

# Check workflows
gh run list --workflow="📋 Release Preparation" --limit=5
gh run list --workflow="🚀 Semantic Release" --limit=5

# View releases
gh release list --limit=5

# Check version
grep version package.json
```

---

## Recent Fixes and Updates

### Fixed Issues (as of Sept 12, 2025)

1. **Semantic-release Trigger Issue**
   - **Problem**: Workflow triggered by pull_request event, semantic-release skipped publishing
   - **Fix**: Changed trigger from `pull_request` to `push` event in semantic-release.yml
   - **Result**: Now properly creates releases when release branches merge to main

2. **Release Branch Naming**
   - **Problem**: Inconsistent naming between documentation and examples
   - **Fix**: Standardized to `release/DDMMYY-description` format
   - **Example**: `release/120925-payment-gateway`

3. **Branch Configuration**
   - **Problem**: EPRERELEASEBRANCHES error with multiple pre-release branches
   - **Fix**: Simplified .releaserc.json to only include main branch
   - **Note**: Pre-releases handled by release-preparation.yml, not semantic-release

4. **Workflow Conditions**
   - **Problem**: Release preparation skipped when pushing directly to release branches
   - **Fix**: Updated condition to handle both PR merges AND push events
   - **Code**: `if: github.event.pull_request.merged == true || github.event_name == 'push'`

### Current Working Configuration

```json
// .releaserc.json (simplified)
{
  "branches": ["main"],
  "plugins": [/* ... standard plugins ... */]
}
```

```yaml
# semantic-release.yml triggers
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

```yaml
# release-preparation.yml triggers
on:
  pull_request:
    branches:
      - 'release/**'
    types:
      - closed
  push:
    branches:
      - 'release/**'
```

---

## Summary

This advanced branching strategy provides:
- ✅ **Dual-path workflow**: Direct to release or via dev
- ✅ **Pre-release versions**: RC versions for QA testing (handled by release-preparation.yml)
- ✅ **Automated workflows**: Two specialized GitHub Actions with proper triggers
- ✅ **Flexible deployment**: Standard releases and hotfixes
- ✅ **Complete traceability**: Full audit trail with CHANGELOG and releases
- ✅ **Quality gates**: QA testing on release branches before production

### Key Points to Remember
1. Release branches use format: `release/DDMMYY-description`
2. Pre-release versions created by release-preparation workflow
3. Production releases triggered by push to main (not PR events)
4. Only main branch configured in .releaserc.json
5. Version bumping is fully automated - never edit manually

---

*Version 5.1.0 - Updated with fixes and working configuration (Sept 12, 2025)*