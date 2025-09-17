#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Updates release.json with new version information and PR details
 */

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error('Usage: update-release-json.js <command> [options]');
  console.error('Commands:');
  console.error('  init <base-version>                    - Initialize new release.json');
  console.error('  bump <new-version> <bump-type>         - Update version');
  console.error('  add-rc <version> <pr-number> <author>  - Add RC build');
  console.error('  add-change <type> <pr> <title> <author> - Add changelog entry');
  console.error('  validate                                - Validate release.json');
  process.exit(1);
}

const RELEASE_JSON_PATH = path.join(process.cwd(), 'release.json');

/**
 * Read release.json file
 */
function readReleaseJson() {
  if (!fs.existsSync(RELEASE_JSON_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(RELEASE_JSON_PATH, 'utf8'));
}

/**
 * Write release.json file
 */
function writeReleaseJson(data) {
  fs.writeFileSync(RELEASE_JSON_PATH, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Initialize new release.json
 */
function initReleaseJson(baseVersion) {
  const branchName = process.env.GITHUB_REF ?
    process.env.GITHUB_REF.replace('refs/heads/', '') :
    'release/unknown';

  const releaseJson = {
    baseVersion: baseVersion,
    currentVersion: baseVersion,
    candidateVersion: baseVersion,
    releaseDate: new Date().toISOString().split('T')[0],
    branchName: branchName.replace('release/', ''),
    rcBuilds: [],
    changelog: {
      features: [],
      fixes: [],
      breaking: [],
      other: []
    },
    mergedPRs: [],
    lastUpdated: new Date().toISOString(),
    metadata: {
      createdBy: process.env.GITHUB_ACTOR || 'unknown',
      createdAt: new Date().toISOString(),
      suggestedBump: 'minor'
    }
  };

  writeReleaseJson(releaseJson);
  console.log(`✅ Initialized release.json with base version ${baseVersion}`);
  return releaseJson;
}

/**
 * Update version in release.json
 */
function bumpVersion(newVersion, bumpType) {
  let releaseJson = readReleaseJson();
  if (!releaseJson) {
    console.error('❌ release.json not found');
    process.exit(1);
  }

  releaseJson.currentVersion = newVersion;
  releaseJson.candidateVersion = newVersion;
  releaseJson.lastUpdated = new Date().toISOString();

  if (releaseJson.metadata) {
    releaseJson.metadata.lastBumpType = bumpType;
  }

  writeReleaseJson(releaseJson);
  console.log(`✅ Updated version to ${newVersion} (${bumpType} bump)`);
  return releaseJson;
}

/**
 * Add RC build entry
 */
function addRcBuild(version, prNumber, author) {
  let releaseJson = readReleaseJson();
  if (!releaseJson) {
    console.error('❌ release.json not found');
    process.exit(1);
  }

  const rcBuild = {
    version: version,
    pr: {
      number: parseInt(prNumber),
      author: author,
      url: `https://github.com/${process.env.GITHUB_REPOSITORY}/pull/${prNumber}`
    },
    commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'unknown',
    timestamp: new Date().toISOString(),
    bumpType: releaseJson.metadata?.lastBumpType || 'patch'
  };

  releaseJson.rcBuilds.push(rcBuild);
  releaseJson.lastUpdated = new Date().toISOString();

  // Add to merged PRs list
  if (!releaseJson.mergedPRs.includes(parseInt(prNumber))) {
    releaseJson.mergedPRs.push(parseInt(prNumber));
  }

  writeReleaseJson(releaseJson);
  console.log(`✅ Added RC build ${version}`);
  return releaseJson;
}

/**
 * Add changelog entry
 */
function addChangelogEntry(type, prNumber, title, author) {
  let releaseJson = readReleaseJson();
  if (!releaseJson) {
    console.error('❌ release.json not found');
    process.exit(1);
  }

  const entry = {
    pr: parseInt(prNumber),
    title: title,
    author: author,
    timestamp: new Date().toISOString()
  };

  // Determine changelog category
  let category;
  switch(type.toLowerCase()) {
    case 'feature':
    case 'feat':
      category = 'features';
      break;
    case 'fix':
    case 'bugfix':
      category = 'fixes';
      break;
    case 'breaking':
    case 'break':
      category = 'breaking';
      break;
    default:
      category = 'other';
  }

  if (!releaseJson.changelog[category]) {
    releaseJson.changelog[category] = [];
  }

  // Avoid duplicates
  const exists = releaseJson.changelog[category].some(e => e.pr === parseInt(prNumber));
  if (!exists) {
    releaseJson.changelog[category].push(entry);
    releaseJson.lastUpdated = new Date().toISOString();
    writeReleaseJson(releaseJson);
    console.log(`✅ Added ${type} changelog entry for PR #${prNumber}`);
  } else {
    console.log(`ℹ️ Changelog entry for PR #${prNumber} already exists`);
  }

  return releaseJson;
}

/**
 * Validate release.json structure
 */
function validateReleaseJson() {
  let releaseJson = readReleaseJson();
  if (!releaseJson) {
    console.error('❌ release.json not found');
    process.exit(1);
  }

  const requiredFields = [
    'baseVersion',
    'currentVersion',
    'candidateVersion',
    'rcBuilds',
    'changelog',
    'mergedPRs',
    'lastUpdated'
  ];

  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!releaseJson.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  ['baseVersion', 'currentVersion', 'candidateVersion'].forEach(field => {
    if (releaseJson[field] && !semverRegex.test(releaseJson[field])) {
      errors.push(`Invalid version format in ${field}: ${releaseJson[field]}`);
    }
  });

  // Validate changelog structure
  if (releaseJson.changelog) {
    const expectedCategories = ['features', 'fixes', 'breaking', 'other'];
    expectedCategories.forEach(cat => {
      if (!Array.isArray(releaseJson.changelog[cat])) {
        errors.push(`Changelog category ${cat} is not an array`);
      }
    });
  }

  // Validate RC builds
  if (!Array.isArray(releaseJson.rcBuilds)) {
    errors.push('rcBuilds must be an array');
  }

  if (errors.length > 0) {
    console.error('❌ Validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ release.json is valid');
  console.log(`  Version: ${releaseJson.currentVersion}`);
  console.log(`  RC Builds: ${releaseJson.rcBuilds.length}`);
  console.log(`  PRs Merged: ${releaseJson.mergedPRs.length}`);
  console.log(`  Total Changes: ${
    releaseJson.changelog.features.length +
    releaseJson.changelog.fixes.length +
    releaseJson.changelog.breaking.length +
    releaseJson.changelog.other.length
  }`);

  return releaseJson;
}

// Execute command
switch(command) {
  case 'init':
    initReleaseJson(args[1] || '0.0.0');
    break;
  case 'bump':
    bumpVersion(args[1], args[2] || 'patch');
    break;
  case 'add-rc':
    addRcBuild(args[1], args[2], args[3] || 'unknown');
    break;
  case 'add-change':
    addChangelogEntry(args[1], args[2], args[3], args[4] || 'unknown');
    break;
  case 'validate':
    validateReleaseJson();
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}