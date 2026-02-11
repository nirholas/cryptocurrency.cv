# free-crypto-news Development Guidelines

> Free crypto news API - real-time aggregator for Bitcoin, Ethereum, DeFi, Solana & altcoins. No API key required. RSS/Atom feeds, JSON REST API, historical archive with market context, embeddable widgets, ChatGPT plugin, Claude MCP server, SDKs (Python, TypeScript, Go, React, PHP). AI/LLM ready. Vibe coding friendly. Open source.

## Project Overview

free-crypto-news is built with TypeScript. See the README for full documentation.

### Terminal Management

- **Always use background terminals** (`isBackground: true`) for every command so a terminal ID is returned
- **Always kill the terminal** after the command completes, whether it succeeds or fails — never leave terminals open
- Do not reuse foreground shell sessions — stale sessions block future terminal operations in Codespaces
- In GitHub Codespaces, agent-spawned terminals may be hidden — they still work. Do not assume a terminal is broken if you cannot see it
- If a terminal appears unresponsive, kill it and create a new one rather than retrying in the same terminal

## Contributing

- Follow the existing code style
- Test changes before submitting PRs
- Update documentation when adding features
- See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines
