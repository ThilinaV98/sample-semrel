#!/bin/bash

# Test Scenario 5: Pre-release to Production Workflow
# Complete workflow from feature branch to production release

set -e

echo "================================================"
echo "  Test Scenario 5: Pre-release to Production"
echo "================================================"
echo

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create timestamps and branch names
TIMESTAMP=$(date +%Y%m%d%H%M)
RELEASE_DATE=$(date +%d%m%y)
RELEASE_DESC="api-v2"

echo -e "${BLUE}Step 1: Setting up branches${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Release Date: $RELEASE_DATE"
echo "Release Description: $RELEASE_DESC"
echo

# Step 2: Create and setup feature branch
echo -e "${BLUE}Step 2: Creating feature branch${NC}"
git checkout main
git pull origin main
git checkout -b feature/api-v2-$TIMESTAMP

# Step 3: Create breaking change commit
echo -e "${BLUE}Step 3: Creating breaking change${NC}"
cat > api-v2-changes.js << 'EOF'
// API v2 Breaking Changes
module.exports = {
  version: "2.0.0",
  breaking: true,
  changes: [
    "New authentication required",
    "Response format changed",
    "API v1 endpoints deprecated"
  ]
};
EOF

git add api-v2-changes.js
git commit -m "feat: implement API v2 with breaking changes

BREAKING CHANGE: API v1 endpoints deprecated
- New authentication required
- Response format changed"

git push -u origin feature/api-v2-$TIMESTAMP
echo -e "${GREEN}✅ Feature branch created and pushed${NC}"
echo

# Step 4: Create release branch
echo -e "${BLUE}Step 4: Creating release branch${NC}"
git checkout main
git checkout -b release/$RELEASE_DATE-$RELEASE_DESC
git push -u origin release/$RELEASE_DATE-$RELEASE_DESC
echo -e "${GREEN}✅ Release branch created${NC}"
echo

# Step 5: Create PR from feature to release branch
echo -e "${BLUE}Step 5: Creating PR from feature to release branch${NC}"
PR_URL=$(gh pr create \
  --base release/$RELEASE_DATE-$RELEASE_DESC \
  --head feature/api-v2-$TIMESTAMP \
  --title "feat: API v2 implementation" \
  --body "## Breaking Changes

This PR implements API v2 with breaking changes:
- New authentication required
- Response format changed
- API v1 endpoints deprecated

## Type of Change
- [x] Breaking change
- [x] New feature
- [ ] Bug fix

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete")

# Extract PR number from URL
PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$')
echo -e "${GREEN}✅ Created PR #$PR_NUM${NC}"
echo "PR URL: $PR_URL"
echo

# Step 6: Merge PR into release branch
echo -e "${BLUE}Step 6: Merging PR into release branch${NC}"
read -p "Ready to merge PR #$PR_NUM into release branch? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  gh pr merge $PR_NUM --merge --delete-branch
  echo -e "${GREEN}✅ PR merged into release branch${NC}"
else
  echo -e "${YELLOW}⏸️  Skipped merging PR${NC}"
fi
echo

# Step 7: Wait for pre-release workflow
echo -e "${BLUE}Step 7: Waiting for pre-release workflow${NC}"
echo "The pre-release workflow should now be running..."
echo "Check: https://github.com/ThilinaV98/sample-semrel/actions"
read -p "Press Enter when pre-release workflow is complete..."
echo

# Step 8: Create PR from release to main
echo -e "${BLUE}Step 8: Creating PR from release to main${NC}"
git checkout release/$RELEASE_DATE-$RELEASE_DESC
git pull origin release/$RELEASE_DATE-$RELEASE_DESC

MAIN_PR_URL=$(gh pr create \
  --base main \
  --head release/$RELEASE_DATE-$RELEASE_DESC \
  --title "Release: API v2.0.0" \
  --body "## Release Summary

This release includes API v2 with breaking changes.

### Breaking Changes
- New authentication required
- Response format changed
- API v1 endpoints deprecated

### Pre-release Testing
- [ ] QA testing complete
- [ ] Performance testing complete
- [ ] Security scan complete

### Release Checklist
- [ ] Release notes reviewed
- [ ] Documentation updated
- [ ] Migration guide provided")

MAIN_PR_NUM=$(echo "$MAIN_PR_URL" | grep -oE '[0-9]+$')
echo -e "${GREEN}✅ Created PR #$MAIN_PR_NUM to main${NC}"
echo "PR URL: $MAIN_PR_URL"
echo

# Step 9: Merge to main (triggers production release)
echo -e "${BLUE}Step 9: Merging to main (triggers production release)${NC}"
read -p "Ready to merge PR #$MAIN_PR_NUM into main? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  gh pr merge $MAIN_PR_NUM --merge --delete-branch
  echo -e "${GREEN}✅ PR merged into main - production release triggered${NC}"
else
  echo -e "${YELLOW}⏸️  Skipped merging to main${NC}"
fi
echo

# Step 10: Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Workflow Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Feature Branch: feature/api-v2-$TIMESTAMP"
echo "Release Branch: release/$RELEASE_DATE-$RELEASE_DESC"
echo "Feature PR: #$PR_NUM"
echo "Main PR: #$MAIN_PR_NUM"
echo
echo "Check the GitHub Actions tab for workflow runs:"
echo "https://github.com/ThilinaV98/sample-semrel/actions"