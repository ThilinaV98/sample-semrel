#!/bin/bash

# Fixed ZSH Commands for Manual Testing
# These commands work properly in both bash and zsh

echo "Copy and paste these commands one by one:"
echo "========================================="
echo

# Variables
echo "# 1. Set up variables"
echo 'TIMESTAMP=$(date +%Y%m%d%H%M)'
echo 'RELEASE_DATE=$(date +%d%m%y)'
echo 'RELEASE_DESC="api-v2"'
echo

# Feature branch
echo "# 2. Create feature branch"
echo 'git checkout main && git pull origin main'
echo 'git checkout -b feature/api-v2-$TIMESTAMP'
echo

# Create file and commit
echo "# 3. Create breaking change (copy all lines together)"
echo "cat > api-v2-changes.js << 'ENDFILE'"
echo "// API v2 Breaking Changes"
echo "module.exports = {"
echo '  version: "2.0.0",'
echo "  breaking: true,"
echo "  changes: ["
echo '    "New authentication required",'
echo '    "Response format changed",'
echo '    "API v1 endpoints deprecated"'
echo "  ]"
echo "};"
echo "ENDFILE"
echo

# Git operations
echo "# 4. Commit and push feature"
echo 'git add api-v2-changes.js'
echo 'git commit -m "feat: implement API v2 with breaking changes"'
echo 'git push -u origin feature/api-v2-$TIMESTAMP'
echo

# Release branch
echo "# 5. Create release branch"
echo 'git checkout main'
echo 'git checkout -b release/$RELEASE_DATE-$RELEASE_DESC'
echo 'git push -u origin release/$RELEASE_DATE-$RELEASE_DESC'
echo

# PR creation (fixed)
echo "# 6. Create PR from feature to release (FIXED VERSION)"
echo 'PR_URL=$(gh pr create \'
echo '  --base release/$RELEASE_DATE-$RELEASE_DESC \'
echo '  --head feature/api-v2-$TIMESTAMP \'
echo '  --title "feat: API v2 implementation" \'
echo '  --body "Breaking changes: API v2 implementation")'
echo 'PR_NUM=$(echo "$PR_URL" | grep -oE "[0-9]+$")'
echo 'echo "Created PR #$PR_NUM"'
echo

# Merge PR
echo "# 7. Merge PR"
echo 'gh pr merge $PR_NUM --merge --delete-branch'
echo

# Main PR
echo "# 8. Create PR to main"
echo 'git checkout release/$RELEASE_DATE-$RELEASE_DESC'
echo 'git pull origin release/$RELEASE_DATE-$RELEASE_DESC'
echo 'MAIN_PR_URL=$(gh pr create \'
echo '  --base main \'
echo '  --head release/$RELEASE_DATE-$RELEASE_DESC \'
echo '  --title "Release: API v2.0.0" \'
echo '  --body "Breaking changes release")'
echo 'MAIN_PR_NUM=$(echo "$MAIN_PR_URL" | grep -oE "[0-9]+$")'
echo 'echo "Created main PR #$MAIN_PR_NUM"'
echo

# Final merge
echo "# 9. Merge to main"
echo 'gh pr merge $MAIN_PR_NUM --merge --delete-branch'