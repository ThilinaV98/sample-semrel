#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Advanced changelog generator
 * Supports both release.json and git commit history
 */

// Configuration
const config = {
  releaseJsonPath: process.argv[2] || 'release.json',
  outputPath: process.argv[3] || 'CHANGELOG.md',
  format: process.argv[4] || 'markdown',
  includeStats: process.argv[5] !== 'false',
  includeContributors: process.argv[6] !== 'false'
};

/**
 * Generate changelog from release.json
 */
function generateFromReleaseJson(releaseJson) {
  let output = '';

  // Header
  const version = releaseJson.candidateVersion || releaseJson.currentVersion;
  output += `# Release v${version}\n\n`;
  output += `> Release Date: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}\n\n`;

  // Statistics section
  if (config.includeStats) {
    output += `## 📊 Release Statistics\n\n`;
    output += `| Metric | Value |\n`;
    output += `|--------|-------|\n`;
    output += `| Base Version | v${releaseJson.baseVersion} |\n`;
    output += `| Release Version | v${version} |\n`;
    output += `| RC Builds | ${releaseJson.rcBuilds.length} |\n`;
    output += `| PRs Merged | ${releaseJson.mergedPRs.length} |\n`;

    const totalChanges =
      (releaseJson.changelog.features?.length || 0) +
      (releaseJson.changelog.fixes?.length || 0) +
      (releaseJson.changelog.breaking?.length || 0) +
      (releaseJson.changelog.other?.length || 0);

    output += `| Total Changes | ${totalChanges} |\n\n`;

    // Change breakdown
    if (totalChanges > 0) {
      output += `### Change Breakdown\n\n`;
      output += `- 🚀 Features: ${releaseJson.changelog.features?.length || 0}\n`;
      output += `- 🐛 Bug Fixes: ${releaseJson.changelog.fixes?.length || 0}\n`;
      output += `- ⚠️ Breaking Changes: ${releaseJson.changelog.breaking?.length || 0}\n`;
      output += `- 📝 Other: ${releaseJson.changelog.other?.length || 0}\n\n`;
    }
  }

  // Breaking changes (always first if present)
  if (releaseJson.changelog.breaking?.length > 0) {
    output += `## ⚠️ BREAKING CHANGES\n\n`;
    output += `> **Action Required:** Review these changes before upgrading\n\n`;
    releaseJson.changelog.breaking.forEach(item => {
      output += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    output += `\n`;
  }

  // New Features
  if (releaseJson.changelog.features?.length > 0) {
    output += `## 🚀 New Features\n\n`;
    releaseJson.changelog.features.forEach(item => {
      output += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    output += `\n`;
  }

  // Bug Fixes
  if (releaseJson.changelog.fixes?.length > 0) {
    output += `## 🐛 Bug Fixes\n\n`;
    releaseJson.changelog.fixes.forEach(item => {
      output += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    output += `\n`;
  }

  // Other Changes
  if (releaseJson.changelog.other?.length > 0) {
    output += `## 📝 Other Changes\n\n`;
    releaseJson.changelog.other.forEach(item => {
      output += `- ${item.title} (#${item.pr}) @${item.author}\n`;
    });
    output += `\n`;
  }

  // Contributors section
  if (config.includeContributors) {
    const contributors = new Set();
    const allChanges = [
      ...(releaseJson.changelog.features || []),
      ...(releaseJson.changelog.fixes || []),
      ...(releaseJson.changelog.breaking || []),
      ...(releaseJson.changelog.other || [])
    ];

    allChanges.forEach(item => {
      if (item.author && item.author !== 'unknown') {
        contributors.add(item.author);
      }
    });

    if (contributors.size > 0) {
      output += `## 👥 Contributors\n\n`;
      output += `A huge thank you to all contributors who made this release possible:\n\n`;
      const sortedContributors = Array.from(contributors).sort();
      output += sortedContributors.map(c => `@${c}`).join(', ') + '\n\n';
    }
  }

  // RC Build History
  if (releaseJson.rcBuilds?.length > 0) {
    output += `## 🏗️ Release Candidate History\n\n`;
    output += `<details>\n`;
    output += `<summary>View all ${releaseJson.rcBuilds.length} RC builds</summary>\n\n`;
    output += `| # | RC Version | PR | Author | Timestamp |\n`;
    output += `|---|------------|-----|---------|------------|\n`;

    releaseJson.rcBuilds.forEach((build, index) => {
      const date = new Date(build.timestamp).toLocaleString();
      const prLink = build.pr?.number ? `#${build.pr.number}` : '-';
      const author = build.pr?.author || 'unknown';
      output += `| ${index + 1} | \`${build.version}\` | ${prLink} | @${author} | ${date} |\n`;
    });
    output += `\n</details>\n\n`;
  }

  // Docker/Deployment Information
  output += `## 🐳 Deployment Information\n\n`;
  output += `### Docker Images\n\n`;
  output += `\`\`\`bash\n`;
  output += `# Production image\n`;
  output += `docker pull your-registry/your-app:v${version}\n\n`;
  output += `# Latest tag\n`;
  output += `docker pull your-registry/your-app:latest\n`;
  output += `\`\`\`\n\n`;

  // Upgrade instructions
  output += `### Upgrade Instructions\n\n`;
  output += `1. Review breaking changes (if any) above\n`;
  output += `2. Pull the new Docker image\n`;
  output += `3. Update your deployment configuration\n`;
  output += `4. Deploy using your standard process\n\n`;

  // Footer
  output += `---\n\n`;
  output += `*Generated on ${new Date().toISOString()}*\n`;

  return output;
}

/**
 * Generate changelog from git commits
 */
function generateFromGitCommits(fromTag, toTag = 'HEAD') {
  console.error('📋 Generating changelog from git commits...');

  try {
    // Get commit range
    const range = fromTag ? `${fromTag}..${toTag}` : toTag;

    // Get commits in conventional format
    const commits = execSync(
      `git log ${range} --pretty=format:"%H|%s|%an|%ae|%ai"`,
      { encoding: 'utf8' }
    ).trim().split('\n');

    const categorizedCommits = {
      breaking: [],
      features: [],
      fixes: [],
      other: []
    };

    commits.forEach(line => {
      const [hash, subject, author, email, date] = line.split('|');

      // Parse conventional commit
      const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)/);
      if (match) {
        const [, type, scope, description] = match;
        const isBreaking = subject.includes('!:');

        const commit = {
          hash: hash.substring(0, 7),
          type,
          scope,
          description,
          author,
          date: new Date(date).toLocaleDateString()
        };

        if (isBreaking) {
          categorizedCommits.breaking.push(commit);
        } else if (type === 'feat' || type === 'feature') {
          categorizedCommits.features.push(commit);
        } else if (type === 'fix' || type === 'bugfix') {
          categorizedCommits.fixes.push(commit);
        } else {
          categorizedCommits.other.push(commit);
        }
      }
    });

    // Generate output
    let output = '# Changelog\n\n';

    if (categorizedCommits.breaking.length > 0) {
      output += '## ⚠️ Breaking Changes\n\n';
      categorizedCommits.breaking.forEach(c => {
        output += `- ${c.description} (${c.hash}) @${c.author}\n`;
      });
      output += '\n';
    }

    if (categorizedCommits.features.length > 0) {
      output += '## 🚀 Features\n\n';
      categorizedCommits.features.forEach(c => {
        output += `- ${c.description} (${c.hash}) @${c.author}\n`;
      });
      output += '\n';
    }

    if (categorizedCommits.fixes.length > 0) {
      output += '## 🐛 Bug Fixes\n\n';
      categorizedCommits.fixes.forEach(c => {
        output += `- ${c.description} (${c.hash}) @${c.author}\n`;
      });
      output += '\n';
    }

    return output;

  } catch (error) {
    console.error(`⚠️ Could not generate from git: ${error.message}`);
    return '# Changelog\n\n*No commit history available*\n';
  }
}

// Main execution
function main() {
  let changelog;

  // Check if release.json exists
  if (fs.existsSync(config.releaseJsonPath)) {
    console.error(`✅ Found release.json, generating changelog...`);
    const releaseJson = JSON.parse(fs.readFileSync(config.releaseJsonPath, 'utf8'));
    changelog = generateFromReleaseJson(releaseJson);
  } else {
    console.error(`⚠️ No release.json found, falling back to git history...`);
    changelog = generateFromGitCommits();
  }

  // Write output
  fs.writeFileSync(config.outputPath, changelog);
  console.error(`✅ Changelog written to ${config.outputPath}`);

  // Also output to stdout for capture
  console.log(changelog);
}

// Run
main();