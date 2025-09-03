# Branch Protection Configuration

This document provides step-by-step instructions for configuring branch protection rules to support the semantic versioning and branching strategy implemented in this repository.

## Overview

Branch protection rules ensure code quality and enforce the proper workflow for our semantic versioning strategy:

- **main** - Production branch with strict protection
- **dev** - Development integration branch with moderate protection  
- **feature/*** - Feature branches (no direct protection needed)
- **release/*** - Release branches with QA-focused protection

## Required Protections by Branch

### Main Branch Protection (`main`)

**Purpose**: Ensure only thoroughly tested, reviewed code reaches production

**GitHub Settings Path**: `Settings → Branches → Add rule` (Branch name pattern: `main`)

#### Required Status Checks
✅ **Enable**: "Require status checks to pass before merging"
- ✅ `semantic-release` (from semantic-release.yml workflow)  
- ✅ `pre-release-validation` (from semantic-release.yml workflow)
- ✅ `build-test` (from feature-validation.yml if triggered)

#### Pull Request Requirements
✅ **Enable**: "Require pull request reviews before merging"
- **Required approving reviews**: `1` (minimum)
- ✅ **Enable**: "Dismiss stale PR approvals when new commits are pushed"
- ✅ **Enable**: "Require review from code owners" (if CODEOWNERS file exists)

#### Additional Restrictions
✅ **Enable**: "Require branches to be up to date before merging"
✅ **Enable**: "Require signed commits" (optional but recommended)
✅ **Enable**: "Restrict pushes that create files matching a path"
- Pattern: `**/*.env*,**/secrets/**` (prevent accidental secrets)

#### Administrative Settings
✅ **Enable**: "Restrict pushes to matching branches"
- **Allowed to push**: Administrators only
✅ **Enable**: "Allow force pushes" → **Specify who can force push**
- Only administrators (for emergency hotfixes)
✅ **Disable**: "Allow deletions" (prevent accidental branch deletion)

### Dev Branch Protection (`dev`)

**Purpose**: Integration testing while maintaining development velocity

**GitHub Settings Path**: `Settings → Branches → Add rule` (Branch name pattern: `dev`)

#### Required Status Checks
✅ **Enable**: "Require status checks to pass before merging"
- ✅ `feature-status` (from feature-validation.yml workflow)
- ✅ `lint` (from feature-validation.yml workflow)
- ✅ `build-test` (from feature-validation.yml workflow)
- ✅ `commitlint` (from feature-validation.yml workflow)

#### Pull Request Requirements
✅ **Enable**: "Require pull request reviews before merging"
- **Required approving reviews**: `1`
- ✅ **Enable**: "Dismiss stale PR approvals when new commits are pushed"

#### Additional Restrictions
✅ **Enable**: "Require branches to be up to date before merging"
- ⚠️ **Note**: This may slow development if many concurrent features

#### Administrative Settings
✅ **Disable**: "Restrict pushes to matching branches" (allow direct pushes for development)
✅ **Disable**: "Allow force pushes" (maintain git history integrity)
✅ **Disable**: "Allow deletions"

### Release Branch Protection (`release/*`)

**Purpose**: Protect QA testing branches and ensure controlled releases

**GitHub Settings Path**: `Settings → Branches → Add rule` (Branch name pattern: `release/*`)

#### Required Status Checks
✅ **Enable**: "Require status checks to pass before merging"
- ✅ All checks from dev branch protection
- ✅ Manual QA approval (via required reviews)

#### Pull Request Requirements
✅ **Enable**: "Require pull request reviews before merging"
- **Required approving reviews**: `1`
- ✅ **Enable**: "Require review from code owners" (QA team members)

#### Additional Restrictions
✅ **Enable**: "Require branches to be up to date before merging"

#### Administrative Settings
✅ **Enable**: "Restrict pushes to matching branches"
- **Allowed to push**: QA team, Administrators
✅ **Disable**: "Allow force pushes" (maintain release integrity)
✅ **Disable**: "Allow deletions"

## Step-by-Step Setup Guide

### 1. Access Branch Protection Settings

1. Navigate to your repository on GitHub
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** button

### 2. Configure Main Branch Protection

1. **Branch name pattern**: `main`
2. **Protect matching branches** section:
   
   **Restrict pushes that create files matching a path**:
   - Click **Add a path**
   - Enter: `**/*.env*`
   - Click **Add a path** again  
   - Enter: `**/secrets/**`
   
   **Require pull request reviews before merging**:
   - ✅ Check "Require pull request reviews before merging"
   - Set "Required number of reviews before merging": `1`
   - ✅ Check "Dismiss stale PR approvals when new commits are pushed"
   
   **Require status checks to pass before merging**:
   - ✅ Check "Require status checks to pass before merging"
   - ✅ Check "Require branches to be up to date before merging"
   - In the search box, type and add:
     - `semantic-release`
     - `pre-release-validation`
   
   **Restrict pushes to matching branches**:
   - ✅ Check "Restrict pushes to matching branches"
   - Leave "Restrict pushes that create files matching a path" unchecked
   
   **Restrictions**:
   - ✅ Check "Restrict pushes to matching branches"
   - ✅ Check "Restrict who can dismiss pull request reviews"

3. Click **Create** button

### 3. Configure Dev Branch Protection

1. Click **Add rule** button again
2. **Branch name pattern**: `dev`
3. Configure as specified in "Dev Branch Protection" section above
4. Click **Create** button

### 4. Configure Release Branch Protection

1. Click **Add rule** button again  
2. **Branch name pattern**: `release/*`
3. Configure as specified in "Release Branch Protection" section above
4. Click **Create** button

## Status Check Configuration

### GitHub Actions Integration

The branch protection rules depend on status checks from GitHub Actions workflows. Ensure these workflows are properly configured:

#### Feature Validation Workflow
File: `.github/workflows/feature-validation.yml`
- Provides: `lint`, `build-test`, `commitlint`, `feature-status` checks
- Triggers: PRs from `feature/*` to `dev`

#### Dev Integration Workflow  
File: `.github/workflows/dev-integration.yml`
- Provides: `integration`, `pre-release-validation`, `quality-check` checks
- Triggers: Pushes to `dev` branch

#### Semantic Release Workflow
File: `.github/workflows/semantic-release.yml`
- Provides: `semantic-release`, `pre-release-validation` checks
- Triggers: Pushes to `main`, PRs to `main`

### Required Contexts

For branch protection to work correctly, these status check contexts must be available:

**Main Branch**:
- `semantic-release` 
- `pre-release-validation`

**Dev Branch**:
- `feature-status`
- `lint` 
- `build-test`
- `commitlint`

**Release Branches**:
- All dev branch checks plus manual QA approval

## Troubleshooting Branch Protection

### Common Issues

**Issue**: Status checks not appearing in branch protection settings
- **Cause**: Workflows haven't run yet or are misconfigured
- **Solution**: 
  1. Make a test PR to trigger workflows
  2. Check workflow files for correct job names
  3. Verify workflow trigger conditions

**Issue**: Can't merge despite passing checks
- **Cause**: Branch not up to date
- **Solution**: 
  1. Sync branch with target: `git pull origin main`
  2. Push updates: `git push`
  3. Wait for status checks to pass again

**Issue**: Administrators can't push to protected branches
- **Cause**: "Restrict pushes" enabled without admin exceptions
- **Solution**: 
  1. Go to branch protection settings
  2. Under "Restrict pushes to matching branches"
  3. Add administrators to allowed list

**Issue**: Old commits bypass protection rules
- **Cause**: Protection rules only apply to new pushes
- **Solution**: Protection is working correctly - existing commits are grandfathered

### Emergency Procedures

**Hotfix to Main Branch**:
1. Administrator creates `release/hotfix-vX.X.X` branch from `main`
2. Make critical fix and push to hotfix branch
3. Create PR from hotfix branch to `main`
4. Semantic release workflow will handle versioning

**Bypass Protection (Emergency Only)**:
1. Go to **Settings → Branches**
2. Click **Edit** on the branch rule
3. Temporarily uncheck required settings
4. Make emergency change
5. **IMMEDIATELY** re-enable protection rules

## CODEOWNERS Integration

Create a `.github/CODEOWNERS` file to specify required reviewers:

```
# Global owners
* @team-leads

# Main branch specific
main @senior-developers @team-leads

# Release branches  
release/* @qa-team @release-managers

# Critical files
package.json @architects
.github/ @devops-team
src/security/ @security-team
```

## Monitoring and Compliance

### Branch Protection Metrics

Track these metrics to ensure policy compliance:

1. **Merge Success Rate**: Percentage of PRs that merge on first attempt
2. **Review Time**: Average time from PR creation to approval
3. **Bypass Frequency**: How often protection rules are bypassed
4. **Failed Status Checks**: Most common check failures

### GitHub API Monitoring

Use GitHub API to programmatically verify branch protection:

```bash
# Check main branch protection
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/branches/main/protection"

# List all protected branches
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/branches?protected=true"
```

### Compliance Checklist

Weekly review:
- [ ] All required branches have protection enabled
- [ ] Status check requirements match current workflows  
- [ ] Required reviewers are active team members
- [ ] No unauthorized bypass exceptions
- [ ] Emergency access procedures documented

## Integration with Semantic Versioning

The branch protection strategy directly supports semantic versioning:

1. **Feature Development**: Protection on `dev` ensures quality integration
2. **Release Preparation**: Protection on `release/*` ensures QA validation  
3. **Production Release**: Protection on `main` ensures semantic release runs properly
4. **Hotfixes**: Emergency procedures maintain version integrity

This protection strategy ensures that:
- All code is reviewed before integration
- Conventional commits are enforced for proper versioning
- Automated testing passes before releases
- Release notes are accurate and complete
- Version bumps follow semantic versioning rules

---

*This branch protection configuration supports the automated semantic versioning workflow while maintaining code quality and release integrity.*