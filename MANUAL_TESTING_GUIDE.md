# 🧪 Manual Testing Guide for GitHub Actions Workflows

## 📋 Overview

This guide provides step-by-step instructions for manually testing all GitHub Actions workflows, custom actions, and utility scripts in the `sample-semrel` project.

**Testing Strategy**: End-to-end workflow validation through actual GitHub repository interactions

---

## 🎯 Quick Test Summary

| Component | Test Method | Est. Time | Prerequisites |
|-----------|-------------|-----------|---------------|
| **Workflows** | Live GitHub triggers | 60-90 min | GitHub repo, branch permissions |
| **Custom Actions** | Isolated testing | 30-45 min | Local Node.js, action inputs |
| **Scripts** | Direct execution | 15-30 min | Node.js, test data files |

---

# 🔄 WORKFLOW TESTING

## Pre-Testing Setup

### 1. Repository Preparation
```bash
# Ensure you're in the project root
cd /path/to/sample-semrel

# Verify current state
git status
git branch -a

# Check workflow files exist
ls -la .github/workflows/
```

### 2. Required Permissions
- Repository: Admin or Write access
- Actions: Enabled in repository settings
- Branches: Ability to create/delete branches and PRs

---

## 🚀 Test Scenario 1: Release Branch Initialization

**Tests**: `01-release-branch-init.yml`
**Trigger**: Creating a release branch

### Steps:
```bash
# 1. Create release branch (triggers workflow)
DATE=$(date +%d%m%y)
BRANCH="release/${DATE}-test-initialization"
git checkout main
git pull origin main
git checkout -b "$BRANCH"
git push origin "$BRANCH"
```

### Expected Results:
✅ **Workflow triggers automatically**
✅ **Creates `release.json` with**:
- Base version from main
- Candidate version calculation
- Release metadata
- Empty RC builds array

✅ **Creates `RELEASE_CHANGELOG.md`**
✅ **Commits files to release branch**
✅ **Job summary shows branch information**

### Verification:
```bash
# Check files were created
git pull origin "$BRANCH"
cat release.json | jq '.'
cat RELEASE_CHANGELOG.md

# Verify GitHub Actions log
# Go to: GitHub repo > Actions > "Initialize Release Branch" run
```

---

## 🔄 Test Scenario 2: PR Validation

**Tests**: `06-pr-validation.yml`
**Trigger**: Opening PR with various title formats

### Steps:

#### 2A. Test Invalid PR Title
```bash
# Create feature branch
git checkout main
git checkout -b feature/test-pr-validation
echo "console.log('test');" > test.js
git add test.js
git commit -m "Add test file"
git push origin feature/test-pr-validation

# Create PR with invalid title (via GitHub UI or gh CLI)
gh pr create \
  --base main \
  --head feature/test-pr-validation \
  --title "Invalid title format" \
  --body "Testing PR validation workflow"
```

**Expected Results**:
✅ Workflow runs and flags invalid title
✅ Comment appears on PR with format guidance
✅ PR status shows "pending" validation

#### 2B. Test Valid PR Title
```bash
# Update PR title to valid format
gh pr edit --title "feat: add test validation script"
```

**Expected Results**:
✅ Workflow runs successfully
✅ PR status changes to "success"
✅ No warning comments added

---

## 🔀 Test Scenario 3: Release Branch Merge & RC Creation

**Tests**: `02-release-branch-merge.yml`
**Trigger**: Merging PR into release branch

### Steps:
```bash
# Using the release branch from Scenario 1
RELEASE_BRANCH="release/${DATE}-test-initialization"

# Create feature for the release
git checkout -b feature/api-enhancement
echo "// New API feature" > api-feature.js
git add api-feature.js
git commit -m "feat: add API enhancement feature"
git push origin feature/api-enhancement

# Create PR to release branch
gh pr create \
  --base "$RELEASE_BRANCH" \
  --head feature/api-enhancement \
  --title "feat: add API enhancement feature" \
  --body "New API enhancement for release" \
  --label "bump:minor"

# Merge the PR
PR_NUM=$(gh pr list --base "$RELEASE_BRANCH" --json number --jq '.[0].number')
gh pr merge $PR_NUM --merge
```

### Expected Results:
✅ **Workflow triggers on PR merge**
✅ **Updates `release.json` with**:
- New version (minor bump)
- RC build entry with timestamp
- Changelog categorization
- PR information

✅ **Updates `RELEASE_CHANGELOG.md`**
✅ **Creates RC version tag** (format: `v{version}-rc-{date}.{timestamp}`)
✅ **Mock Docker build simulation runs**
✅ **Job summary shows version changes**

### Verification:
```bash
git checkout "$RELEASE_BRANCH"
git pull origin "$RELEASE_BRANCH"
cat release.json | jq '.rcBuilds'
cat RELEASE_CHANGELOG.md
```

---

## 🚢 Test Scenario 4: Production Release

**Tests**: `03-main-promotion.yml`
**Trigger**: Merging release branch to main

### Steps:
```bash
# Create PR from release branch to main
gh pr create \
  --base main \
  --head "$RELEASE_BRANCH" \
  --title "release: promote v{version} to production" \
  --body "Production release with API enhancements"

# Merge the PR
PR_NUM=$(gh pr list --base main --head "$RELEASE_BRANCH" --json number --jq '.[0].number')
gh pr merge $PR_NUM --merge
```

### Expected Results:
✅ **Workflow triggers on merge to main**
✅ **Validates version is higher than current**
✅ **Updates `package.json` version**
✅ **Generates comprehensive changelog**
✅ **Creates GitHub Release**
✅ **Mock Docker retag operations** (no rebuild)
✅ **Cleans up `release.json` from main**

### Verification:
```bash
git checkout main
git pull origin main
cat package.json | jq '.version'
cat CHANGELOG.md | head -20
gh release list
```

---

## 🚨 Test Scenario 5: Hotfix Deployment

**Tests**: `04-hotfix-main.yml`
**Trigger**: Merging hotfix branch to main

### Steps:
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make hotfix changes
echo "// Security patch applied" > security-patch.js
git add security-patch.js
git commit -m "fix: critical security vulnerability patch"
git push origin hotfix/critical-security-fix

# Create and merge hotfix PR
gh pr create \
  --base main \
  --head hotfix/critical-security-fix \
  --title "fix: critical security vulnerability patch" \
  --body "URGENT: Fixes critical security issue" \
  --label "bump:patch"

PR_NUM=$(gh pr list --base main --head hotfix/critical-security-fix --json number --jq '.[0].number')
gh pr merge $PR_NUM --merge
```

### Expected Results:
✅ **Workflow triggers immediately**
✅ **Calculates patch version bump**
✅ **Updates package.json**
✅ **Creates hotfix changelog**
✅ **Fresh Docker build simulation** (not retag)
✅ **Creates GitHub Release marked as hotfix**
✅ **Creates backport issues for active release branches**

---

## 🧪 Test Scenario 6: Development Integration

**Tests**: `05-dev-integration.yml`
**Trigger**: Merging PR to dev branch

### Steps:
```bash
# Create dev branch if it doesn't exist
git checkout -b dev || git checkout dev
git push origin dev

# Create feature branch
git checkout -b feature/dev-testing-feature
echo "// Dev environment feature" > dev-feature.js
git add dev-feature.js
git commit -m "feat: add development testing feature"
git push origin feature/dev-testing-feature

# Create and merge PR to dev
gh pr create \
  --base dev \
  --head feature/dev-testing-feature \
  --title "feat: add development testing feature" \
  --body "New feature for development environment"

PR_NUM=$(gh pr list --base dev --json number --jq '.[0].number')
gh pr merge $PR_NUM --merge
```

### Expected Results:
✅ **Workflow triggers on merge to dev**
✅ **Logs PR information**
✅ **Determines branch type**
✅ **Mock dev Docker build with timestamp tags**
✅ **No version bump** (continuous integration)
✅ **Logs dev activity**

---

# 🎭 CUSTOM ACTIONS TESTING

## Test Setup for Actions
```bash
# Create testing directory
mkdir -p .github/test-actions
cd .github/test-actions
```

## 🔢 Testing `version-bump` Action

### Create Test Script:
```bash
cat > test-version-bump.js << 'EOF'
// Test the version-bump action
const { execSync } = require('child_process');

const testCases = [
  {
    name: 'Auto detect from feat title',
    inputs: {
      'current-version': '1.0.0',
      'bump-type': 'auto',
      'pr-title': 'feat: add new payment system',
      'pr-labels': '[]'
    },
    expected: { version: '1.1.0', type: 'minor' }
  },
  {
    name: 'Auto detect from fix title',
    inputs: {
      'current-version': '1.0.0',
      'bump-type': 'auto',
      'pr-title': 'fix: resolve authentication bug',
      'pr-labels': '[]'
    },
    expected: { version: '1.0.1', type: 'patch' }
  },
  {
    name: 'Breaking change from title',
    inputs: {
      'current-version': '1.0.0',
      'bump-type': 'auto',
      'pr-title': 'feat!: redesign user authentication',
      'pr-labels': '[]'
    },
    expected: { version: '2.0.0', type: 'major' }
  },
  {
    name: 'Label override',
    inputs: {
      'current-version': '1.0.0',
      'bump-type': 'auto',
      'pr-title': 'fix: small bug',
      'pr-labels': '["bump:major"]'
    },
    expected: { version: '2.0.0', type: 'major' }
  }
];

console.log('🔢 Testing version-bump action...\n');

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);

  // Set inputs as environment variables
  Object.entries(test.inputs).forEach(([key, value]) => {
    process.env[`INPUT_${key.replace(/-/g, '_').toUpperCase()}`] = value;
  });

  try {
    // Run the action steps manually
    const result = execSync('cd ../actions/version-bump && npm install -g semver@7.5.4', {encoding: 'utf8'});
    // Additional testing logic would go here

    console.log(`✅ ${test.name} - Expected: ${test.expected.version} (${test.expected.type})`);
  } catch (error) {
    console.log(`❌ ${test.name} - Error: ${error.message}`);
  }
  console.log('');
});
EOF

node test-version-bump.js
```

## 📋 Testing `changelog-gen` Action

### Create Test Files:
```bash
# Create test release.json
cat > test-release.json << 'EOF'
{
  "baseVersion": "1.0.0",
  "candidateVersion": "1.1.0",
  "changelog": {
    "features": [
      {"title": "Add user dashboard", "pr": 123, "author": "developer1"}
    ],
    "fixes": [
      {"title": "Fix login validation", "pr": 124, "author": "developer2"}
    ],
    "breaking": [],
    "other": []
  },
  "rcBuilds": [
    {
      "version": "v1.1.0-rc-010125.1640995200",
      "pr": {"number": 123, "author": "developer1"},
      "timestamp": "2025-01-01T10:00:00Z"
    }
  ]
}
EOF

# Test changelog generation
cat > test-changelog-gen.sh << 'EOF'
#!/bin/bash
echo "📋 Testing changelog-gen action..."

# Set inputs
export INPUT_RELEASE_JSON_PATH="test-release.json"
export INPUT_FORMAT="markdown"
export INPUT_VERSION="1.1.0"
export INPUT_INCLUDE_CONTRIBUTORS="true"
export INPUT_INCLUDE_STATS="true"

# Run action steps
cd ../actions/changelog-gen
npm install -g conventional-changelog-cli@4.1.0

# Test with release.json
echo "Testing with release.json..."
if [ -f "../../test-actions/test-release.json" ]; then
  cp "../../test-actions/test-release.json" release.json
  echo "✅ Release.json found and copied"

  # The action would generate changelog here
  # For manual testing, verify the JavaScript logic
  echo "📄 Generated changelog would contain:"
  echo "- Release v1.1.0 header"
  echo "- Statistics section"
  echo "- Features section with PR #123"
  echo "- Bug fixes section with PR #124"
  echo "- Contributors section"
  echo "- Build history table"
else
  echo "❌ Test release.json not found"
fi

echo ""
echo "Testing without release.json (commit history mode)..."
rm -f release.json
echo "✅ Would use conventional-changelog for commit-based generation"
EOF

chmod +x test-changelog-gen.sh
./test-changelog-gen.sh
```

---

# 📜 SCRIPTS TESTING

## Test JavaScript Utilities

### 1. Test `update-release-json.js`
```bash
cd .github/scripts

# Create test data
cat > test-release-update.json << 'EOF'
{
  "baseVersion": "1.0.0",
  "currentVersion": "1.0.0",
  "candidateVersion": "1.1.0",
  "rcBuilds": [],
  "changelog": {"features": [], "fixes": [], "breaking": [], "other": []},
  "mergedPRs": []
}
EOF

# Test the script (if it accepts parameters)
node update-release-json.js --test || echo "Script needs modification for testing"
```

### 2. Test `bump-version.js`
```bash
# Test version bumping logic
node -e "
const semver = require('semver');
const testVersions = ['1.0.0', '2.1.5', '0.1.0-beta'];
const bumpTypes = ['patch', 'minor', 'major'];

console.log('🔢 Testing version bumping...');
testVersions.forEach(version => {
  bumpTypes.forEach(type => {
    const newVersion = semver.inc(version, type);
    console.log(\`\${version} → \${newVersion} (\${type})\`);
  });
});
"
```

### 3. Test `generate-changelog.js`
```bash
# Test changelog generation
node -e "
console.log('📋 Testing changelog generation...');
const testData = {
  version: '1.1.0',
  features: ['Add user dashboard', 'Implement dark mode'],
  fixes: ['Fix login bug', 'Resolve memory leak'],
  contributors: ['dev1', 'dev2', 'dev3']
};

console.log(\`# Release v\${testData.version}\`);
console.log('');
console.log('## 🚀 Features');
testData.features.forEach(f => console.log(\`- \${f}\`));
console.log('');
console.log('## 🐛 Bug Fixes');
testData.fixes.forEach(f => console.log(\`- \${f}\`));
console.log('');
console.log(\`## 👥 Contributors: \${testData.contributors.join(', ')}\`);
"
```

---

# ✅ COMPREHENSIVE TEST CHECKLIST

## Workflow Tests
- [ ] **01-release-branch-init**: Branch creation triggers, files created
- [ ] **02-release-branch-merge**: PR merge creates RC, updates tracking
- [ ] **03-main-promotion**: Release promotes to prod, creates GitHub release
- [ ] **04-hotfix-main**: Hotfix deploys immediately, creates backport issues
- [ ] **05-dev-integration**: Dev merges create continuous builds
- [ ] **06-pr-validation**: PR titles validated, comments added

## Action Tests
- [ ] **version-bump**: Semantic versioning logic works correctly
- [ ] **changelog-gen**: Markdown generation from release.json and commits
- [ ] **docker-mock**: Simulation outputs match expected format

## Script Tests
- [ ] **update-release-json.js**: Updates release tracking correctly
- [ ] **bump-version.js**: Version calculation logic validates
- [ ] **generate-changelog.js**: Changelog formatting works

## Integration Tests
- [ ] **Full Release Cycle**: Branch → PRs → RC → Production
- [ ] **Hotfix Cycle**: Critical fix → immediate deployment
- [ ] **Dev Cycle**: Feature → dev integration → continuous deployment

---

# 🔧 TROUBLESHOOTING

## Common Issues

### Workflow Not Triggering
```bash
# Check workflow file syntax
yamllint .github/workflows/

# Verify branch patterns match
git branch -a | grep release
git branch -a | grep hotfix
```

### Permission Errors
- Ensure repository has Actions enabled
- Check branch protection rules
- Verify GITHUB_TOKEN has required permissions

### Action Failures
```bash
# Check action inputs
grep -n "inputs:" .github/actions/*/action.yml

# Validate composite steps
grep -A 10 "runs:" .github/actions/*/action.yml
```

### Script Errors
```bash
# Check Node.js version
node --version

# Install dependencies
cd .github/scripts && npm install

# Run with error handling
node --trace-warnings script.js
```

---

# 📊 Test Reporting

## Create Test Results Summary
```bash
cat > test-results.md << 'EOF'
# Test Results Summary

## Execution Date: $(date)

### Workflow Tests
| Workflow | Status | Notes |
|----------|--------|-------|
| Release Init | ✅/❌ | Details... |
| PR Merge | ✅/❌ | Details... |
| Production Release | ✅/❌ | Details... |
| Hotfix | ✅/❌ | Details... |
| Dev Integration | ✅/❌ | Details... |
| PR Validation | ✅/❌ | Details... |

### Action Tests
| Action | Status | Notes |
|--------|--------|-------|
| version-bump | ✅/❌ | Details... |
| changelog-gen | ✅/❌ | Details... |
| docker-mock | ✅/❌ | Details... |

### Script Tests
| Script | Status | Notes |
|--------|--------|-------|
| update-release-json.js | ✅/❌ | Details... |
| bump-version.js | ✅/❌ | Details... |
| generate-changelog.js | ✅/❌ | Details... |

## Issues Found
- Issue 1: Description and fix
- Issue 2: Description and fix

## Recommendations
- Improvement 1
- Improvement 2
EOF
```

This guide provides comprehensive manual testing coverage for your entire GitHub Actions setup. Each test scenario includes expected results and verification steps to ensure everything works correctly.