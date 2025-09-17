#!/usr/bin/env node

const semver = require('semver');
const fs = require('fs');
const path = require('path');

/**
 * Semantic version bumping utility
 */

// Parse arguments
const currentVersion = process.argv[2];
const bumpType = process.argv[3];
const prerelease = process.argv[4];

if (!currentVersion || !bumpType) {
  console.error('Usage: bump-version.js <current-version> <bump-type> [prerelease-tag]');
  console.error('');
  console.error('Bump types:');
  console.error('  major     - Breaking changes (1.0.0 -> 2.0.0)');
  console.error('  minor     - New features (1.0.0 -> 1.1.0)');
  console.error('  patch     - Bug fixes (1.0.0 -> 1.0.1)');
  console.error('  premajor  - Pre-release major (1.0.0 -> 2.0.0-rc.0)');
  console.error('  preminor  - Pre-release minor (1.0.0 -> 1.1.0-rc.0)');
  console.error('  prepatch  - Pre-release patch (1.0.0 -> 1.0.1-rc.0)');
  console.error('  prerelease - Increment pre-release (1.0.0-rc.0 -> 1.0.0-rc.1)');
  console.error('');
  console.error('Examples:');
  console.error('  bump-version.js 1.2.3 major');
  console.error('  bump-version.js 1.2.3 minor');
  console.error('  bump-version.js 1.2.3 premajor rc');
  process.exit(1);
}

// Validate current version
if (!semver.valid(currentVersion)) {
  console.error(`❌ Invalid version: ${currentVersion}`);
  process.exit(1);
}

// Calculate new version
let newVersion;

try {
  if (bumpType.startsWith('pre') && prerelease) {
    // Pre-release with identifier
    newVersion = semver.inc(currentVersion, bumpType, prerelease);
  } else {
    // Regular bump
    newVersion = semver.inc(currentVersion, bumpType);
  }

  if (!newVersion) {
    throw new Error('Failed to calculate new version');
  }

  // Output the new version (for shell consumption)
  console.log(newVersion);

  // If running in GitHub Actions, set output
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new-version=${newVersion}\n`);
  }

  // Log details to stderr (won't affect shell capture)
  console.error(`✅ Version bump successful`);
  console.error(`   ${currentVersion} → ${newVersion} (${bumpType})`);

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}