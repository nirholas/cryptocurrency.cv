# Contributing to Free Crypto News API

First off, thank you for considering contributing to Free Crypto News API! 🎉

It's people like you that make this project such a great tool for the crypto community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (curl commands, code snippets)
- **Describe the behavior you observed and what you expected**
- **Include your environment** (OS, Node.js version, etc.)

### 💡 Suggesting Features

Feature suggestions are welcome! Please:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested feature
- **Explain why this feature would be useful** to most users
- **List any alternatives you've considered**

### 🔧 Code Contributions

We love pull requests! Here are some ideas:

- **New news sources** - Add more crypto news outlets
- **SDK improvements** - Enhance existing SDKs or add new ones
- **Documentation** - Improve docs, add examples, fix typos
- **Bug fixes** - Fix reported issues
- **New endpoints** - Add useful API endpoints
- **Performance** - Optimize caching, reduce response times
- **Translations** - Help translate to new languages

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/free-crypto-news.git
cd free-crypto-news

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

### Project Structure

```
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components
│   └── lib/           # Utilities and helpers
├── sdk/               # Language SDKs
├── mcp/               # Model Context Protocol server
├── scripts/           # Build and archive scripts
└── docs/              # Documentation
```

## 💻 Development Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our style guidelines

3. **Test your changes** locally:
   ```bash
   npm run build
   npm run lint
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add new endpoint for market data"
   # or
   git commit -m "fix: resolve caching issue in /api/news"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Code style (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Verify changelog coverage**:
   ```bash
   # Check if your changes are documented
   node scripts/analyze-commits.js --check --since=HEAD~5
   ```

6. **Push to your fork** and open a PR

## 🔄 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Update CHANGELOG.md** for significant changes:
   ```bash
   # See what entries might be missing
   node scripts/analyze-commits.js
   
   # Auto-add missing entries (review before committing)
   node scripts/analyze-commits.js --update
   ```
3. **Add tests** for new features if applicable
4. **Ensure CI passes** - the build must succeed
5. **Request review** from maintainers
6. **Address feedback** promptly and constructively

### PR Title Format

```
feat: Add whale transaction tracking endpoint
fix: Resolve memory leak in RSS parser
docs: Add Python SDK examples
```

## 📝 Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new code when possible
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

### API Endpoints

- Follow RESTful conventions
- Return consistent response formats
- Include proper error handling
- Add response caching where appropriate

### Documentation

- Use clear, concise language
- Include code examples
- Keep README sections up to date

## ❓ Questions?

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Reach out to maintainers

## 🙏 Recognition

Contributors will be:
- Listed in our README
- Credited in release notes
- Forever appreciated by the community! 💜

---

**Thank you for contributing!** Every contribution, no matter how small, helps make this project better for everyone. 🚀

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
