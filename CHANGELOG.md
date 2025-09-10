# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.0] - 2025-09-10

### 🚀 Features
- **workflows**: Fix GitHub Actions workflows and implement proper semantic release ([9471064](https://github.com/ThilinaV98/sample-semrel/commit/9471064))
  - Implemented comprehensive CI/CD pipeline with semantic release
  - Added multiple workflow configurations for different stages
  - Configured automated versioning and changelog generation

### 🐛 Bug Fixes
- **super-linter**: Resolve Super-Linter configuration conflicts ([fa40b04](https://github.com/ThilinaV98/sample-semrel/commit/fa40b04))
  - Disabled JavaScript/TypeScript validation in Super-Linter
  - Fixed conflicts with ESLint configuration
  - Removed shellcheck warnings

- **codecov**: Resolve Codecov external service issues ([aec0665](https://github.com/ThilinaV98/sample-semrel/commit/aec0665))
  - Made Codecov uploads non-blocking
  - Added fallback coverage reporting
  - Updated to codecov-action@v4

- **workflows**: Resolve GitHub Actions workflow failures and improve test coverage ([46ed24c](https://github.com/ThilinaV98/sample-semrel/commit/46ed24c))
  - Fixed validation issues across multiple workflows
  - Improved test coverage to >84%
  - Enhanced error handling

- **prettier**: Resolve prettier formatting consistency issue ([aa69bfd](https://github.com/ThilinaV98/sample-semrel/commit/aa69bfd))
  - Fixed formatting inconsistencies
  - Aligned with project code style

- **validation**: Make commit validation more lenient for feature branches ([0a794d1](https://github.com/ThilinaV98/sample-semrel/commit/0a794d1))
  - Adjusted validation rules for better developer experience
  - Maintained quality standards

### 📚 Documentation
- Added comprehensive workflow testing guide (WORKFLOW-TESTING-GUIDE.md)
- Created Codecov setup documentation (CODECOV-SETUP.md)
- Updated branching strategy documentation (BRANCHING-STRATEGY.md)
- Added Act testing guide (ACT-TESTING-GUIDE.md)

### 📊 Quality Metrics
- **Test Coverage**: 90.82% statements, 84.28% branches, 92.85% functions
- **Tests**: 128 passing tests across 4 test suites
- **Workflows**: 6 GitHub Actions workflows configured and tested
- **Linting**: Super-Linter, ESLint, and Prettier configured