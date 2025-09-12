# Test Scenario 4: Multiple Features in Release - CORRECTED COMMANDS

This guide provides the corrected commands with proper PR number handling.

## Step 1: Ensure you're on main branch
```bash
git checkout main
git pull origin main
```

## Step 2: Create three feature branches
```bash
# Feature 1: User Management
git checkout -b feature/user-management
echo "// User Management - $(date)" > src/user-management.js
git add src/user-management.js
git commit -m "feat: add user management system"
git push -u origin feature/user-management

# Feature 2: Analytics Dashboard  
git checkout main
git checkout -b feature/analytics  
echo "// Analytics - $(date)" > src/analytics.js
git add src/analytics.js
git commit -m "feat: implement analytics dashboard"
git push -u origin feature/analytics

# Feature 3: Email Service
git checkout main
git checkout -b feature/email-service
echo "// Email Service - $(date)" > src/email-service.js
git add src/email-service.js
git commit -m "feat: add email notification service"
git push -u origin feature/email-service
```

## Step 3: Create release branch
```bash
git checkout main
RELEASE_DATE=$(date +%d%m%y)
git checkout -b release/${RELEASE_DATE}-multi-feature-release
git push -u origin release/${RELEASE_DATE}-multi-feature-release
```

## Step 4: Create and merge PRs (with PR number capture)

### Feature 1: User Management
```bash
# Create PR and capture the number
PR_OUTPUT=$(gh pr create \
  --base release/${RELEASE_DATE}-multi-feature-release \
  --head feature/user-management \
  --title "feat: add user management system" \
  --body "Add comprehensive user management functionality")
  
# Extract PR number from output (e.g., https://github.com/user/repo/pull/30)
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"

# Merge the PR using its number
gh pr merge $PR_NUM --merge --delete-branch
```

### Feature 2: Analytics Dashboard
```bash
# Create PR and capture the number
PR_OUTPUT=$(gh pr create \
  --base release/${RELEASE_DATE}-multi-feature-release \
  --head feature/analytics \
  --title "feat: implement analytics dashboard" \
  --body "Add analytics and reporting dashboard")
  
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"

# Merge the PR
gh pr merge $PR_NUM --merge --delete-branch
```

### Feature 3: Email Service
```bash
# Create PR and capture the number
PR_OUTPUT=$(gh pr create \
  --base release/${RELEASE_DATE}-multi-feature-release \
  --head feature/email-service \
  --title "feat: add email notification service" \
  --body "Implement email notification system")
  
PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created PR #$PR_NUM"

# Merge the PR
gh pr merge $PR_NUM --merge --delete-branch
```

## Step 5: Wait for pre-release workflow
```bash
# Check workflow status
gh run list --workflow=release-preparation.yml --limit 1

# View the latest run
gh run view

# Check the pre-release changelog
git pull origin release/${RELEASE_DATE}-multi-feature-release
cat CHANGELOG.md | head -50
```

## Step 6: Create and merge release PR to main
```bash
# Create release PR
PR_OUTPUT=$(gh pr create \
  --base main \
  --head release/${RELEASE_DATE}-multi-feature-release \
  --title "Release: Multi-feature release ${RELEASE_DATE}" \
  --body "## Features
- User management system
- Analytics dashboard  
- Email notification service

## Pre-release Testing
✅ All features tested in QA
✅ Pre-release version created successfully")

PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Created Release PR #$PR_NUM"

# Merge to main
gh pr merge $PR_NUM --merge --delete-branch
```

## Step 7: Verify production release
```bash
# Check semantic-release workflow
gh run list --workflow=semantic-release.yml --limit 1

# Pull latest changes
git checkout main
git pull origin main

# Check version and changelog
cat package.json | grep version
cat CHANGELOG.md | head -100
```

## Alternative: All-in-One Script

Save this as `test-multi-feature.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Multi-Feature Release Test"

# Step 1: Setup
git checkout main
git pull origin main

# Step 2: Create features
echo "📝 Creating feature branches..."
for feature in "user-management" "analytics" "email-service"; do
    git checkout main
    git checkout -b feature/$feature
    echo "// $feature - $(date)" > src/$feature.js
    git add src/$feature.js
    git commit -m "feat: add $feature functionality"
    git push -u origin feature/$feature
done

# Step 3: Create release branch
RELEASE_DATE=$(date +%d%m%y)
echo "🔧 Creating release branch..."
git checkout main
git checkout -b release/${RELEASE_DATE}-multi-feature
git push -u origin release/${RELEASE_DATE}-multi-feature

# Step 4: Create and merge PRs
echo "🔀 Creating and merging feature PRs..."
for feature in "user-management" "analytics" "email-service"; do
    PR_OUTPUT=$(gh pr create \
        --base release/${RELEASE_DATE}-multi-feature \
        --head feature/$feature \
        --title "feat: add $feature" \
        --body "Add $feature functionality")
    
    PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
    echo "Merging PR #$PR_NUM for $feature"
    gh pr merge $PR_NUM --merge --delete-branch
    sleep 5  # Wait between merges
done

# Step 5: Wait for pre-release
echo "⏳ Waiting for pre-release workflow..."
sleep 30
git pull origin release/${RELEASE_DATE}-multi-feature

# Step 6: Merge to main
echo "🎯 Creating release PR to main..."
PR_OUTPUT=$(gh pr create \
    --base main \
    --head release/${RELEASE_DATE}-multi-feature \
    --title "Release: Multi-feature ${RELEASE_DATE}" \
    --body "Multi-feature release with 3 new features")

PR_NUM=$(echo $PR_OUTPUT | grep -oE '[0-9]+$')
echo "Merging Release PR #$PR_NUM"
gh pr merge $PR_NUM --merge --delete-branch

echo "✅ Multi-feature release test complete!"
```

Make it executable and run:
```bash
chmod +x test-multi-feature.sh
./test-multi-feature.sh
```

## Troubleshooting

### If PRs fail to create:
- Check if branches exist: `git branch -r | grep feature/`
- Ensure you're authenticated: `gh auth status`
- Verify base branch exists: `git ls-remote origin release/${RELEASE_DATE}-multi-feature`

### If merge fails:
- Check PR status: `gh pr view [PR_NUMBER]`
- View PR checks: `gh pr checks [PR_NUMBER]`
- Manually merge if needed: `gh pr merge [PR_NUMBER] --admin --merge`

### If no PR number in output:
Sometimes gh returns the URL immediately. You can also get the PR number with:
```bash
# After creating PR, list recent PRs
gh pr list --limit 1 --json number --jq '.[0].number'
```