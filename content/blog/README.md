# Blog Content

This directory contains markdown files for blog posts displayed at `/blog`.

## Creating a New Post

1. Create a new `.md` file in this directory
2. Name it with a URL-friendly slug (e.g., `my-new-post.md`)
3. Add frontmatter at the top with required metadata
4. Write your content in Markdown

## Frontmatter Template

```yaml
---
title: "Your Post Title Here"
description: "A compelling description for SEO and previews (150-160 chars)"
date: "2026-01-20"
author: team
category: guides
tags: ["tag1", "tag2", "tag3"]
image: "/images/blog/your-image.jpg"
imageAlt: "Description of the image for accessibility"
featured: false
draft: false
---
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title (also used for SEO) |
| `description` | string | Brief description (150-160 characters ideal) |
| `date` | string | Publication date in YYYY-MM-DD format |
| `author` | string | Author key: `team` or `ai` |
| `category` | string | Category slug (see below) |
| `tags` | array | Array of relevant tags |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `image` | string | Featured image path |
| `imageAlt` | string | Alt text for featured image |
| `featured` | boolean | Show in featured posts section |
| `draft` | boolean | If true, post is hidden from listings |
| `updatedAt` | string | Last updated date |

## Available Categories

| Slug | Name | Description |
|------|------|-------------|
| `guides` | Guides | Step-by-step guides |
| `tutorials` | Tutorials | Technical tutorials |
| `analysis` | Analysis | Market analysis |
| `news` | News | Breaking news |
| `research` | Research | Data-driven insights |
| `defi` | DeFi | Decentralized finance |
| `bitcoin` | Bitcoin | Bitcoin-specific content |
| `ethereum` | Ethereum | Ethereum ecosystem |
| `altcoins` | Altcoins | Alternative cryptocurrencies |
| `trading` | Trading | Trading strategies |
| `security` | Security | Security best practices |

## Available Authors

| Key | Name | Description |
|-----|------|-------------|
| `team` | FCN Team | Main editorial team |
| `ai` | AI Research | AI-powered analysis |

## Markdown Features

Posts support full Markdown including:

- **Headers** (`#`, `##`, `###`)
- **Bold** and *italic* text
- `Code blocks` and inline code
- [Links](https://example.com)
- ![Images](/path/to/image.jpg)
- > Blockquotes
- Lists (ordered and unordered)
- Tables
- Horizontal rules

### Code Blocks

Use fenced code blocks with language hints:

\`\`\`javascript
const greeting = "Hello, crypto!";
console.log(greeting);
\`\`\`

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Directory Structure

```
content/
└── blog/
    ├── README.md           # This file
    ├── what-is-bitcoin.md
    ├── ethereum-explained.md
    ├── defi-explained.md
    └── ...
```

## Development

### Viewing Posts

- Blog index: http://localhost:3000/en/blog
- Individual post: http://localhost:3000/en/blog/{slug}
- RSS feed: http://localhost:3000/blog/feed.xml

### Admin Dashboard

Visit http://localhost:3000/admin/blog to:
- View all posts
- Filter by category
- See post statistics

### Testing Changes

Posts are loaded at build time and on server requests. For development:

1. Edit or create a `.md` file
2. Refresh the browser to see changes
3. Check the console for any parsing errors

## SEO Best Practices

1. **Title**: 50-60 characters, include target keyword
2. **Description**: 150-160 characters, compelling summary
3. **Images**: Always include alt text
4. **Headers**: Use logical hierarchy (H2, H3)
5. **Links**: Include internal links to other posts
6. **Tags**: 3-5 relevant tags per post

## Example Post

```markdown
---
title: "How to Stake Ethereum: Complete 2026 Guide"
description: "Learn how to stake ETH and earn rewards. Compare solo staking, pooled staking, and liquid staking options."
date: "2026-01-25"
author: team
category: ethereum
tags: ["ethereum", "staking", "passive-income", "defi"]
image: "/images/blog/eth-staking.jpg"
imageAlt: "Ethereum staking visualization"
featured: true
---

Ethereum staking lets you earn rewards by helping secure the network...

## What is Staking?

Staking involves locking up ETH to participate in...

## Staking Options

### 1. Solo Staking

Run your own validator with 32 ETH...

### 2. Pooled Staking

Join a staking pool with any amount...

## Conclusion

Staking is a great way to earn passive income on your ETH...
```
