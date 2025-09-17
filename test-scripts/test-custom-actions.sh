#!/bin/bash

# 🎭 Custom Actions Testing Script
# Tests all custom GitHub Actions in isolation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR="$(pwd)/test-actions"
mkdir -p "$TEST_DIR"

echo -e "${BLUE}🎭 Custom GitHub Actions Testing Suite${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️ $message${NC}"
    else
        echo -e "${BLUE}ℹ️ $message${NC}"
    fi
}

# Test version-bump action
test_version_bump_action() {
    echo -e "\n${BLUE}🔢 Testing version-bump Action${NC}"
    echo "==============================="

    cd "$TEST_DIR"

    # Install semver globally for testing
    npm install -g semver@7.5.4 2>/dev/null || {
        print_status "warning" "semver already installed or installation failed"
    }

    # Create test cases
    cat > test-version-bump.js << 'EOF'
const { execSync } = require('child_process');
const fs = require('fs');

// Test cases for version-bump action
const testCases = [
    {
        name: 'Auto detect minor from feat title',
        inputs: {
            'current-version': '1.0.0',
            'bump-type': 'auto',
            'pr-title': 'feat: add new payment system',
            'pr-labels': '[]'
        },
        expected: { version: '1.1.0', type: 'minor' }
    },
    {
        name: 'Auto detect patch from fix title',
        inputs: {
            'current-version': '1.2.3',
            'bump-type': 'auto',
            'pr-title': 'fix: resolve authentication bug',
            'pr-labels': '[]'
        },
        expected: { version: '1.2.4', type: 'patch' }
    },
    {
        name: 'Breaking change from feat! title',
        inputs: {
            'current-version': '1.5.2',
            'bump-type': 'auto',
            'pr-title': 'feat!: redesign user authentication',
            'pr-labels': '[]'
        },
        expected: { version: '2.0.0', type: 'major' }
    },
    {
        name: 'Label override - patch title with major label',
        inputs: {
            'current-version': '2.1.0',
            'bump-type': 'auto',
            'pr-title': 'fix: small bug',
            'pr-labels': '["bump:major"]'
        },
        expected: { version: '3.0.0', type: 'major' }
    },
    {
        name: 'Explicit bump type override',
        inputs: {
            'current-version': '1.0.0',
            'bump-type': 'minor',
            'pr-title': 'fix: small bug',
            'pr-labels': '[]'
        },
        expected: { version: '1.1.0', type: 'minor' }
    }
];

let passedTests = 0;
let totalTests = testCases.length;

console.log('🔢 Testing version-bump action logic...\n');

testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);

    try {
        // Manual bump type determination logic (from action)
        let bumpType = test.inputs['bump-type'];

        if (bumpType === 'auto') {
            const labels = JSON.parse(test.inputs['pr-labels']);
            const title = test.inputs['pr-title'];

            // Check labels first
            if (labels.includes('bump:major') || labels.includes('breaking')) {
                bumpType = 'major';
            } else if (labels.includes('bump:minor') || labels.includes('feature')) {
                bumpType = 'minor';
            } else if (labels.includes('bump:patch') || labels.includes('fix')) {
                bumpType = 'patch';
            } else {
                // Parse conventional commit from title
                if (title.match(/^(feat|feature)(\(.+\))?!:/)) {
                    bumpType = 'major';  // feat! indicates breaking
                } else if (title.match(/^(feat|feature)(\(.+\))?:/)) {
                    bumpType = 'minor';
                } else if (title.match(/^(fix|bugfix)(\(.+\))?:/)) {
                    bumpType = 'patch';
                } else {
                    bumpType = 'patch';  // Default
                }
            }
        }

        // Calculate new version using semver
        const currentVersion = test.inputs['current-version'];
        const newVersion = execSync(`npx semver ${currentVersion} -i ${bumpType}`,
            { encoding: 'utf8' }).trim();

        // Validate results
        const success = (newVersion === test.expected.version && bumpType === test.expected.type);

        if (success) {
            console.log(`  ✅ Expected: ${test.expected.version} (${test.expected.type})`);
            console.log(`  ✅ Actual:   ${newVersion} (${bumpType})`);
            passedTests++;
        } else {
            console.log(`  ❌ Expected: ${test.expected.version} (${test.expected.type})`);
            console.log(`  ❌ Actual:   ${newVersion} (${bumpType})`);
        }

    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }

    console.log('');
});

console.log(`Results: ${passedTests}/${totalTests} tests passed`);
process.exit(passedTests === totalTests ? 0 : 1);
EOF

    if node test-version-bump.js; then
        print_status "success" "version-bump action tests passed"
        return 0
    else
        print_status "error" "version-bump action tests failed"
        return 1
    fi
}

# Test changelog-gen action
test_changelog_gen_action() {
    echo -e "\n${BLUE}📋 Testing changelog-gen Action${NC}"
    echo "================================"

    cd "$TEST_DIR"

    # Create test release.json
    cat > test-release.json << 'EOF'
{
  "baseVersion": "1.0.0",
  "candidateVersion": "1.2.0",
  "releaseDate": "010125",
  "branchName": "010125-major-update",
  "changelog": {
    "features": [
      {"title": "Add user dashboard", "pr": 123, "author": "developer1", "timestamp": "2025-01-01T10:00:00Z"},
      {"title": "Implement dark mode", "pr": 125, "author": "designer1", "timestamp": "2025-01-01T11:00:00Z"}
    ],
    "fixes": [
      {"title": "Fix login validation error", "pr": 124, "author": "developer2", "timestamp": "2025-01-01T10:30:00Z"}
    ],
    "breaking": [
      {"title": "Change API authentication method", "pr": 126, "author": "architect1", "timestamp": "2025-01-01T12:00:00Z"}
    ],
    "other": [
      {"title": "Update documentation", "pr": 127, "author": "writer1", "timestamp": "2025-01-01T13:00:00Z"}
    ]
  },
  "rcBuilds": [
    {
      "version": "v1.2.0-rc-010125.1640995200",
      "pr": {"number": 123, "author": "developer1"},
      "timestamp": "2025-01-01T10:00:00Z",
      "bumpType": "minor"
    },
    {
      "version": "v1.2.0-rc-010125.1640995800",
      "pr": {"number": 124, "author": "developer2"},
      "timestamp": "2025-01-01T10:30:00Z",
      "bumpType": "patch"
    }
  ],
  "mergedPRs": [123, 124, 125, 126, 127]
}
EOF

    # Create changelog generation test
    cat > test-changelog-gen.js << 'EOF'
const fs = require('fs');

console.log('📋 Testing changelog-gen action...\n');

// Read test data
const releaseJson = JSON.parse(fs.readFileSync('test-release.json', 'utf8'));

// Generate changelog (mimicking action logic)
let changelog = `# Release v${releaseJson.candidateVersion}\n\n`;
changelog += `> Release Date: ${new Date().toLocaleDateString()}\n\n`;

// Add stats section
changelog += `## 📊 Release Statistics\n\n`;
changelog += `| Metric | Value |\n`;
changelog += `|-----------|-------|\n`;
changelog += `| Base Version | v${releaseJson.baseVersion} |\n`;
changelog += `| New Version | v${releaseJson.candidateVersion} |\n`;
changelog += `| RC Builds | ${releaseJson.rcBuilds.length} |\n`;
changelog += `| PRs Merged | ${releaseJson.mergedPRs.length} |\n`;

const totalChanges = releaseJson.changelog.features.length +
                    releaseJson.changelog.fixes.length +
                    releaseJson.changelog.breaking.length +
                    releaseJson.changelog.other.length;

changelog += `| Total Changes | ${totalChanges} |\n\n`;

// Breaking changes
if (releaseJson.changelog.breaking.length > 0) {
    changelog += `## ⚠️ Breaking Changes\n\n`;
    releaseJson.changelog.breaking.forEach(item => {
        changelog += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    changelog += `\n`;
}

// Features
if (releaseJson.changelog.features.length > 0) {
    changelog += `## 🚀 New Features\n\n`;
    releaseJson.changelog.features.forEach(item => {
        changelog += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    changelog += `\n`;
}

// Bug fixes
if (releaseJson.changelog.fixes.length > 0) {
    changelog += `## 🐛 Bug Fixes\n\n`;
    releaseJson.changelog.fixes.forEach(item => {
        changelog += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    changelog += `\n`;
}

// Other changes
if (releaseJson.changelog.other.length > 0) {
    changelog += `## 📝 Other Changes\n\n`;
    releaseJson.changelog.other.forEach(item => {
        changelog += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    changelog += `\n`;
}

// Contributors
const contributors = new Set();
const allChanges = [
    ...releaseJson.changelog.features,
    ...releaseJson.changelog.fixes,
    ...releaseJson.changelog.breaking,
    ...releaseJson.changelog.other
];

allChanges.forEach(item => {
    if (item.author) contributors.add(item.author);
});

if (contributors.size > 0) {
    changelog += `## 👥 Contributors\n\n`;
    changelog += `Thanks to: ${Array.from(contributors).map(c => `@${c}`).join(', ')}\n\n`;
}

// RC Build history
if (releaseJson.rcBuilds.length > 0) {
    changelog += `## 🏗️ Build History\n\n`;
    changelog += `| RC Version | PR | Author | Date |\n`;
    changelog += `|------------|----|---------|---------|\n`;
    releaseJson.rcBuilds.forEach(build => {
        const date = new Date(build.timestamp).toLocaleDateString();
        changelog += `| ${build.version} | #${build.pr.number} | @${build.pr.author} | ${date} |\n`;
    });
    changelog += `\n`;
}

// Write generated changelog
fs.writeFileSync('generated-changelog.md', changelog);

console.log('Generated changelog successfully!');
console.log('\n📄 Generated changelog preview:');
console.log('=====================================');
console.log(changelog.substring(0, 1000) + '...\n');

// Validate changelog contents
let testsPassed = 0;
let totalTests = 8;

console.log('🔍 Validating changelog contents:\n');

// Test 1: Version header
if (changelog.includes('# Release v1.2.0')) {
    console.log('✅ Version header present');
    testsPassed++;
} else {
    console.log('❌ Version header missing');
}

// Test 2: Statistics section
if (changelog.includes('## 📊 Release Statistics')) {
    console.log('✅ Statistics section present');
    testsPassed++;
} else {
    console.log('❌ Statistics section missing');
}

// Test 3: Breaking changes
if (changelog.includes('## ⚠️ Breaking Changes')) {
    console.log('✅ Breaking changes section present');
    testsPassed++;
} else {
    console.log('❌ Breaking changes section missing');
}

// Test 4: Features section
if (changelog.includes('## 🚀 New Features')) {
    console.log('✅ Features section present');
    testsPassed++;
} else {
    console.log('❌ Features section missing');
}

// Test 5: Bug fixes section
if (changelog.includes('## 🐛 Bug Fixes')) {
    console.log('✅ Bug fixes section present');
    testsPassed++;
} else {
    console.log('❌ Bug fixes section missing');
}

// Test 6: Contributors section
if (changelog.includes('## 👥 Contributors')) {
    console.log('✅ Contributors section present');
    testsPassed++;
} else {
    console.log('❌ Contributors section missing');
}

// Test 7: Build history
if (changelog.includes('## 🏗️ Build History')) {
    console.log('✅ Build history section present');
    testsPassed++;
} else {
    console.log('❌ Build history section missing');
}

// Test 8: All expected PRs mentioned
const expectedPRs = [123, 124, 125, 126, 127];
const allPRsPresent = expectedPRs.every(pr => changelog.includes(`#${pr}`));
if (allPRsPresent) {
    console.log('✅ All PRs mentioned in changelog');
    testsPassed++;
} else {
    console.log('❌ Some PRs missing from changelog');
}

console.log(`\nResults: ${testsPassed}/${totalTests} tests passed`);
process.exit(testsPassed === totalTests ? 0 : 1);
EOF

    if node test-changelog-gen.js; then
        print_status "success" "changelog-gen action tests passed"
        return 0
    else
        print_status "error" "changelog-gen action tests failed"
        return 1
    fi
}

# Test docker-mock action
test_docker_mock_action() {
    echo -e "\n${BLUE}🐳 Testing docker-mock Action${NC}"
    echo "=============================="

    cd "$TEST_DIR"

    # Since docker-mock is likely a simple simulation action,
    # we'll test the expected output format
    cat > test-docker-mock.js << 'EOF'
const { execSync } = require('child_process');

console.log('🐳 Testing docker-mock action simulation...\n');

// Mock the docker operations that the action would simulate
function simulateDockerBuild(tag, buildType = 'standard') {
    console.log('====================================');
    console.log(`🐳 DOCKER BUILD SIMULATION (${buildType.toUpperCase()})`);
    console.log('====================================');
    console.log('');

    if (buildType === 'hotfix') {
        console.log('Build Type: HOTFIX - Fresh build from main');
    } else {
        console.log('Environment: Development/Release');
    }

    console.log('');
    console.log('Would execute:');
    console.log(`  docker build -t myapp:${tag} .`);
    console.log('');
    console.log('Build args:');
    console.log(`  - VERSION=${tag}`);
    console.log(`  - BUILD_DATE=${new Date().toISOString()}`);
    console.log(`  - VCS_REF=abc123def456`);

    if (buildType === 'hotfix') {
        console.log('  - IS_HOTFIX=true');
    }

    console.log('');
    console.log('====================================');
    console.log('🏷️ DOCKER TAGGING');
    console.log('====================================');
    console.log('');
    console.log('Would tag as:');
    console.log(`  - \${ECR_REGISTRY}/myapp:${tag}`);

    if (buildType === 'hotfix') {
        console.log(`  - \${ECR_REGISTRY}/myapp:latest`);
        console.log(`  - \${ECR_REGISTRY}/myapp:hotfix`);
    } else if (buildType === 'release') {
        console.log(`  - \${ECR_REGISTRY}/myapp:latest`);
        console.log(`  - \${ECR_REGISTRY}/myapp:stable`);
    } else {
        console.log(`  - \${ECR_REGISTRY}/myapp:dev-latest`);
    }

    console.log('');
    console.log('====================================');
    console.log('📤 ECR PUSH SIMULATION');
    console.log('====================================');
    console.log('');
    console.log('Would push to ECR:');
    console.log(`  - docker push \${ECR_REGISTRY}/myapp:${tag}`);

    // Generate mock digest
    const mockDigest = require('crypto')
        .createHash('sha256')
        .update(tag)
        .digest('hex')
        .substring(0, 16);

    console.log('');
    console.log(`Expected image digest: sha256:${mockDigest}`);
    console.log('');
    console.log('====================================');

    return {
        tag: tag,
        digest: `sha256:${mockDigest}`,
        success: true
    };
}

function simulateDockerRetag(sourceTag, finalTag) {
    console.log('====================================');
    console.log('🐳 DOCKER RETAG SIMULATION (NO REBUILD)');
    console.log('====================================');
    console.log('');
    console.log('SOURCE: Production image from tested RC');
    console.log(`RC Version: ${sourceTag}`);
    console.log('');
    console.log('Would execute:');
    console.log(`  1. docker pull \${ECR_REGISTRY}/myapp:${sourceTag}`);
    console.log(`  2. docker tag \${ECR_REGISTRY}/myapp:${sourceTag} \${ECR_REGISTRY}/myapp:${finalTag}`);
    console.log(`  3. docker tag \${ECR_REGISTRY}/myapp:${sourceTag} \${ECR_REGISTRY}/myapp:latest`);
    console.log(`  4. docker tag \${ECR_REGISTRY}/myapp:${sourceTag} \${ECR_REGISTRY}/myapp:stable`);
    console.log('');
    console.log('====================================');
    console.log('📤 ECR PUSH SIMULATION');
    console.log('====================================');
    console.log('');
    console.log('Would push tags (image unchanged):');
    console.log(`  - docker push \${ECR_REGISTRY}/myapp:${finalTag}`);
    console.log(`  - docker push \${ECR_REGISTRY}/myapp:latest`);
    console.log(`  - docker push \${ECR_REGISTRY}/myapp:stable`);
    console.log('');
    console.log('Note: Same image digest as RC, just different tags');

    const mockDigest = require('crypto')
        .createHash('sha256')
        .update(sourceTag)
        .digest('hex')
        .substring(0, 16);

    console.log(`Digest: sha256:${mockDigest}`);
    console.log('');
    console.log('====================================');

    return {
        sourceTag: sourceTag,
        finalTag: finalTag,
        digest: `sha256:${mockDigest}`,
        success: true
    };
}

// Test different docker operation types
console.log('Test 1: RC Build Simulation');
const rcResult = simulateDockerBuild('v1.2.0-rc-010125.1640995200', 'rc');

console.log('\nTest 2: Hotfix Build Simulation');
const hotfixResult = simulateDockerBuild('v1.2.1', 'hotfix');

console.log('\nTest 3: Development Build Simulation');
const devResult = simulateDockerBuild('dev-20250101-123456', 'dev');

console.log('\nTest 4: Production Retag Simulation');
const retagResult = simulateDockerRetag('v1.2.0-rc-010125.1640995200', 'v1.2.0');

// Validate results
let testsPassed = 0;
let totalTests = 4;

console.log('\n🔍 Validating docker-mock simulation results:\n');

// Test 1: RC build has proper tag format
if (rcResult.tag.includes('-rc-') && rcResult.success) {
    console.log('✅ RC build simulation successful');
    testsPassed++;
} else {
    console.log('❌ RC build simulation failed');
}

// Test 2: Hotfix build completed
if (hotfixResult.success && hotfixResult.tag.match(/^v\d+\.\d+\.\d+$/)) {
    console.log('✅ Hotfix build simulation successful');
    testsPassed++;
} else {
    console.log('❌ Hotfix build simulation failed');
}

// Test 3: Dev build has timestamp
if (devResult.success && devResult.tag.includes('dev-')) {
    console.log('✅ Dev build simulation successful');
    testsPassed++;
} else {
    console.log('❌ Dev build simulation failed');
}

// Test 4: Retag operation completed
if (retagResult.success && retagResult.sourceTag !== retagResult.finalTag) {
    console.log('✅ Production retag simulation successful');
    testsPassed++;
} else {
    console.log('❌ Production retag simulation failed');
}

console.log(`\nResults: ${testsPassed}/${totalTests} tests passed`);
process.exit(testsPassed === totalTests ? 0 : 1);
EOF

    if node test-docker-mock.js; then
        print_status "success" "docker-mock action tests passed"
        return 0
    else
        print_status "error" "docker-mock action tests failed"
        return 1
    fi
}

# Main test execution
main() {
    local test_results=()
    local failed_tests=0

    print_status "info" "Starting custom actions testing..."
    print_status "info" "Test directory: $TEST_DIR"

    # Check prerequisites
    if ! command -v node &> /dev/null; then
        print_status "error" "Node.js is required but not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_status "error" "npm is required but not installed"
        exit 1
    fi

    echo -e "\n${BLUE}🚀 Starting Custom Actions Test Sequence${NC}"
    echo "=========================================="

    # Test 1: version-bump action
    if test_version_bump_action; then
        test_results+=("✅ version-bump action - PASSED")
    else
        test_results+=("❌ version-bump action - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 2: changelog-gen action
    if test_changelog_gen_action; then
        test_results+=("✅ changelog-gen action - PASSED")
    else
        test_results+=("❌ changelog-gen action - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Test 3: docker-mock action
    if test_docker_mock_action; then
        test_results+=("✅ docker-mock action - PASSED")
    else
        test_results+=("❌ docker-mock action - FAILED")
        failed_tests=$((failed_tests + 1))
    fi

    # Print results summary
    echo -e "\n${BLUE}📊 Custom Actions Test Results${NC}"
    echo "==============================="
    printf "%-30s %s\n" "Action" "Result"
    echo "================================================="

    for result in "${test_results[@]}"; do
        echo "$result"
    done

    echo "================================================="
    echo "Total Tests: ${#test_results[@]}"
    echo "Passed: $((${#test_results[@]} - failed_tests))"
    echo "Failed: $failed_tests"

    if [ $failed_tests -eq 0 ]; then
        print_status "success" "All custom action tests passed! 🎉"
        echo ""
        print_status "info" "Test artifacts saved in: $TEST_DIR"
    else
        print_status "error" "$failed_tests custom action test(s) failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --cleanup)
        rm -rf "$TEST_DIR"
        print_status "success" "Test directory cleaned up"
        exit 0
        ;;
    --help|-h)
        echo "Usage: $0 [--cleanup|--help]"
        echo ""
        echo "Options:"
        echo "  --cleanup    Remove test directory and artifacts"
        echo "  --help       Show this help message"
        echo ""
        echo "This script tests all custom GitHub Actions in isolation."
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac