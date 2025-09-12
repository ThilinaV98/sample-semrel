# Manual Workflow Testing Guide - Advanced Branching Strategy

> **Version**: 5.0.0  
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

### Current Setup ✅ **NEW ARCHITECTURE**

#### Branches
- **main**: Production code only
- **dev**: Integration testing (optional)
- **release/DDMMYY-description**: QA testing with pre-releases
- **feature/***: Feature development
- **hotfix/***: Critical fixes

#### Workflows
1. **release-preparation.yml**: Triggers on feature → release merge
2. **semantic-release.yml**: Triggers on release → main merge

#### Version Format
- Production: `1.2.3`
- Pre-release: `1.2.3-rc.120125` (from release/120125-feature)
- Hotfix: `1.2.3-hotfix.1`

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
# Should include main, release/*, and hotfix/*

# 5. Clean up old test files
rm -f src/feature-*.js src/profiles-*.js src/search-*.js src/dashboard-*.js
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
# Format: DDMMYY-description
RELEASE_DATE=$(date +%d%m%y)  # Format: DDMMYY
RELEASE_DESC="payment-gateway"  # Short description
git checkout main
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC
git push -u origin release/$RELEASE_DATE-$RELEASE_DESC
```

### Step 1.3: Merge Feature to Release

```bash
# Create PR from feature to release
gh pr create \
  --base release/$RELEASE_DATE-$RELEASE_DESC \
  --head feature/payment-gateway-$TIMESTAMP \
  --title "feat: payment gateway integration" \
  --body "## Description
Payment gateway implementation for processing transactions

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual QA completed"

# Merge PR (triggers release-preparation.yml)
gh pr merge --merge --delete-branch
```

### Step 1.4: Verify Pre-release Creation

```bash
# Check the release branch for updates
git checkout release/$RELEASE_DATE-$RELEASE_DESC
git pull origin release/$RELEASE_DATE-$RELEASE_DESC

# Verify pre-release version in package.json
grep version package.json
# Should show: "version": "X.Y.Z-rc.YYYYMMDD"

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
gh pr create \
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
- Payment validation added"

# Merge to trigger semantic-release.yml
gh pr merge --merge --delete-branch
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
# PR to dev for testing
gh pr create \
  --base dev \
  --title "feat: user analytics" \
  --body "Adding analytics for integration testing"

# Merge to dev
gh pr merge --merge --delete-branch

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
gh pr create \
  --base main \
  --title "🚨 HOTFIX: Critical security patch" \
  --body "## Critical Security Fix
⚠️ CVE-2025-001 SQL Injection vulnerability

## Impact
- High severity
- Immediate deployment required

## Changes
- Input validation added
- SQL injection prevention"

# Merge immediately
gh pr merge --merge --delete-branch
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

# Merge all features to release
gh pr create --base release/v$RELEASE_DATE --head feature/dashboard-$TIMESTAMP1 \
  --title "feat: dashboard" --body "Admin dashboard"
gh pr merge --merge --delete-branch

gh pr create --base release/v$RELEASE_DATE --head feature/notifications-$TIMESTAMP2 \
  --title "feat: notifications" --body "Push notifications"
gh pr merge --merge --delete-branch

gh pr create --base release/v$RELEASE_DATE --head feature/reports-$TIMESTAMP3 \
  --title "feat: reports" --body "Reporting module"
gh pr merge --merge --delete-branch
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
gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "Release v$RELEASE_DATE - Multi-feature" \
  --body "## Features
- Admin dashboard
- Push notifications  
- Reporting module

## QA Status
✅ All features tested"

gh pr merge --merge --delete-branch
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

# Merge to release
gh pr create --base release/v$RELEASE_DATE --head feature/api-v2-$TIMESTAMP \
  --title "feat!: API v2" --body "Breaking API changes"
gh pr merge --merge --delete-branch
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
gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "🚀 MAJOR RELEASE: API v2.0" \
  --body "## ⚠️ Breaking Changes
- API v1 deprecated
- New auth required

## Migration Guide
See RELEASE_NOTES.md"

gh pr merge --merge --delete-branch

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
# Verify workflow file
cat .github/workflows/release-preparation.yml | grep -A5 "on:"

# Check if PR was actually merged
gh pr list --state merged --limit 5

# Manually trigger if needed
gh workflow run "📋 Release Preparation"
```

### Issue 2: Pre-release Version Not Applied

**Problem**: package.json not showing RC version

**Solution**:
```bash
# Check release branch name format
git branch -r | grep release/
# Must match: release/v[YYYYMMDD]

# Verify workflow ran
gh run list --workflow="📋 Release Preparation" --limit=3

# Check for errors
gh run view [RUN_ID] --log
```

### Issue 3: Semantic Release Validation Fails

**Problem**: "Only release/* or hotfix/* branches can trigger production releases"

**Solution**:
```bash
# Verify PR source branch
gh pr view --json headRefName

# Ensure it's from release/* or hotfix/*
# Feature branches cannot merge directly to main
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

### Issue 5: CHANGELOG Not Updating

**Problem**: CHANGELOG.md missing entries

**Solution**:
```bash
# Verify @semantic-release/changelog plugin
grep "@semantic-release/changelog" .releaserc.json

# Check workflow logs for errors
gh run view --log | grep -i changelog

# Manually trigger semantic-release
NPM_TOKEN="" GITHUB_TOKEN=$GITHUB_TOKEN npx semantic-release --dry-run
```

---

## Testing Checklist

### Pre-release Testing
- [ ] Feature branch created from main
- [ ] Conventional commits used
- [ ] Release branch created with v[YYYYMMDD] format
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

## Summary

This advanced branching strategy provides:
- ✅ **Dual-path workflow**: Direct to release or via dev
- ✅ **Pre-release versions**: RC versions for QA testing
- ✅ **Automated workflows**: Two specialized GitHub Actions
- ✅ **Flexible deployment**: Standard releases and hotfixes
- ✅ **Complete traceability**: Full audit trail
- ✅ **Quality gates**: QA testing before production

---

*Version 5.0.0 - Advanced Branching Strategy with QA Release Process*