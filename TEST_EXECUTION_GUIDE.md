# 🧪 Test Execution Guide - Quick Start

## 🚀 Quick Test Commands

### Run All Tests (Recommended)
```bash
# Complete test suite (includes live GitHub workflows)
./test-scripts/run-all-tests.sh

# Skip workflow tests (faster, no GitHub API calls required)
./test-scripts/run-all-tests.sh --skip-workflows

# Clean up all test artifacts
./test-scripts/run-all-tests.sh --cleanup
```

### Run Individual Test Suites
```bash
# Test utility JavaScript scripts only (2-3 minutes)
./test-scripts/test-utility-scripts.sh

# Test custom GitHub Actions only (3-5 minutes)
./test-scripts/test-custom-actions.sh

# Test GitHub workflows with live repository (15-20 minutes)
./test-scripts/automated-workflow-test.sh
```

---

## 📋 Prerequisites Checklist

Before running tests, ensure you have:

- [ ] **Node.js** (v18+): `node --version`
- [ ] **npm**: `npm --version`
- [ ] **GitHub CLI**: `gh --version` and `gh auth status`
- [ ] **jq**: `jq --version`
- [ ] **Git repository**: Clean working directory
- [ ] **Repository permissions**: Admin/Write access for workflow tests

### Quick Setup
```bash
# Install prerequisites (macOS with Homebrew)
brew install node gh jq

# Authenticate GitHub CLI
gh auth login

# Verify setup
./test-scripts/run-all-tests.sh --help
```

---

## 🎯 Test Categories

### 1. ⚡ **Utility Scripts** (Fast - 2-3 min)
Tests core JavaScript utilities used by workflows:
- `update-release-json.js` - Release tracking logic
- `bump-version.js` - Semantic versioning calculations
- `generate-changelog.js` - Changelog generation

**Command**: `./test-scripts/test-utility-scripts.sh`

### 2. 🎭 **Custom Actions** (Medium - 3-5 min)
Tests reusable GitHub Actions:
- `version-bump` action - Version calculation logic
- `changelog-gen` action - Markdown generation
- `docker-mock` action - Docker operation simulation

**Command**: `./test-scripts/test-custom-actions.sh`

### 3. 🔄 **GitHub Workflows** (Slow - 15-20 min)
End-to-end workflow testing with live repository:
- Release branch initialization
- PR validation and merging
- Production release promotion
- Hotfix deployment
- Development integration

**Command**: `./test-scripts/automated-workflow-test.sh`

---

## 📊 Understanding Test Results

### ✅ **Success Indicators**
- All test scripts exit with code 0
- Console shows green ✅ checkmarks
- Test report shows "ALL TESTS PASSED"
- No workflow failures in GitHub Actions tab

### ❌ **Failure Indicators**
- Scripts exit with non-zero code
- Console shows red ❌ errors
- Test report shows specific failure details
- GitHub Actions show workflow failures

### 📄 **Test Reports**
Reports are automatically generated in `test-reports/`:
- `latest-test-summary.md` - Latest results
- `test-report-YYYYMMDD-HHMMSS.md` - Detailed report with timestamps

---

## 🔧 Troubleshooting Common Issues

### **"GitHub CLI not authenticated"**
```bash
gh auth login
# Follow the prompts to authenticate
```

### **"semver command not found"**
```bash
npm install -g semver@7.5.4
```

### **"Permission denied" errors**
```bash
chmod +x test-scripts/*.sh
```

### **Workflow tests timeout**
- Check internet connectivity
- Verify GitHub repository permissions
- Try `--skip-workflows` flag for offline testing

### **Test branches not cleaned up**
```bash
./test-scripts/automated-workflow-test.sh --cleanup
```

---

## 📈 Advanced Usage

### Custom Test Configuration
```bash
# Set custom timeout for workflow tests
WORKFLOW_TIMEOUT=300 ./test-scripts/automated-workflow-test.sh

# Run tests with verbose output
DEBUG=1 ./test-scripts/run-all-tests.sh

# Test specific workflow only
# (Edit the automated-workflow-test.sh script to comment out unwanted tests)
```

### Continuous Integration
```bash
# CI-friendly command (no interactive prompts)
./test-scripts/run-all-tests.sh --skip-workflows 2>&1 | tee test-output.log
```

### Test Development
```bash
# Create new test scenario
cp test-scripts/test-utility-scripts.sh test-scripts/test-new-feature.sh
# Edit the new file for your specific tests
```

---

## 📝 Test Coverage

### **What IS Tested** ✅
- JavaScript utility logic and error handling
- Custom GitHub Actions input/output behavior
- Workflow trigger conditions and sequences
- Version calculation accuracy
- Changelog generation formatting
- Docker operation simulations
- PR validation rules
- Branch naming conventions

### **What is NOT Tested** ❌
- Actual Docker builds/pushes
- Real deployment to environments
- External service integrations
- Performance under high load
- Security vulnerability scanning
- Cross-platform compatibility

---

## 🔄 Regular Maintenance

### Weekly Testing
```bash
# Quick health check
./test-scripts/run-all-tests.sh --skip-workflows

# Full integration test (monthly)
./test-scripts/run-all-tests.sh
```

### Before Major Releases
```bash
# Complete test suite with cleanup
./test-scripts/run-all-tests.sh --cleanup
./test-scripts/run-all-tests.sh
```

### Test Report Analysis
- Monitor test duration trends
- Review failure patterns
- Update test scenarios for new features
- Archive old reports periodically

---

## 🎉 Next Steps After Testing

### If All Tests Pass ✅
1. Your GitHub Actions setup is production-ready
2. Consider adding these tests to your CI/CD pipeline
3. Monitor workflow performance in production
4. Set up alerts for workflow failures

### If Tests Fail ❌
1. Review the detailed error output
2. Check the specific failing component
3. Verify prerequisites are correctly installed
4. Test individual components in isolation
5. Consult the troubleshooting section above

---

**💡 Pro Tip**: Start with `--skip-workflows` for quick validation, then run the full suite when you need complete confidence in your GitHub Actions setup.