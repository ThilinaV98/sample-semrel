# Manual Workflow Testing Guide

> **Version**: 1.0.0  
> **Last Updated**: 2024  
> **Purpose**: Step-by-step manual testing of the complete branching strategy and CI/CD workflows

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Testing Scenarios](#testing-scenarios)
4. [Scenario 1: Feature Development Flow](#scenario-1-feature-development-flow)
5. [Scenario 2: Release Preparation Flow](#scenario-2-release-preparation-flow)
6. [Scenario 3: Hotfix Emergency Flow](#scenario-3-hotfix-emergency-flow)
7. [Scenario 4: Multiple Feature Integration](#scenario-4-multiple-feature-integration)
8. [Scenario 5: Failed Workflow Recovery](#scenario-5-failed-workflow-recovery)
9. [Expected Outcomes Reference](#expected-outcomes-reference)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide provides complete step-by-step instructions for manually testing your GitHub Actions workflows and branching strategy by creating real branches, commits, and pull requests.

### Current Project State

- **Current Branch**: `feature/initial-feature` (just committed workflow improvements)
- **Available Branches**: `main`, `dev`, `feature/initial-feature`
- **Workflows**: 5 workflows ready for testing
- **Status**: Ready to test complete development flow

### Testing Philosophy

1. **Real Environment Testing**: Use actual GitHub (not just Act simulation)
2. **Complete Flow Validation**: Test entire branch lifecycle
3. **Expected vs Actual**: Document what should happen vs what does happen
4. **Failure Recovery**: Test error handling and recovery procedures

---

## Prerequisites

### Required Setup

```bash
# 1. Ensure you're in the project directory
cd /Users/cosmo/Documents/Course/sample-semrel

# 2. Verify git is properly configured
git config --list | grep -E "user\.(name|email)"

# 3. Check GitHub CLI is authenticated (optional but helpful)
gh auth status

# 4. Verify all workflows are valid
npm run validate:workflows

# 5. Check current status
git status
git branch -a
```

### Required Permissions

- Push access to repository
- Permission to create pull requests
- Permission to merge pull requests
- Permission to create releases (for testing)

---

## Testing Scenarios

## Scenario 1: Feature Development Flow

> **Purpose**: Test the complete feature development workflow  
> **Flow**: `feature/*` → `dev` → `release/*` → `main`  
> **Duration**: ~15-20 minutes  

### Step 1.1: Complete Current Feature

Since we're already on `feature/initial-feature` with committed changes:

```bash
# Push the current feature branch
git push origin feature/initial-feature
```

**Expected Result**: 
- Branch is pushed to GitHub
- No workflows trigger yet (only on PR creation)

### Step 1.2: Create Pull Request to Dev

```bash
# Create PR using GitHub CLI (or use GitHub web interface)
gh pr create \
  --title "feat: enhance CI/CD workflows and add comprehensive testing" \
  --body "## 🚀 Feature: Enhanced CI/CD Workflows

### Changes Made
- Added hotfix workflow for emergency fixes
- Improved semantic-release workflow with better branch handling
- Added comprehensive testing infrastructure (Act, scripts, documentation)
- Enhanced coverage enforcement (80% threshold)
- Updated configuration for hotfix support

### Testing Done
- ✅ All workflows pass syntax validation
- ✅ Act configuration tested locally
- ✅ Coverage thresholds enforced
- ✅ Conventional commit format validated

### Quality Checklist
- [x] Tests pass
- [x] Linting passes
- [x] Documentation updated
- [x] Breaking changes documented

Ready for dev integration testing." \
  --base dev \
  --head feature/initial-feature
```

**Expected Result**:
- ✅ **Feature Validation Workflow** (`feature-validation.yml`) triggers
- PR is created with proper formatting
- Status checks appear on the PR

### Step 1.3: Monitor Feature Validation Workflow

```bash
# Watch the workflow progress
gh run list --workflow=feature-validation.yml --limit=1
gh run view --web  # Opens browser to view logs
```

**Expected Workflow Steps**:
1. **Lint & Code Quality** - ✅ Should pass
2. **Build & Test** - ✅ Should pass  
3. **Commit Message Validation** - ✅ Should pass
4. **Security Scan** - ✅ Should pass
5. **Feature Status Check** - ✅ Should pass

**If Issues Occur**: See [Troubleshooting Guide](#troubleshooting-guide)

### Step 1.4: Merge to Dev Branch

Once all checks pass:

```bash
# Merge the PR (via GitHub CLI or web interface)
gh pr merge --merge --delete-branch
```

**Expected Results**:
- ✅ PR is merged to `dev`
- ✅ `feature/initial-feature` branch is deleted
- ✅ **Dev Integration Workflow** (`dev-integration.yml`) triggers

### Step 1.5: Monitor Dev Integration Workflow

```bash
# Switch to dev branch to see the merge
git checkout dev
git pull origin dev

# Monitor the dev integration workflow
gh run list --workflow=dev-integration.yml --limit=1
```

**Expected Workflow Steps**:
1. **Integration Tests** - ✅ Full test suite with coverage
2. **Pre-release Validation** - ✅ Commit analysis and dry-run
3. **Quality Check** - ✅ Code quality metrics
4. **Dev Integration Status** - ✅ Summary report

### Step 1.6: Verification

```bash
# Verify the merge
git log --oneline -5
git branch -a

# Check for release-ready commits
git log --grep="feat:" --grep="fix:" --grep="perf:" --oneline
```

**Expected State**:
- ✅ Changes are merged into `dev`
- ✅ Dev integration workflow completed successfully
- ✅ Ready for release preparation

---

## Scenario 2: Release Preparation Flow

> **Purpose**: Test manual release creation and QA workflow  
> **Flow**: `dev` → `release/vX.Y.Z-rc.N` → `main`  
> **Duration**: ~10-15 minutes  

### Step 2.1: Trigger Release Preparation

Use GitHub's workflow dispatch feature:

```bash
# Via GitHub CLI
gh workflow run release-preparation.yml \
  --field source_branch=dev \
  --field release_type=minor \
  --field pre_release_identifier=rc

# Or via web interface:
# Go to Actions > Release Preparation > Run workflow
```

**Input Parameters**:
- **Source Branch**: `dev`
- **Release Type**: `minor` (since we added features)
- **Pre-release Identifier**: `rc`

### Step 2.2: Monitor Release Preparation

```bash
# Watch the workflow
gh run list --workflow=release-preparation.yml --limit=1
gh run view --web
```

**Expected Workflow Steps**:
1. **Validate Source Branch** - ✅ Dev branch validation
2. **Create Release Branch** - ✅ New `release/v*` branch created
3. **Create QA Testing Issue** - ✅ GitHub issue for QA tracking
4. **Notify Completion** - ✅ Summary and next steps

### Step 2.3: Verify Release Branch Creation

```bash
# Fetch latest branches
git fetch origin

# Check for new release branch
git branch -a | grep release

# Switch to the release branch
git checkout release/v1.1.0-rc.1  # (example version)
```

**Expected Results**:
- ✅ Release branch `release/v1.1.0-rc.1` exists
- ✅ Package.json version updated to `1.1.0-rc.1`
- ✅ GitHub issue created for QA testing

### Step 2.4: Simulate QA Testing

```bash
# Test the release branch
npm install
npm run test:coverage
npm run lint
npm start  # Test application startup

# Verify version
grep '"version"' package.json
```

**QA Checklist**:
- ✅ All tests pass
- ✅ Application starts without errors
- ✅ Version number is correct
- ✅ No console errors

### Step 2.5: Create PR to Main (QA Approved)

```bash
# Create PR from release branch to main
gh pr create \
  --title "release: v1.1.0-rc.1 → Production" \
  --body "## 🎁 Release v1.1.0-rc.1

### QA Validation Complete
- ✅ All tests pass
- ✅ Application functionality verified
- ✅ Performance acceptable
- ✅ No critical issues found

### Features in This Release
- Enhanced CI/CD workflows with hotfix support
- Comprehensive testing infrastructure
- Coverage enforcement (80% threshold)
- Improved semantic versioning automation

### Deployment Notes
- This is a minor version release
- No breaking changes
- Database migrations: None required
- Rollback plan: Previous version available

**QA Sign-off**: Approved for production deployment" \
  --base main \
  --head release/v1.1.0-rc.1
```

### Step 2.6: Merge Release to Main

```bash
# Merge the release PR
gh pr merge --merge
```

**Expected Results**:
- ✅ **Semantic Release Workflow** (`semantic-release.yml`) triggers
- ✅ Automatic version tagging and release creation
- ✅ Changelog generation
- ✅ Dev branch synchronization

---

## Scenario 3: Hotfix Emergency Flow

> **Purpose**: Test emergency hotfix workflow  
> **Flow**: `main` → `hotfix/*` → `main` (immediate) → `dev` (sync)  
> **Duration**: ~10 minutes  

### Step 3.1: Create Hotfix Branch

```bash
# Start from main (production state)
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-security-fix

# Make a critical fix (simulate security patch)
echo "// Security patch applied $(date)" >> src/security-patch.js
```

### Step 3.2: Make Hotfix Commit

```bash
# Stage and commit with proper convention
git add .
git commit -m "hotfix: patch critical authentication vulnerability

CVE-2024-XXXX: Fixed SQL injection in user authentication.
This is a critical security patch that must be deployed immediately.

BREAKING CHANGE: Updated authentication API response format for security"

# Push hotfix branch
git push origin hotfix/critical-security-fix
```

**Expected Results**:
- ✅ **Hotfix Workflow** (`hotfix.yml`) triggers immediately
- ✅ Expedited validation runs (faster than normal PR process)

### Step 3.3: Monitor Hotfix Workflow

```bash
# Watch hotfix workflow
gh run list --workflow=hotfix.yml --limit=1
```

**Expected Workflow Steps**:
1. **Expedited Validation** - ⚡ Fast security and test checks
2. **Impact Analysis** - 🔍 Severity assessment
3. **Approval Gate** - 🔐 Security review (if PR)
4. **Deployment Prep** - 🚀 Production readiness

### Step 3.4: Create Emergency PR to Main

```bash
# Create emergency PR
gh pr create \
  --title "🚨 HOTFIX: Critical security vulnerability patch" \
  --body "## 🚨 EMERGENCY SECURITY HOTFIX

**Severity**: 🔴 CRITICAL  
**CVE**: CVE-2024-XXXX  
**Impact**: SQL injection vulnerability in authentication  

### 🔧 Changes
- Fixed SQL injection vulnerability in authentication system
- Added input validation and parameterized queries
- Updated security tests

### ⚠️ Breaking Changes
- Authentication API response format updated for security
- Legacy endpoints deprecated immediately

### 🧪 Testing
- [x] Security vulnerability patched and verified
- [x] All tests pass
- [x] No performance regression
- [x] Impact analysis: HIGH severity, LOW risk with fix

### 📋 Deployment Requirements
- **IMMEDIATE DEPLOYMENT REQUIRED**
- All active sessions will be invalidated
- Users will need to re-authenticate
- Monitor authentication logs for 24h

### 🔄 Post-Deployment Checklist
- [ ] Verify vulnerability patched in production
- [ ] Monitor error rates and performance
- [ ] Confirm no authentication issues
- [ ] Security team sign-off

---
**⚠️ This is an emergency security patch requiring immediate review and deployment.**" \
  --base main \
  --head hotfix/critical-security-fix \
  --label "hotfix,security,critical"
```

### Step 3.5: Emergency Merge Process

```bash
# For emergency hotfixes, merge immediately after approval
gh pr merge --merge --delete-branch
```

**Expected Results**:
- ✅ **Semantic Release Workflow** triggers for hotfix
- ✅ Emergency version created (e.g., v1.1.1)
- ✅ Immediate production deployment preparation
- ✅ Automatic sync back to `dev` branch

### Step 3.6: Verify Hotfix Deployment

```bash
# Check version was bumped
git checkout main
git pull origin main
git tag -l | tail -5

# Verify dev sync
git checkout dev
git pull origin dev
git log --oneline -3
```

**Expected Results**:
- ✅ New patch version tag created (v1.1.1)
- ✅ Hotfix changes merged to main
- ✅ Changes automatically synced to dev
- ✅ Release notes generated

---

## Scenario 4: Multiple Feature Integration

> **Purpose**: Test concurrent feature development  
> **Flow**: Multiple `feature/*` → `dev` → conflict resolution  
> **Duration**: ~15 minutes  

### Step 4.1: Create Multiple Feature Branches

```bash
# Feature 1: Add user profiles
git checkout main
git checkout -b feature/user-profiles

# Make changes
echo "// User profile functionality" > src/profiles.js
git add .
git commit -m "feat: add user profile management system

- Create user profile CRUD operations
- Add profile validation
- Include avatar upload functionality"

git push origin feature/user-profiles

# Feature 2: Add search functionality  
git checkout main
git checkout -b feature/search-functionality

# Make changes (potentially conflicting)
echo "// Search functionality" > src/search.js
# Modify same file as profiles for conflict testing
echo "// Modified for search integration" >> src/index.js
git add .
git commit -m "feat: implement advanced search functionality

- Full-text search across all content
- Filter and sort options
- Search history and suggestions"

git push origin feature/search-functionality
```

### Step 4.2: Create Competing Pull Requests

```bash
# Create PR for profiles
gh pr create \
  --title "feat: user profile management system" \
  --body "## 🧑‍💼 User Profiles Feature

### New Functionality
- User profile CRUD operations
- Profile validation and sanitization
- Avatar upload with image processing
- Privacy settings management

### Testing
- Unit tests for profile operations
- Integration tests for API endpoints
- UI tests for profile forms

### Database Changes
- New `profiles` table
- User profile relationships
- Migration scripts included" \
  --base dev \
  --head feature/user-profiles

# Create PR for search
gh pr create \
  --title "feat: advanced search functionality" \
  --body "## 🔍 Search Feature

### New Functionality
- Full-text search engine integration
- Advanced filtering and sorting
- Search suggestions and autocomplete
- Search analytics and reporting

### Technical Details
- Elasticsearch integration
- Search indexing jobs
- Query optimization
- Caching strategy

### Performance Impact
- Search response time: <200ms
- Index build time: ~5 minutes
- Memory usage: +50MB" \
  --base dev \
  --head feature/search-functionality
```

### Step 4.3: Test Parallel Workflow Execution

Both PRs should trigger feature validation workflows simultaneously:

```bash
# Monitor both workflows
gh run list --limit=10 | grep feature-validation
```

**Expected Results**:
- ✅ Both feature validation workflows run in parallel
- ✅ Each PR gets independent status checks
- ✅ No interference between workflows

### Step 4.4: Merge First Feature

```bash
# Merge profiles first
gh pr merge $(gh pr list --head feature/user-profiles --json number --jq '.[0].number') --merge
```

**Expected Results**:
- ✅ Profiles feature merges cleanly
- ✅ Dev integration workflow runs
- ✅ Dev branch updated

### Step 4.5: Handle Merge Conflicts

The search feature PR may now have conflicts:

```bash
# Check PR status
gh pr view feature/search-functionality

# Update search branch to resolve conflicts
git checkout feature/search-functionality
git pull origin dev  # This may cause conflicts

# Resolve conflicts manually, then:
git add .
git commit -m "fix: resolve merge conflicts with user profiles feature"
git push origin feature/search-functionality
```

**Expected Results**:
- ⚠️ Merge conflicts detected
- ✅ Conflicts resolved manually
- ✅ Updated PR triggers new validation

### Step 4.6: Complete Integration

```bash
# Merge updated search feature
gh pr merge $(gh pr list --head feature/search-functionality --json number --jq '.[0].number') --merge
```

**Expected Results**:
- ✅ Both features integrated successfully
- ✅ Dev branch contains all changes
- ✅ Ready for next release

---

## Scenario 5: Failed Workflow Recovery

> **Purpose**: Test error handling and recovery procedures  
> **Flow**: Intentional failures → troubleshooting → recovery  
> **Duration**: ~10 minutes  

### Step 5.1: Create Failing Feature

```bash
# Create a branch with intentional issues
git checkout main
git checkout -b feature/broken-feature

# Add code that will fail tests
echo "
// This will cause test failures
function brokenFunction() {
  throw new Error('Intentional test failure');
}

// This will cause linting errors
var unused_variable = 'unused';
let another-invalid-name = 'invalid';

module.exports = { brokenFunction };
" > src/broken-feature.js

# Add invalid test
echo "
const { brokenFunction } = require('../src/broken-feature');

describe('Broken Feature', () => {
  it('should fail intentionally', () => {
    // This test will fail
    expect(brokenFunction()).toBe('success');
  });
});
" > test/broken-feature.test.js

# Make commit that violates conventions
git add .
git commit -m "add broken stuff"  # Invalid commit message format

git push origin feature/broken-feature
```

### Step 5.2: Create PR to Trigger Failures

```bash
gh pr create \
  --title "feat: broken feature for testing" \
  --body "This PR intentionally contains errors to test workflow error handling." \
  --base dev \
  --head feature/broken-feature
```

### Step 5.3: Monitor Failing Workflow

```bash
gh run list --workflow=feature-validation.yml --limit=1
gh run view --web  # View failure details
```

**Expected Failures**:
- ❌ **Lint Check**: ESLint errors due to invalid variable names
- ❌ **Test Suite**: Test failure due to assertion error
- ❌ **Commit Message**: Invalid conventional commit format
- ❌ **Coverage**: Possibly insufficient coverage

### Step 5.4: Fix Issues One by One

```bash
# Fix linting issues
echo "
// Fixed version
function workingFunction() {
  return 'success';
}

const validVariable = 'used in export';
const anotherValidName = 'also valid';

module.exports = { workingFunction, validVariable, anotherValidName };
" > src/broken-feature.js

# Fix test
echo "
const { workingFunction } = require('../src/broken-feature');

describe('Working Feature', () => {
  it('should work correctly', () => {
    expect(workingFunction()).toBe('success');
  });
});
" > test/broken-feature.test.js

git add .
git commit -m "fix: resolve linting and test issues

- Fix variable naming conventions
- Update function to return expected value
- Fix test assertions
- Ensure proper error handling"

git push origin feature/broken-feature
```

**Expected Results**:
- ✅ New commit triggers fresh workflow run
- ✅ Lint and test issues resolved
- ✅ Commit message follows conventions
- ⚠️ Some checks may still need attention

### Step 5.5: Complete Recovery

```bash
# Check workflow status
gh run list --workflow=feature-validation.yml --limit=2

# Once all checks pass, merge
gh pr merge --merge --delete-branch
```

**Expected Results**:
- ✅ All workflow checks pass
- ✅ PR successfully merged
- ✅ Error recovery process validated

---

## Expected Outcomes Reference

### Feature Validation Workflow Results

| Check | Expected Outcome | Typical Duration |
|-------|-----------------|------------------|
| Lint & Code Quality | ✅ Pass | 2-3 minutes |
| Build & Test | ✅ Pass | 3-5 minutes |
| Commit Messages | ✅ Pass | 1 minute |
| Security Scan | ✅ Pass | 2-3 minutes |
| Overall Status | ✅ Success | 8-12 minutes |

### Dev Integration Workflow Results

| Check | Expected Outcome | Typical Duration |
|-------|-----------------|------------------|
| Integration Tests | ✅ Pass | 3-4 minutes |
| Pre-release Validation | ✅ Pass | 2-3 minutes |
| Quality Check | ✅ Pass | 2 minutes |
| Dev Status | ✅ Success | 7-9 minutes |

### Release Preparation Results

| Step | Expected Outcome | Duration |
|------|-----------------|----------|
| Source Validation | ✅ Pass | 1-2 minutes |
| Version Calculation | ✅ Calculated | 1 minute |
| Branch Creation | ✅ Created | 30 seconds |
| QA Issue Creation | ✅ Created | 30 seconds |
| Overall | ✅ Success | 3-4 minutes |

### Semantic Release Results

| Step | Expected Outcome | Duration |
|------|-----------------|----------|
| Pre-validation | ✅ Pass | 3-5 minutes |
| Version Generation | ✅ New version | 1 minute |
| Changelog Creation | ✅ Generated | 1 minute |
| GitHub Release | ✅ Published | 1 minute |
| Branch Sync | ✅ Synced | 1 minute |
| Overall | ✅ Success | 7-9 minutes |

### Hotfix Workflow Results

| Step | Expected Outcome | Duration |
|------|-----------------|----------|
| Expedited Validation | ✅ Pass | 2-3 minutes |
| Impact Analysis | ✅ Analyzed | 1 minute |
| Emergency Deployment | ✅ Ready | 1 minute |
| Branch Sync | ✅ Synced | 1 minute |
| Overall | ✅ Success | 5-6 minutes |

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Feature Validation Workflow Fails

**Symptoms**:
- ❌ Lint errors
- ❌ Test failures  
- ❌ Commit message validation fails

**Solutions**:
```bash
# Fix linting issues
npm run lint:fix

# Fix formatting issues
npm run format

# Run tests locally
npm run test:coverage

# Check commit message format
git log --oneline -1
# Should follow: type(scope): description
```

#### 2. Coverage Below Threshold

**Symptoms**:
- ❌ "Jest: global coverage threshold not met"

**Solutions**:
```bash
# Check current coverage
npm run test:coverage

# Add missing tests
# Coverage requirement: 80%
# Focus on uncovered lines shown in report
```

#### 3. Merge Conflicts in Dev

**Symptoms**:
- ⚠️ Merge conflicts when multiple features integrate

**Solutions**:
```bash
# Update feature branch with latest dev
git checkout feature/your-feature
git pull origin dev

# Resolve conflicts manually
# Edit conflicted files, then:
git add .
git commit -m "resolve: merge conflicts with dev branch"
git push origin feature/your-feature
```

#### 4. Release Branch Issues

**Symptoms**:
- ❌ Release preparation fails
- ❌ No releasable commits found

**Solutions**:
```bash
# Check commit history
git log --grep="feat:" --grep="fix:" --oneline

# Ensure conventional commits exist since last release
# At least one feat: or fix: commit required
```

#### 5. Hotfix Workflow Not Triggering

**Symptoms**:
- Hotfix workflow doesn't start on branch push

**Solutions**:
```bash
# Verify branch name pattern
git branch | grep hotfix/
# Must match: hotfix/*

# Check workflow file exists
ls .github/workflows/hotfix.yml

# Verify push to correct repository
git remote -v
```

#### 6. Semantic Release No Version Created

**Symptoms**:
- ❌ "No release needed"
- No version bump occurs

**Solutions**:
```bash
# Check commit messages since last release
git log --pretty=format:"%s" $(git describe --tags --abbrev=0)..HEAD

# Ensure conventional commits exist:
# feat: -> minor version
# fix: -> patch version  
# feat!: or BREAKING CHANGE -> major version
```

### Recovery Procedures

#### Failed PR Recovery

1. **Identify the issue** from workflow logs
2. **Fix locally** on the feature branch
3. **Commit with proper message**
4. **Push to trigger new workflow run**
5. **Monitor until all checks pass**

#### Failed Release Recovery

1. **Check release branch state**
2. **Fix issues directly on release branch**
3. **Test locally before pushing**
4. **Update QA issue with status**
5. **Proceed with main merge when ready**

#### Emergency Rollback

```bash
# If something breaks after merge to main
git checkout main
git revert HEAD --no-edit
git push origin main

# This triggers semantic release with new patch version
# Alternatively, use specific commit hash
git revert abc123 --no-edit
```

---

## Validation Checklist

After completing all scenarios, verify:

### ✅ Branching Strategy Validation
- [ ] Feature branches created from `main`
- [ ] Features merge to `dev` first  
- [ ] Release branches created from `main`
- [ ] Releases merge to `main` after QA
- [ ] Hotfixes can bypass normal flow
- [ ] All branches follow naming conventions

### ✅ Workflow Integration Validation  
- [ ] Feature validation runs on PRs to `dev`
- [ ] Dev integration runs on push to `dev`
- [ ] Release preparation creates proper branches
- [ ] Semantic release handles versioning automatically
- [ ] Hotfix workflow provides expedited path
- [ ] All workflows complete successfully

### ✅ Quality Gates Validation
- [ ] Linting enforced at PR level
- [ ] Test coverage threshold enforced (80%)
- [ ] Commit message validation working
- [ ] Security scanning included
- [ ] No bypassing of quality checks

### ✅ Versioning Validation
- [ ] Conventional commits drive version bumps
- [ ] Semantic versioning follows semver rules
- [ ] Changelogs generated automatically  
- [ ] GitHub releases created properly
- [ ] Tags follow expected format

### ✅ Integration Validation
- [ ] Multiple concurrent PRs handled correctly
- [ ] Merge conflicts detected and resolvable
- [ ] Branch synchronization works (dev ← main)
- [ ] Cleanup of temporary branches occurs
- [ ] Notification and status reporting works

---

## Next Steps

After completing manual testing:

1. **Document Results**: Record any deviations from expected outcomes
2. **Update Workflows**: Fix any issues discovered during testing
3. **Team Training**: Share this guide with team members
4. **Automation**: Consider automating parts of this testing process
5. **Monitoring**: Set up monitoring for workflow success rates
6. **Iteration**: Regularly test the complete flow with real features

---

*This guide ensures your branching strategy and CI/CD workflows function correctly in real-world conditions with actual branches, commits, and deployments.*