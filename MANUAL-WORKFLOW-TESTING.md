# Manual Workflow Testing Guide - Simplified Version

> **Version**: 2.0.0  
> **Last Updated**: 2025  
> **Purpose**: Step-by-step manual testing of the simplified semantic versioning workflows

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Workflow Configuration](#workflow-configuration)
4. [Scenario 1: Basic Semantic Release](#scenario-1-basic-semantic-release)
5. [Scenario 2: Feature to Release Flow](#scenario-2-feature-to-release-flow)
6. [Scenario 3: Multiple Features Integration](#scenario-3-multiple-features-integration)
7. [Scenario 4: Manual Changelog Generation](#scenario-4-manual-changelog-generation)
8. [Expected Outcomes](#expected-outcomes)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide provides instructions for testing the simplified semantic versioning setup with only 2 workflows focused exclusively on version management and changelog generation.

### Current Setup

- **Workflows**: Only 2 workflows (semantic-release.yml, changelog.yml)
- **Purpose**: Automatic versioning only - NO linting, testing, or validation
- **Branching**: `main` → `feature/*` → `release/*` → automatic versioning
- **Triggers**: Push to `release/*` branches only

### Key Changes from Previous Version

- ❌ **REMOVED**: All validation workflows (feature-validation, dev-integration, etc.)
- ❌ **REMOVED**: All quality checks (linting, testing, security scans)
- ❌ **REMOVED**: PR validation and approval gates
- ✅ **KEPT**: Semantic versioning automation
- ✅ **KEPT**: Changelog generation

---

## Prerequisites

### Required Setup

```bash
# 1. Navigate to project directory
cd /Users/cosmo/Documents/Course/sample-semrel

# 2. Verify git configuration
git config --list | grep -E "user\.(name|email)"

# 3. Check current branch status
git status
git branch -a

# 4. Verify workflows exist
ls -la .github/workflows/
# Should show: semantic-release.yml and changelog.yml
```

### Required Dependencies

```bash
# Verify semantic-release is installed
npm ls semantic-release @semantic-release/git @semantic-release/changelog

# Install if missing
npm install --save-dev semantic-release \
  @semantic-release/git \
  @semantic-release/changelog \
  @semantic-release/github \
  @semantic-release/npm
```

---

## Workflow Configuration

### 1. Semantic Release Workflow (`semantic-release.yml`)

**Trigger**: Push to `release/*` branches  
**Purpose**: Automatic version bumping and GitHub release creation  
**Actions**:
- Analyzes commits for version determination
- Updates package.json version
- Creates GitHub release
- Commits changes back to repository

### 2. Changelog Workflow (`changelog.yml`)

**Trigger**: After semantic-release completes OR manual trigger  
**Purpose**: Generate and update CHANGELOG.md  
**Actions**:
- Generates changelog from conventional commits
- Updates CHANGELOG.md file
- Commits changes with [skip ci] flag

---

## Scenario 1: Basic Semantic Release

### Step 1.1: Create Feature Branch

```bash
# Start from main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/test-versioning

# Make changes
echo "// New feature code" >> src/new-feature.js
git add .
git commit -m "feat: add new versioning test feature

- This is a new feature that should trigger minor version bump
- Testing semantic release workflow"
```

### Step 1.2: Create Release Branch

```bash
# Go back to main
git checkout main

# Create release branch (version number is arbitrary, will be auto-calculated)
git checkout -b release/v1.1.0

# Merge feature into release
git merge feature/test-versioning
```

### Step 1.3: Push Release Branch

```bash
# Push to trigger semantic release
git push origin release/v1.1.0
```

### Step 1.4: Monitor Workflow

```bash
# Check workflow status
gh run list --workflow=semantic-release.yml --limit=1

# View workflow logs
gh run view --web
```

**Expected Results**:
- ✅ Workflow triggers on push to `release/*`
- ✅ Version bumps based on commit type (feat = minor)
- ✅ package.json updated with new version
- ✅ GitHub release created
- ✅ Changes committed back to repository

---

## Scenario 2: Feature to Release Flow

### Step 2.1: Create Multiple Commits

```bash
# Create feature branch
git checkout main
git checkout -b feature/multi-commit

# Add feature
echo "// Feature A" > src/feature-a.js
git add .
git commit -m "feat: add feature A functionality"

# Add fix
echo "// Bug fix" > src/bugfix.js
git add .
git commit -m "fix: resolve critical bug in authentication"

# Add performance improvement
echo "// Performance optimization" > src/perf.js
git add .
git commit -m "perf: optimize database queries"

# Push feature branch (optional, for backup)
git push origin feature/multi-commit
```

### Step 2.2: Create and Push Release

```bash
# Create release branch from main
git checkout main
git checkout -b release/v1.2.0

# Merge all changes
git merge feature/multi-commit

# Push to trigger versioning
git push origin release/v1.2.0
```

### Step 2.3: Verify Results

```bash
# Check GitHub for new release
gh release list --limit=3

# Check version in package.json
git pull origin release/v1.2.0
grep version package.json

# Check changelog was generated
cat CHANGELOG.md
```

**Expected Version Bump**:
- `feat:` commits → Minor version (1.1.0 → 1.2.0)
- `fix:` and `perf:` commits → Included in release notes

---

## Scenario 3: Multiple Features Integration

### Step 3.1: Create First Feature

```bash
# Feature 1: User profiles
git checkout main
git checkout -b feature/user-profiles

echo "// User profiles" > src/profiles.js
git add .
git commit -m "feat: add user profile management

- CRUD operations for user profiles
- Profile picture upload
- Privacy settings"

git push origin feature/user-profiles
```

### Step 3.2: Create Second Feature

```bash
# Feature 2: Search functionality
git checkout main
git checkout -b feature/search

echo "// Search engine" > src/search.js
git add .
git commit -m "feat: implement search functionality

- Full-text search
- Search filters
- Search history"

git push origin feature/search
```

### Step 3.3: Integrate into Release

```bash
# Create release branch
git checkout main
git checkout -b release/v1.3.0

# Merge both features
git merge feature/user-profiles
git merge feature/search

# Push to trigger versioning
git push origin release/v1.3.0
```

**Expected Results**:
- ✅ Both features included in release
- ✅ Version bumped once (not twice) for multiple features
- ✅ All commits listed in release notes

---

## Scenario 4: Manual Changelog Generation

### Step 4.1: Trigger Changelog Manually

```bash
# Trigger changelog workflow manually
gh workflow run changelog.yml

# Or via GitHub UI:
# Actions → Generate Changelog → Run workflow
```

### Step 4.2: Verify Changelog Update

```bash
# Wait for workflow to complete
gh run list --workflow=changelog.yml --limit=1

# Pull and check changes
git pull origin main
cat CHANGELOG.md
```

**Expected Results**:
- ✅ Changelog updated with all recent releases
- ✅ Conventional commit format reflected in sections
- ✅ Commit with message "chore(release): update changelog [skip ci]"

---

## Expected Outcomes

### Semantic Release Workflow

| Action | Expected Result | Duration |
|--------|----------------|----------|
| Push to release/* | Workflow triggers | Immediate |
| Commit analysis | Version determined | ~30s |
| Version update | package.json updated | ~10s |
| GitHub release | Release created with notes | ~30s |
| Git commit | Changes pushed back | ~10s |
| **Total** | **Complete success** | **~2 minutes** |

### Changelog Workflow

| Action | Expected Result | Duration |
|--------|----------------|----------|
| Trigger (manual/auto) | Workflow starts | Immediate |
| Changelog generation | CHANGELOG.md created/updated | ~30s |
| Git commit | Changes pushed with [skip ci] | ~10s |
| **Total** | **Complete success** | **~1 minute** |

### Version Bumping Rules

| Commit Type | Version Change | Example |
|------------|---------------|---------|
| `feat:` | Minor bump (x.Y.z) | 1.0.0 → 1.1.0 |
| `fix:` | Patch bump (x.y.Z) | 1.1.0 → 1.1.1 |
| `perf:` | Patch bump (x.y.Z) | 1.1.1 → 1.1.2 |
| `refactor:` | Patch bump (x.y.Z) | 1.1.2 → 1.1.3 |
| `BREAKING CHANGE` | Major bump (X.y.z) | 1.1.3 → 2.0.0 |
| `docs:`, `style:`, `test:`, `chore:` | No version change | 1.1.3 → 1.1.3 |

---

## Troubleshooting Guide

### Issue 1: Workflow Not Triggering

**Problem**: Push to release/* doesn't trigger workflow

**Solution**:
```bash
# Verify branch name matches pattern
git branch --show-current
# Must be: release/* (e.g., release/v1.0.0)

# Check workflow file exists
ls -la .github/workflows/semantic-release.yml

# Force push if needed
git push -f origin release/v1.0.0
```

### Issue 2: No Version Bump

**Problem**: Semantic release says "No release needed"

**Solution**:
```bash
# Check commit messages follow convention
git log --oneline -10

# Ensure at least one releasable commit:
# feat:, fix:, perf:, or refactor:

# If no valid commits, add one:
git commit --allow-empty -m "fix: trigger version bump"
git push origin release/v1.0.0
```

### Issue 3: Changelog Not Updating

**Problem**: Changelog workflow runs but file doesn't update

**Solution**:
```bash
# Check if CHANGELOG.md exists
ls -la CHANGELOG.md

# If missing, create it:
echo "# Changelog" > CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: add changelog file"
git push

# Re-run changelog workflow
gh workflow run changelog.yml
```

### Issue 4: Permission Errors

**Problem**: Workflow fails with permission errors

**Solution**:
```bash
# Verify GitHub token has necessary permissions:
# - contents: write
# - issues: write  
# - pull-requests: write

# Check in workflow file:
grep -A3 "permissions:" .github/workflows/semantic-release.yml
```

### Issue 5: Version Already Exists

**Problem**: Version tag already exists

**Solution**:
```bash
# List existing tags
git tag -l

# Delete local tag if needed
git tag -d v1.1.0

# Delete remote tag (use with caution)
git push origin :refs/tags/v1.1.0

# Retry release
git push origin release/v1.1.0
```

---

## Testing Checklist

### Pre-Release Checklist
- [ ] Feature branch created from main
- [ ] Commits follow conventional format
- [ ] Release branch created from main
- [ ] Features merged into release branch

### Workflow Validation
- [ ] Semantic release triggers on push to release/*
- [ ] Version bumps correctly based on commits
- [ ] GitHub release created with notes
- [ ] package.json version updated
- [ ] Changelog workflow triggers (auto or manual)
- [ ] CHANGELOG.md updated with changes

### Post-Release Verification
- [ ] New version tag exists in repository
- [ ] GitHub release visible on releases page
- [ ] package.json shows new version
- [ ] CHANGELOG.md contains release notes
- [ ] No validation errors (since we removed all checks)

---

## Summary

This simplified workflow setup:

1. **ONLY handles versioning** - no quality checks
2. **Triggers on release branches** - not on PRs or feature branches
3. **Automatically determines version** - based on conventional commits
4. **Generates changelog** - either automatically or manually
5. **No validation** - no linting, testing, or security checks

### Quick Command Reference

```bash
# Create feature
git checkout -b feature/name
git commit -m "feat: description"

# Create release
git checkout main
git checkout -b release/v1.0.0
git merge feature/name
git push origin release/v1.0.0

# Manual changelog
gh workflow run changelog.yml

# Check status
gh run list --limit=5
gh release list --limit=5
```

---

*Updated for simplified semantic versioning workflow v2.0.0*