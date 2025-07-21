# GitHub Actions Setup Guide

This repository includes comprehensive GitHub Actions workflows for CI/CD, security, and deployment automation.

## 🚀 Quick Setup

### 1. Connect to GitHub (if not already connected)
1. Click **GitHub → Connect to GitHub** in Lovable
2. Authorize the Lovable GitHub App
3. Select your GitHub account/organization
4. Click **Create Repository** to sync your code

### 2. Required Secrets
Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

```bash
SNYK_TOKEN=your_snyk_token_here
```

Get your Snyk token at: https://app.snyk.io/account

### 3. Environment Setup
Create these environments in your repository (`Settings > Environments`):

- **`production-approval`** - Requires manual approval for production deployments
- **`production`** - Production environment 
- **`staging`** - Staging environment
- **`production-rollback`** - Emergency rollback environment

### 4. Branch Protection Rules
Run the branch protection workflow to automatically set up rules:

```bash
# Go to Actions tab > Branch Protection Rules > Run workflow
# Select "setup-protection" action
```

## 📋 Workflow Overview

### 🧪 CI Pipeline (`.github/workflows/ci.yml`)
**Triggers:** Push to main/dev, Pull Requests to main

**Features:**
- ✅ Tests with coverage reporting
- 🚫 **Blocks merges if coverage < 80%**
- 🔍 Lint and type checking
- 📊 Coverage comments on PRs
- 🏗️ Build verification

**Required Status Checks:**
- `CI Pipeline / Tests & Coverage Check`
- `CI Pipeline / Coverage Gate`

### 🔒 Security Audit (`.github/workflows/security-audit.yml`)
**Triggers:** Push to main/develop, Pull Requests to main, Weekly schedule

**Features:**
- 🛡️ **Snyk security scanning on every PR**
- 🔍 **audit-ci vulnerability checks on every PR**
- 📊 CodeQL static analysis
- 🧰 OWASP ZAP security testing
- 📄 Comprehensive security reports
- 💬 PR comments with security status

**Required Status Checks:**
- `Security Audit & PR Checks / Security Gate`
- `Security Audit & PR Checks / PR Security Checks`

### 🚀 Deployment (`.github/workflows/deployment.yml`)
**Triggers:** Push to main, Manual workflow dispatch

**Features:**
- 🔒 **Manual approval required for production**
- ✅ Pre-deployment validation (tests, coverage, security)
- 🚧 Automatic staging deployments
- 🏥 Post-deployment health checks
- 🔄 Emergency rollback capability
- 🏷️ Automatic version tagging

**Environments:**
- **Staging:** Automatic deployment from main branch
- **Production:** Requires manual approval via `production-approval` environment

### 🛡️ Branch Protection (`.github/workflows/branch-protection.yml`)
**Triggers:** Manual workflow dispatch

**Features:**
- 🔐 Automated branch protection setup
- 👥 Required pull request reviews (2 reviewers)
- ✅ Required status checks enforcement
- 🔒 Admin enforcement
- 🚫 Force push protection

## 🚫 Merge Blocking Rules

Your main branch is protected by these automatic blocking rules:

### 1. Test Coverage < 80%
```bash
❌ Coverage 75% is below the required 80% threshold
```
- **Solution:** Add more tests to increase coverage
- **Check:** View coverage report in PR comments

### 2. Security Vulnerabilities
```bash
❌ Snyk found 3 high severity vulnerabilities
❌ audit-ci found 1 moderate vulnerability
```
- **Solution:** Fix vulnerabilities or update dependencies
- **Check:** View security reports in workflow artifacts

### 3. Failed Tests
```bash
❌ 2 tests failed
```
- **Solution:** Fix failing tests
- **Check:** View test results in workflow logs

### 4. Missing Required Reviews
```bash
❌ 2 required reviewers have not approved
```
- **Solution:** Get required approvals from team members
- **Check:** Request reviews from code owners

## 📊 Coverage Requirements

| Metric | Minimum | Current | Status |
|--------|---------|---------|---------|
| Lines | 80% | 85% | ✅ |
| Functions | 80% | 90% | ✅ |
| Branches | 80% | 75% | ❌ |
| Statements | 80% | 88% | ✅ |
| **Overall** | **80%** | **82%** | **✅** |

## 🔧 Troubleshooting

### Coverage Issues
```bash
# Run coverage locally
npm test -- --coverage

# Check coverage report
open coverage/lcov-report/index.html
```

### Security Issues
```bash
# Check for vulnerabilities
npm audit
npx audit-ci --moderate

# Fix vulnerabilities
npm audit fix
```

### Branch Protection Issues
```bash
# View current protection rules
# Go to Actions > Branch Protection Rules > Run workflow > "view-protection"

# Update protection rules
# Go to Actions > Branch Protection Rules > Run workflow > "setup-protection"
```

## 🎯 Best Practices

### Pull Request Workflow
1. 🌱 Create feature branch from `main`
2. 👨‍💻 Make changes with tests
3. 🔄 Push and create PR
4. ✅ Wait for all checks to pass
5. 👥 Get required reviews
6. 🎉 Merge when all requirements met

### Security Best Practices
- 🔒 Never commit secrets to code
- 📦 Keep dependencies updated
- 🧪 Run security scans locally before pushing
- 🔍 Review security reports regularly

### Deployment Best Practices
- 🧪 Test thoroughly in staging first
- 📊 Ensure 80%+ test coverage
- 🔒 Get required approvals for production
- 📈 Monitor post-deployment metrics
- 🔄 Have rollback plan ready

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Snyk Security Platform](https://snyk.io/)
- [OWASP Security Guide](https://owasp.org/)
- [Lovable Documentation](https://docs.lovable.dev/)

## 🆘 Support

If you encounter issues:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Check repository settings (secrets, environments, protection rules)
4. Contact your development team