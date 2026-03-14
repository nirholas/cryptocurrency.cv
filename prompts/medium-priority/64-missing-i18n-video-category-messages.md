# 64 — Fix Missing i18n Video Category Messages

## Goal

Fix the missing translation errors that appear on the videos page:

```
E: MISSING_MESSAGE: videos.category.all (en)
E: MISSING_MESSAGE: videos.category.news (en)
E: MISSING_MESSAGE: videos.category.education (en)
E: MISSING_MESSAGE: videos.category.analysis (en)
E: MISSING_MESSAGE: videos.category.interviews (en)
E: MISSING_MESSAGE: videos.category.defi (en)
```

## Context

- **Framework:** Next.js 16 with `next-intl` for internationalization
- **Locale files:** `messages/en.json` (and 82 other locales)
- **The keys exist in en.json** (lines ~880-889):
  ```json
  "videos": {
    "title": "Crypto Video News & Analysis",
    "subtitle": "...",
    "category.all": "All",
    "category.news": "News",
    "category.education": "Education",
    "category.analysis": "Analysis",
    "category.interviews": "Interviews",
    "category.defi": "DeFi"
  }
  ```
- **Root cause:** The keys use **dot notation inside a flat namespace** (`"category.all"` inside `"videos"`), but the component likely accesses them as **nested keys** (`videos.category.all`). `next-intl` treats dots in key names literally when they're flat, but the `useTranslations('videos')` + `t('category.all')` pattern should work. The issue may be:
  1. The component uses `t('category.all')` but the messages file has it as a nested `category: { all: "..." }` structure (or vice versa)
  2. The messages aren't loaded properly for the videos page
  3. The component is rendered on the client before messages are hydrated

## Files to Investigate

| File | Role |
|------|------|
| `messages/en.json` | English locale — verify exact key structure |
| Components rendering video categories | Search for `useTranslations('videos')` or `t('category.` |
| `src/app/[locale]/videos/page.tsx` | Videos page (if it exists) |
| `src/components/` | Video-related components |
| `i18n.ts` or `src/i18n/` | next-intl configuration |

## Task

### 1. Verify the key format matches usage

Check how the video component accesses these translations:
```bash
grep -rn "category\.all\|category\.news\|category\.education\|category\.analysis\|category\.interviews\|category\.defi" src/
```

If the component uses `t('category.all')` with `useTranslations('videos')`, the message file should have:
```json
"videos": {
  "category": {
    "all": "All",
    "news": "News",
    ...
  }
}
```

NOT:
```json
"videos": {
  "category.all": "All",
  ...
}
```

### 2. Fix the key structure

Convert flat dot-notation keys to nested objects in `messages/en.json`:
```json
"videos": {
  "title": "Crypto Video News & Analysis",
  "subtitle": "...",
  "category": {
    "all": "All",
    "news": "News",
    "education": "Education",
    "analysis": "Analysis",
    "interviews": "Interviews",
    "defi": "DeFi"
  }
}
```

### 3. Update all locale files

The same fix must be applied to all 82 other locale files in `messages/`. Consider a script:
```bash
# For each locale file, restructure the videos.category keys
```

### 4. Verify the fix

After updating:
- Navigate to the videos page
- Confirm category filter buttons show translated labels instead of MISSING_MESSAGE errors
- Check the browser console for any remaining i18n errors

## Acceptance Criteria

- [ ] No `MISSING_MESSAGE: videos.category.*` errors in browser console
- [ ] Video category filter buttons display correct labels in all locales
- [ ] Key structure in `messages/*.json` files is consistent with how `next-intl` resolves them
- [ ] All 83 locale files updated
