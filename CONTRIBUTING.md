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
- **Include your environment** (OS, Node.js version, pnpm version, browser). We target Node 22.

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

- **Node.js 22** (the version in `.nvmrc` and the devcontainer image). `package.json` accepts `>=22 <25`.
- **pnpm 10**. This repo is pnpm-only and pins `packageManager: pnpm@10.32.1`. `npm install` and `yarn install` will fight the lockfile. Enable it with `corepack enable`.
- **Bun** (optional), used to run scripts and executables (`bun run dev`, `bunx tsc`). Every command below also works with plain `pnpm`.

### Local Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/cryptocurrency.cv.git
cd cryptocurrency.cv

# 3. Install dependencies (pnpm only)
corepack enable
pnpm install

# 4. Create a local env file
cp .env.example .env.local

# 5. Start the dev server
pnpm dev

# 6. Open http://localhost:3000
```

**You do not need any API keys to run the site.** Every news, market, and archive
endpoint works keyless against the public upstreams. Only the AI endpoints
(`/api/ask`, summarisation, sentiment, translation) need `GROQ_API_KEY`, which is
free from https://console.groq.com/keys. Leave it blank and the AI routes return a
clear "not configured" response instead of crashing.

If you use VS Code or GitHub Codespaces, `.devcontainer/devcontainer.json` runs
steps 3 and 4 for you on create.

### Project Structure

```
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── [locale]/  # Localised pages (100+ locales via next-intl)
│   │   ├── api/       # Route handlers: the public REST API
│   │   ├── api-reference/  # Swagger UI for the OpenAPI spec
│   │   ├── blog/      # MDX blog
│   │   └── embed/     # Chrome-less widget routes for iframes
│   ├── components/    # React components
│   ├── lib/           # Business logic: aggregation, market data, alerts, db
│   ├── hooks/         # Client React hooks
│   ├── i18n/          # next-intl routing and navigation helpers
│   ├── middleware/    # Locale, redirect, and bot-detection middleware
│   ├── data/          # Static datasets (sources, taxonomies)
│   ├── types/         # Shared TypeScript types
│   └── __tests__/     # Vitest suites that span modules
├── e2e/               # Playwright specs (a11y, console errors, UI audit)
├── messages/          # Translated UI strings, one JSON file per locale
├── locales/           # Locale metadata and translation tooling config
├── content/           # MDX blog posts and long-form content
├── docs/              # MkDocs site: API reference, tutorials, guides
├── scripts/           # Build, archive, i18n, db, and audit scripts
├── sdk/               # Language SDKs (TypeScript, Python, Go, PHP, React, …)
├── mcp/               # Model Context Protocol server
├── cli/               # Command line client
├── widget/            # Embeddable JS widget bundle
├── extension/         # Browser extension
├── mobile/            # Mobile app shell
├── examples/          # Runnable integration examples
├── infra/             # Deployment manifests and observability config
└── contracts/         # x402 payment contracts
```

## 💻 Development Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our style guidelines

3. **Run the checks CI gates on**, in this order:
   ```bash
   pnpm typecheck   # tsc --noEmit (also regenerates the translated-locale list)
   pnpm lint        # eslint over src/
   pnpm test:run    # vitest, single run
   pnpm build       # next build, the slowest gate: run it last
   ```

   A pull request that fails any of these will not be merged. `pnpm quality-gate`
   runs the same set plus formatting, coverage, and secret scanning if you want
   one command.

   Useful while iterating:
   ```bash
   pnpm test              # vitest in watch mode
   pnpm test:coverage     # coverage report
   pnpm format            # prettier --write over src/
   pnpm test:e2e          # Playwright, needs a running dev server
   pnpm test:errors       # console-error sweep, needs a running dev server
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

### Test Coverage Ratchet

This project uses a coverage ratchet — test coverage thresholds automatically increase
as you add tests and can never decrease. If your PR reduces coverage, the quality gate
will fail.

- Check current thresholds: see `vitest.config.ts` → `coverage.thresholds`
- After adding tests: run `pnpm coverage:ratchet` to update thresholds
- The pre-push hook automatically verifies coverage hasn't dropped via the quality gate

### Database Changes

If your PR modifies `src/lib/db/schema.ts`:

1. Run `pnpm db:generate` to create a migration file
2. Review the generated SQL in `src/lib/db/migrations/`
3. Include the migration file in your PR
4. Test the migration locally with `pnpm db:migrate`
5. Note any data migration needs in the PR description

See [docs/DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md) for the full workflow.

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

## License

This repository is source-available (all rights reserved; see [LICENSE](LICENSE)). The hosted API at https://cryptocurrency.cv is free to use. By opening a pull request you agree that your contribution is accepted under the repository license.
