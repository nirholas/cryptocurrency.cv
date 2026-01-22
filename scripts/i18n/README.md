# 🌍 Internationalization (i18n) Scripts

Scripts for translating and validating multi-language content.

---

## Overview

These scripts handle automatic translation of the README and other documentation to 18 supported languages.

## Scripts

### translate.js

Translates source files to all supported languages using Google Cloud Translation API.

```bash
# Translate README to all languages
node scripts/i18n/translate.js

# Translate specific file
node scripts/i18n/translate.js --file README.md

# Translate to specific language
node scripts/i18n/translate.js --lang ja-JP
```

**Environment Variables:**
```bash
GOOGLE_CLOUD_API_KEY=your-api-key
```

### validate.js

Validates translated files for completeness and format.

```bash
# Validate all translations
node scripts/i18n/validate.js

# Validate specific language
node scripts/i18n/validate.js --lang zh-CN
```

**Checks:**
- File exists
- Markdown structure preserved
- Links are valid
- Code blocks unchanged
- Required sections present

---

## Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English | Source |
| `zh-CN` | Chinese (Simplified) | ✅ |
| `zh-TW` | Chinese (Traditional) | ✅ |
| `ja-JP` | Japanese | ✅ |
| `ko-KR` | Korean | ✅ |
| `es-ES` | Spanish | ✅ |
| `fr-FR` | French | ✅ |
| `de-DE` | German | ✅ |
| `pt-BR` | Portuguese (Brazil) | ✅ |
| `ru-RU` | Russian | ✅ |
| `ar` | Arabic | ✅ |
| `hi-IN` | Hindi | ✅ |
| `vi-VN` | Vietnamese | ✅ |
| `th-TH` | Thai | ✅ |
| `id-ID` | Indonesian | ✅ |
| `tr-TR` | Turkish | ✅ |
| `nl-NL` | Dutch | ✅ |
| `pl-PL` | Polish | ✅ |

---

## Output Structure

Translations are saved to:

```
locales/
├── README/
│   ├── index.zh-CN.md
│   ├── index.ja-JP.md
│   ├── index.ko-KR.md
│   └── ...
└── docs/
    └── API/
        ├── index.zh-CN.md
        └── ...
```

---

## Adding New Languages

1. Add language config to `translate.js`:
   ```javascript
   const LANGUAGES = {
     // ...existing
     'new-code': { name: 'Language Name', google: 'xx' }
   };
   ```

2. Run translation:
   ```bash
   node scripts/i18n/translate.js --lang new-code
   ```

3. Validate output:
   ```bash
   node scripts/i18n/validate.js --lang new-code
   ```

4. Add to README language selector

---

## Translation Quality

- Machine translation via Google Cloud
- Code blocks and technical terms preserved
- Manual review recommended for accuracy
- Contributions welcome via PR
