# Simplified Semantic Release Workflow

## Branching Strategy

```
main (production)
  ├── feature/* (feature development)
  └── release/* (release preparation)
```

## Workflow Process

### 1. Feature Development
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Develop your feature with conventional commits
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

### 2. Create Release Branch
```bash
# Create release branch from main
git checkout main
git pull origin main
git checkout -b release/v1.1.0

# Merge feature branch into release branch
git merge feature/your-feature-name
git push origin release/v1.1.0
```

### 3. Automatic Version Update
When you push to a `release/*` branch, the workflow will:
1. Analyze commits to determine version bump (major/minor/patch)
2. Update version in package.json
3. Generate/update CHANGELOG.md
4. Create a GitHub release
5. Commit changes back to the repository

## Commit Convention

Use conventional commits for automatic versioning:

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `perf:` - Performance improvement (patch version bump)
- `refactor:` - Code refactoring (patch version bump)
- `BREAKING CHANGE:` - Breaking change (major version bump)
- `docs:` - Documentation only (no version bump)
- `style:` - Code style changes (no version bump)
- `test:` - Test changes (no version bump)
- `chore:` - Maintenance tasks (no version bump)

## Example Flow

1. **Create feature branch from main:**
   ```bash
   git checkout -b feature/add-user-auth
   ```

2. **Make commits:**
   ```bash
   git commit -m "feat: add user authentication"
   git commit -m "fix: resolve login error"
   ```

3. **Create release branch from main:**
   ```bash
   git checkout main
   git checkout -b release/v1.2.0
   ```

4. **Merge feature into release:**
   ```bash
   git merge feature/add-user-auth
   git push origin release/v1.2.0
   ```

5. **Automatic actions:**
   - Workflow triggers on push to `release/*`
   - Version updates from 1.1.0 to 1.2.0 (minor bump for feat)
   - CHANGELOG.md is updated
   - GitHub release is created
   - Changes committed back to repository

## No Manual Checks

This simplified setup:
- ❌ No linting checks
- ❌ No test runs
- ❌ No build validation
- ✅ Only semantic versioning
- ✅ Only changelog generation

## GitHub Actions

### 1. semantic-release.yml
- Triggers on push to `release/*` branches
- Updates version in package.json
- Creates GitHub releases

### 2. changelog.yml
- Triggers after semantic release completes
- Generates/updates CHANGELOG.md
- Commits changes back to repository