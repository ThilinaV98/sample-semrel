# Codecov Setup Guide

## Current Status ✅

The GitHub Actions workflows have been fixed to handle Codecov service issues gracefully:

- **Coverage Upload**: Now non-blocking with `fail_ci_if_error: false` and `continue-on-error: true`
- **Fallback Coverage**: Local coverage summary generated in GitHub Actions Summary
- **Updated Action**: Using `codecov/codecov-action@v4` (latest version)
- **Token Ready**: Configured to use `CODECOV_TOKEN` when available

## Quick Fix Applied ✅

The workflows will now continue successfully even if Codecov is unavailable, while still attempting to upload coverage when possible.

## Full Codecov Integration (Optional)

To enable full Codecov integration with proper authentication:

### Step 1: Get Codecov Token

1. Go to [codecov.io](https://codecov.io)
2. Sign in with your GitHub account  
3. Add your repository: `ThilinaV98/sample-semrel`
4. Copy the repository upload token from the settings

### Step 2: Add GitHub Secret

1. Go to your GitHub repository: `https://github.com/ThilinaV98/sample-semrel`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CODECOV_TOKEN`
5. Value: Paste your Codecov upload token
6. Click **Add secret**

### Step 3: Verify Setup

Once the token is added:
- Push a new commit to trigger the workflow
- The coverage upload should succeed without rate limiting
- Coverage reports will appear on codecov.io
- PR comments will include coverage diffs

## Coverage Reports Available

Even without Codecov token, you still get:

### 1. Local Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html` (generated locally)
- **LCOV Report**: `coverage/lcov.info` (machine-readable)
- **JSON Summary**: `coverage/coverage-summary.json`

### 2. GitHub Actions Summary
- Coverage percentage table automatically generated
- Shows Lines, Functions, Branches, Statements coverage
- ✅/❌ status indicators for 80% threshold
- Available in the **Summary** tab of each workflow run

### 3. Console Output
- Coverage percentage displayed during `npm test` runs
- Detailed coverage information in test logs

## Current Coverage Status

Your project currently achieves:
- **84.28% Branch Coverage** 
- **Above 80% threshold** ✅
- **All tests passing** (128/128)

## Benefits of Full Codecov Integration

When properly configured with a token:

- **PR Comments**: Automatic coverage reports on pull requests
- **Coverage Trends**: Track coverage changes over time  
- **Coverage Badges**: Display coverage status in README
- **Team Dashboard**: Centralized coverage monitoring
- **Coverage Goals**: Set and track coverage targets
- **Blame View**: See which lines lack test coverage

## Troubleshooting

### Rate Limiting Issues
- **Cause**: No authentication token provided
- **Solution**: Add `CODECOV_TOKEN` secret as described above
- **Temporary**: Workflows now continue without failing

### Upload Failures  
- **Network Issues**: `continue-on-error: true` prevents CI failure
- **Token Issues**: Check secret name matches exactly `CODECOV_TOKEN`
- **Permission Issues**: Ensure token has upload permissions

### Alternative Coverage Tools

If you prefer not to use Codecov:

1. **GitHub's Built-in Coverage**: Use test summary artifacts
2. **Coveralls**: Alternative coverage service
3. **Local Only**: Remove external upload, keep local reports
4. **Custom Solution**: Generate coverage badges with GitHub Actions

## Test Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html

# View coverage summary
cat coverage/coverage-summary.json | jq '.total'
```

---

*The workflows are now resilient and will work with or without Codecov integration.*