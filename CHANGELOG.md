## 1.0.0 (2025-09-11)


### ✨ Features

* enhance CI/CD workflows and add comprehensive testing ([d64a861](https://github.com/ThilinaV98/sample-semrel/commit/d64a861b585d61d984a67a8b16e2943224e124ba))
* fix GitHub Actions workflows and implement proper semantic release ([9471064](https://github.com/ThilinaV98/sample-semrel/commit/947106419bf74410e1af4240a36407621940aff3))
* initial semantic release setup ([85ad670](https://github.com/ThilinaV98/sample-semrel/commit/85ad6701dc303710ff576bdeb960058597c4bcee))


### 🐛 Bug Fixes

* make commit validation more lenient for feature branches ([0a794d1](https://github.com/ThilinaV98/sample-semrel/commit/0a794d1e453aeec6b1660ab0640c44e1fa2093dd))
* resolve Codecov external service issues ([aec0665](https://github.com/ThilinaV98/sample-semrel/commit/aec066589a1971fcaf45d26f0fcd89eecf40c543))
* resolve deprecated upload-artifact error in CI workflows ([7fba231](https://github.com/ThilinaV98/sample-semrel/commit/7fba2310fd39188ce9cb2963f3031624a623d5fc))
* resolve ESLint warnings to prevent workflow failures ([d7dc0a0](https://github.com/ThilinaV98/sample-semrel/commit/d7dc0a06e73b48d6960ca9ae62fe3e4eb7dd9ead))
* resolve GitHub Actions workflow failures ([ca5cef4](https://github.com/ThilinaV98/sample-semrel/commit/ca5cef4e911b5f3f13bc94eeb89ab866880b3063))
* resolve GitHub Actions workflow failures and improve test coverage ([46ed24c](https://github.com/ThilinaV98/sample-semrel/commit/46ed24c8b35de48b6e18830beb9f10630fb42f41))
* resolve Logger initialization and test failures ([1b6a7d5](https://github.com/ThilinaV98/sample-semrel/commit/1b6a7d525696da7063ffb2a74e12ec9bc0502b83))
* resolve prettier formatting consistency issue ([aa69bfd](https://github.com/ThilinaV98/sample-semrel/commit/aa69bfd49c68c897f7934e04e739789a4cea571c))
* resolve Super-Linter configuration conflict ([eed9773](https://github.com/ThilinaV98/sample-semrel/commit/eed977348be2ee219e16d78f7a9ea61cf3078739))
* resolve Super-Linter configuration conflicts ([fa40b04](https://github.com/ThilinaV98/sample-semrel/commit/fa40b04b13d19234cf672eaa4aa6514d484f32b0))
* resolve Super-Linter failure in PR validation workflow ([d8cda60](https://github.com/ThilinaV98/sample-semrel/commit/d8cda600ce9806fd59e405a3cc0629e616c0da7f))
* resolve Super-Linter v5 validation configuration conflict ([ecab1cd](https://github.com/ThilinaV98/sample-semrel/commit/ecab1cd28dd98a10b12a0f06e3f1dc523809cf6e))
* resolve unused parameter eslint warning in error handler ([71e467d](https://github.com/ThilinaV98/sample-semrel/commit/71e467d10c48ad5c9167b684b643f10a71d5ef01))
* resolve workflow validation issues ([ee638f8](https://github.com/ThilinaV98/sample-semrel/commit/ee638f88109980f5666f9679b2edcfeea1491436))


### ♻️ Code Refactoring

* simplify CI/CD to semantic versioning only ([817b09b](https://github.com/ThilinaV98/sample-semrel/commit/817b09ba2c4ac44aed35b90c3d0357906ad3151c))

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
