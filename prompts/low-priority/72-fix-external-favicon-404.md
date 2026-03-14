# 72 — Fix External Favicon 404 Errors

## Goal

Fix the 404 errors for external favicon proxying via Google's favicon service (`t2.gstatic.com/faviconV2`). At least one news source favicon (blog.bittensor.com) returns 404, causing broken favicons in the UI.

## Context

- **Favicon service:** Google's favicon proxy at `t2.gstatic.com/faviconV2`
- **Affected source:** `blog.bittensor.com` (and possibly others)

### Console Error

```
GET https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL
&url=http://blog.bittensor.com&size=32 404 (Not Found)
```

### Root Cause

Google's favicon proxy can't find a favicon for `blog.bittensor.com`. This could mean:
1. The site has no favicon
2. The site blocks Google's crawler
3. The URL scheme is wrong (`http://` vs `https://`)
4. The domain has changed

## Task

### Step 1: Find Favicon Rendering Code

Search for where source favicons are rendered. Look for:
- `gstatic.com/faviconV2` references
- A favicon utility or component
- `<img>` tags with favicon URLs

### Step 2: Add Fallback Favicon

When the Google favicon proxy returns 404, show a fallback:

```tsx
<img
  src={faviconUrl}
  onError={(e) => { e.currentTarget.src = '/icons/default-source.svg'; }}
  alt=""
/>
```

### Step 3: Consider Self-Hosting Favicons

Instead of relying on Google's proxy, download and self-host favicons for known news sources:
- Store in `public/favicons/{source}.png`
- Fall back to Google proxy only for unknown sources
- Add a build script to refresh favicons periodically

### Step 4: Fix Specific Broken Sources

For `blog.bittensor.com`:
- Check if the URL should be `https://` instead of `http://`
- Verify the domain is still active
- Update the source URL in the sources configuration

## Files to Inspect

- Search for `gstatic` or `faviconV2` in `src/`
- `src/components/NewsCard.tsx` or similar — news source display
- Source configuration files — `src/lib/sources.ts` or `data/sources.json`

## Acceptance Criteria

- [ ] No 404 errors for favicon loading in the console
- [ ] Broken favicons show a sensible fallback image
- [ ] Source URL for bittensor.com is correct
