# Free Crypto News Alfred Workflow

Get crypto news directly in Alfred.

## Installation

1. Download `Free-Crypto-News.alfredworkflow`
2. Double-click to install in Alfred
3. Use the `cn` keyword

## Commands

| Keyword | Description |
|---------|-------------|
| `cn` | Latest crypto news |
| `cn breaking` | Breaking news (< 2 hours) |
| `cn bitcoin` | Bitcoin-specific news |
| `cn defi` | DeFi-specific news |
| `cn search [query]` | Search for topics |
| `cn trending` | Trending topics |

## Examples

```
cn                    # Latest news
cn breaking           # Breaking news
cn bitcoin            # Bitcoin news
cn search ethereum    # Search for ethereum
cn trending           # Trending topics
```

## Actions

- **Enter** - Open article in browser
- **Cmd+C** - Copy article link
- **Cmd+Enter** - Open on Free Crypto News site

## Requirements

- Alfred 4 or later
- Powerpack license (for workflows)

## Building from Source

1. Clone the repository
2. Navigate to `alfred/` directory
3. Create workflow:
   ```bash
   zip -r Free-Crypto-News.alfredworkflow *
   ```

## Privacy

- Only fetches from `cryptocurrency.cv`
- No tracking, no data collection
- Open source

## License

MIT
