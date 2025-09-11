# Manual Workflow Testing Guide - Single Workflow Version

> **Version**: 4.1.0  
> **Last Updated**: 2025-01-11  
> **Purpose**: Step-by-step manual testing of the single-workflow semantic versioning setup

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

This guide provides instructions for testing the corrected semantic versioning setup with 1 workflow that works via PR merge strategy.

### Current Setup ✅ **FIXED**

- **Workflows**: Only 1 workflow (semantic-release.yml) - changelog workflow removed
- **Purpose**: Automatic versioning only - NO linting, testing, or validation
- **Branching**: `main` → `feature/*` → PR to main → automatic versioning
- **Triggers**: **PR merge to main** (NOT push to release branches)

### Key Changes from Previous Version

- ❌ **REMOVED**: All validation workflows (feature-validation, dev-integration, etc.)
- ❌ **REMOVED**: All quality checks (linting, testing, security scans)
- ❌ **REMOVED**: PR validation and approval gates
- ❌ **REMOVED**: Duplicate changelog workflow (caused tag conflicts)
- ❌ **FIXED**: Removed ERELEASEBRANCHES error (was: 4 branches, now: 1 branch)
- ❌ **FIXED**: Changed trigger from release/* push to PR merge to main
- ✅ **KEPT**: Semantic versioning automation
- ✅ **KEPT**: Changelog generation (built into semantic-release)

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
# Should show: semantic-release.yml (only 1 workflow)

# 5. Optional: Clean up previous test files to avoid conflicts
ls -la src/ | grep -E "(feature-|bugfix-|perf-|profiles-|search-)"
# If you see test files from previous runs, you can remove them:
# rm src/feature-*.js src/bugfix-*.js src/perf-*.js src/profiles-*.js src/search-*.js
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

### 1. Semantic Release Workflow (`semantic-release.yml`) ✅ **FIXED**

**Trigger**: **PR merge to main branch** (NOT release/* push)  
**Purpose**: Automatic version bumping and GitHub release creation  
**Actions**:
- Analyzes commits for version determination
- Updates package.json version  
- Creates GitHub release
- Commits changes back to repository
- **Runs from main branch only** (fixes ERELEASEBRANCHES error)

### 2. Changelog Generation ✅ **INTEGRATED**

**Trigger**: Automatic during semantic-release execution  
**Purpose**: Generate and update CHANGELOG.md  
**Implementation**: Built into semantic-release via @semantic-release/changelog plugin
**Actions**:
- Generates changelog from conventional commits during semantic-release
- Updates CHANGELOG.md file automatically
- Commits changes with semantic-release commit

---

## Scenario 1: Basic Semantic Release ✅ **CORRECTED**

### Step 1.1: Create Feature Branch

```bash
# Start from main branch
git checkout main
git pull origin main

# Create feature branch with timestamp to avoid conflicts
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout -b feature/test-versioning-$TIMESTAMP

# Make changes with unique content
echo "// New feature code - Created on $(date)" > src/new-feature-$TIMESTAMP.js
git add .
git commit -m "feat: add new versioning test feature

- This is a new feature that should trigger minor version bump
- Testing semantic release workflow
- Created at $(date)"

# Push feature branch
git push -u origin feature/test-versioning-$TIMESTAMP
```

### Step 1.2: Create Pull Request to Main

```bash
# Create PR using GitHub CLI
gh pr create --base main --title "feat: add new versioning test feature" --body "Testing semantic release with new feature

- Should trigger minor version bump
- Testing corrected PR-merge workflow"
```

### Step 1.3: Merge Pull Request

```bash
# Merge the PR to trigger semantic release
gh pr merge --merge --delete-branch
```

### Step 1.4: Monitor Workflow

```bash
# Check workflow status (triggered by PR merge)
gh run list --workflow="🚀 Semantic Release" --limit=1

# View workflow logs
gh run view --web
```

**Expected Results**:
- ✅ Workflow triggers on **PR merge to main** (NOT release/* push)
- ✅ Version bumps based on commit type (feat = minor)
- ✅ package.json updated with new version
- ✅ GitHub release created
- ✅ Changes committed back to repository
- ✅ **No ERELEASEBRANCHES error** (runs from main only)

---

## Scenario 2: Multiple Commits Flow ✅ **CORRECTED**

### Step 2.1: Create Feature Branch with Multiple Commits

```bash
# Create feature branch with timestamp to avoid conflicts
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main
git checkout -b feature/multi-commit-$TIMESTAMP

# Add feature with unique content
echo "// Feature A - Added on $(date)" > src/feature-a-$TIMESTAMP.js
git add .
git commit -m "feat: add feature A functionality"

# Add fix with unique content
echo "// Bug fix - Applied on $(date)" > src/bugfix-$TIMESTAMP.js
git add .
git commit -m "fix: resolve critical bug in authentication"

# Add performance improvement with unique content
echo "// Performance optimization - Applied on $(date)" > src/perf-$TIMESTAMP.js
git add .
git commit -m "perf: optimize database queries"

# Push feature branch
git push -u origin feature/multi-commit-$TIMESTAMP
```

### Step 2.2: Create PR and Merge

```bash
# Create PR to main
gh pr create --base main --title "feat: multiple improvements" --body "Multiple commits test:

- feat: Feature A functionality (minor bump)
- fix: Authentication bug fix (patch bump)  
- perf: Database optimization (patch bump)

Expected: Minor version bump due to feat commit"

# Merge PR to trigger semantic release
gh pr merge --merge --delete-branch
```

### Step 2.3: Verify Results

```bash
# Check GitHub for new release
gh release list --limit=3

# Check version in package.json (pull latest main)
git checkout main && git pull origin main
grep version package.json

# Check changelog was generated
cat CHANGELOG.md
```

**Expected Version Bump**:
- `feat:` commits → Minor version (e.g., 1.1.1 → 1.2.0)
- `fix:` and `perf:` commits → Included in same release notes
- **Single version bump** for multiple commit types

---

## Scenario 3: Separate Feature PRs ✅ **CORRECTED**

### Step 3.1: Create and Merge First Feature

```bash
# Feature 1: User profiles
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main
git checkout -b feature/user-profiles-$TIMESTAMP

echo "// User profiles - Created on $(date)" > src/profiles-$TIMESTAMP.js
git add .
git commit -m "feat: add user profile management

- CRUD operations for user profiles
- Profile picture upload  
- Privacy settings
- Created at $(date)"

git push -u origin feature/user-profiles-$TIMESTAMP

# Create and merge first PR
gh pr create --base main --title "feat: user profile management" --body "Add user profile functionality"
gh pr merge --merge --delete-branch
```

### Step 3.2: Create and Merge Second Feature

```bash
# Feature 2: Search functionality  
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main && git pull origin main
git checkout -b feature/search-$TIMESTAMP

echo "// Search engine - Created on $(date)" > src/search-$TIMESTAMP.js
git add .
git commit -m "feat: implement search functionality

- Full-text search
- Search filters
- Search history
- Created at $(date)"

git push -u origin feature/search-$TIMESTAMP

# Create and merge second PR
gh pr create --base main --title "feat: search functionality" --body "Add search engine"
gh pr merge --merge --delete-branch
```

### Step 3.3: Verify Separate Releases

```bash
# Check that two separate releases were created
gh release list --limit=5

# Both features should have triggered separate versions
git checkout main && git pull origin main
git log --oneline -10
```

**Expected Results**:
- ✅ **Two separate releases** created (one per PR merge)
- ✅ **Two version bumps** (e.g., 1.2.0 → 1.3.0 → 1.4.0)
- ✅ Each release contains only its respective commits
- ✅ **No ERELEASEBRANCHES errors**

---

## Scenario 4: Verify Automatic Changelog Generation ✅ **UPDATED**

### Step 4.1: Check Changelog After Release

```bash
# After any PR merge that triggered semantic-release, check the changelog
git checkout main && git pull origin main
cat CHANGELOG.md

# Verify latest release appears in changelog
head -20 CHANGELOG.md
```

### Step 4.2: Verify Changelog Format

```bash
# Check that conventional commit types are properly organized
grep -A5 "### Features" CHANGELOG.md
grep -A5 "### Bug Fixes" CHANGELOG.md  
grep -A5 "### Performance" CHANGELOG.md

# Verify links work
grep "compare/" CHANGELOG.md | head -1
```

**Expected Results**:
- ✅ Changelog automatically updated during semantic-release
- ✅ Conventional commit format reflected in sections (Features, Bug Fixes, etc.)
- ✅ Compare links between versions work
- ✅ No manual workflow needed (fully integrated)

---

## Expected Outcomes

### Semantic Release Workflow ✅ **UPDATED**

| Action | Expected Result | Duration |
|--------|----------------|----------|
| PR merge to main | Workflow triggers | Immediate |
| Commit analysis | Version determined | ~30s |
| Version update | package.json updated | ~10s |
| Changelog generation | CHANGELOG.md created/updated | ~15s |
| GitHub release | Release created with notes | ~30s |
| Git commit | Changes pushed back | ~10s |
| **Total** | **Complete success** | **~2 minutes** |

### Integrated Changelog Generation ✅ **BUILT-IN**

| Action | Expected Result | Notes |
|--------|----------------|-------|
| Automatic trigger | During semantic-release | Built into workflow |
| Changelog generation | CHANGELOG.md updated | @semantic-release/changelog |
| Commit integration | Included in release commit | No separate workflow |
| **Result** | **Fully integrated** | **No manual steps** |

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

### Issue 1: Workflow Not Triggering ✅ **UPDATED**

**Problem**: PR merge doesn't trigger semantic release workflow

**Solution**:
```bash
# Verify you merged PR (not just closed)
gh pr view --json state,merged

# Check workflow file exists and is correct
ls -la .github/workflows/semantic-release.yml
grep -A5 "on:" .github/workflows/semantic-release.yml
# Should show: pull_request with types: closed

# Ensure PR was merged to main branch
gh pr list --state merged --limit 3

# Force trigger manually if needed
gh workflow run "🚀 Semantic Release"
```

### Issue 2: No Version Bump

**Problem**: Semantic release says "No release needed"

**Solution**:
```bash
# Check commit messages in merged PR follow convention
git log --oneline main -10

# Ensure at least one releasable commit in the PR:
# feat:, fix:, perf:, or refactor:

# If no valid commits, create new PR with valid commit:
git checkout -b feature/trigger-release
git commit --allow-empty -m "fix: trigger version bump for testing"
git push -u origin feature/trigger-release
gh pr create --base main --title "fix: trigger version bump" --body "Testing semantic release"
gh pr merge --merge --delete-branch
```

### Issue 3: Changelog Not Updating ✅ **UPDATED**

**Problem**: CHANGELOG.md not being updated during semantic-release

**Solution**:
```bash
# Check if CHANGELOG.md exists
ls -la CHANGELOG.md

# Verify semantic-release changelog plugin is configured
grep -A5 "@semantic-release/changelog" .releaserc.json

# If missing, create initial changelog:
echo "# Changelog" > CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: add changelog file"
git push

# Changelog will be updated automatically on next semantic-release
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

### Issue 5: "No commits between branches" Error ✅ **ADDED**

**Problem**: `pull request create failed: GraphQL: No commits between main and branch`

**Root Cause**: Files already exist with same content, so no changes to commit

**Solution**:
```bash
# Check if files were actually created but not committed
git status

# If files exist but no changes:
ls -la src/

# The issue: files already exist from previous tests
# Solution: Use unique filenames with timestamp (already in guide)
TIMESTAMP=$(date +%Y%m%d%H%M)
echo "// Unique content - $(date)" > src/unique-file-$TIMESTAMP.js
git add .
git status  # Should show changes now

# If still no changes, check if you're in the right branch
git branch --show-current

# Verify branch was created properly
git log --oneline -3
```

### Issue 6: ERELEASEBRANCHES Error ✅ **FIXED**

**Problem**: "The release branches are invalid in the branches configuration"

**Solution** ✅ **RESOLVED**:
```bash
# This error has been FIXED in the current configuration:
# 1. .releaserc.json now uses only "main" branch
# 2. Workflow triggers on PR merge, not release/* push
# 3. All problematic release/* branches were deleted

# To verify fix:
cat .releaserc.json | grep -A3 '"branches"'
# Should show only: ["main"]

# Verify no release/* branches exist:
git branch -r | grep release/ 
# Should return empty (no release branches)

# If you still see this error, ensure:
grep "branches" .releaserc.json
# Should contain ONLY: "branches": ["main"]
```

---

## Testing Checklist

### Pre-Release Checklist ✅ **UPDATED**
- [ ] Feature branch created from main
- [ ] Commits follow conventional format (feat:, fix:, etc.)
- [ ] Pull request created to main branch
- [ ] PR reviewed and ready to merge

### Workflow Validation ✅ **CORRECTED**
- [ ] Semantic release triggers on **PR merge to main** (NOT release/* push)
- [ ] Version bumps correctly based on commits
- [ ] GitHub release created with notes
- [ ] package.json version updated
- [ ] **No ERELEASEBRANCHES errors**
- [ ] **No tag conflict errors** (duplicate workflow removed)
- [ ] CHANGELOG.md updated automatically during semantic-release

### Post-Release Verification
- [ ] New version tag exists in repository
- [ ] GitHub release visible on releases page
- [ ] package.json shows new version
- [ ] CHANGELOG.md contains release notes
- [ ] No validation errors (since we removed all checks)

---

## Summary

This **corrected** workflow setup:

1. **Single workflow only** - semantic-release.yml handles everything
2. **Triggers on PR merge to main** - NOT on release/* branches  
3. **Automatically determines version** - based on conventional commits
4. **Integrated changelog generation** - built into semantic-release workflow
5. **No validation** - no linting, testing, or security checks
6. **✅ FIXED ERELEASEBRANCHES error** - uses only main branch
7. **✅ FIXED tag conflict errors** - no duplicate workflows

### Quick Command Reference ✅ **CORRECTED**

```bash
# Create feature with unique name
TIMESTAMP=$(date +%Y%m%d%H%M)
git checkout main && git pull origin main
git checkout -b feature/your-feature-$TIMESTAMP
git commit -m "feat: description"
git push -u origin feature/your-feature-$TIMESTAMP

# Create PR and merge (triggers semantic release)
gh pr create --base main --title "feat: description" --body "Feature description"
gh pr merge --merge --delete-branch

# Check status (changelog included automatically)
gh run list --workflow="🚀 Semantic Release" --limit=3
gh release list --limit=5

# Verify changelog was updated
cat CHANGELOG.md | head -20
```

---

*Updated for **single-workflow** semantic versioning v4.0.0 - ✅ All conflicts resolved*