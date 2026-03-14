# 69 — Fix PWA Install Banner Not Shown

## Goal

Fix the PWA install banner that is never displayed to users. The browser console shows repeated `Banner not shown: beforeinstallpromptevent.preventDefault() called` warnings (29+ times), indicating the app correctly captures the install prompt but never triggers it.

## Context

- **Framework:** Next.js 16 PWA with service worker
- **PWA Provider:** `src/components/PWAProvider.tsx`
- **Behavior:** The `beforeinstallprompt` event is captured and stored via `preventDefault()`, but the deferred prompt is never shown to the user

### Console Warning (appears 29+ times)

```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

### Current Implementation

```typescript
// src/components/PWAProvider.tsx
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();                    // ← Correctly captures prompt
  deferredPromptRef.current = e;         // ← Stores for later use
};
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
```

The `promptInstall()` method exists in the PWA context but is apparently never called by any UI component, or the conditions to show it are never met.

### Root Cause

The deferred prompt pattern requires:
1. Capture `beforeinstallprompt` with `preventDefault()` ✅ (done)
2. Store the event ✅ (done)
3. Show a custom install UI to the user ❓ (may be missing or hidden)
4. Call `deferredPromptRef.current.prompt()` on user action ❓

## Task

### Step 1: Find Install UI Components

Search for components that call `promptInstall()` or render an install button:
- Check if there's an `InstallBanner`, `InstallPrompt`, or similar component
- Check if the settings page has an install option
- Verify the `canInstall` state is being used in any UI

### Step 2: Add Install Prompt UI

If no install UI exists, add one. Options:
- **Smart banner:** A dismissible banner at top/bottom of page that appears after 2+ visits
- **Settings page option:** An "Install App" button in the settings/more page
- **Custom prompt:** A modal that appears on first visit after 30s

### Step 3: Handle Multiple `beforeinstallprompt` Events

The 29+ repeated warnings suggest the event fires many times. This could be caused by:
- Component re-mounting (PWAProvider in a layout that re-renders)
- Multiple event listener registrations
- Ensure the listener is registered only once with proper cleanup

### Step 4: Research Best Practices

Follow Chrome's recommended PWA install pattern:
- Show install UI only when `canInstall` is true
- Dismiss after user declines (don't show again for 30 days)
- Track install analytics

## Files to Inspect

- `src/components/PWAProvider.tsx` (lines 180-250)
- Search for `promptInstall`, `canInstall`, `InstallBanner`, `install` in `src/components/`
- `src/app/[locale]/settings/page.tsx` — check for install option

## Acceptance Criteria

- [ ] Users see a non-intrusive install prompt on eligible devices
- [ ] Install prompt appears after reasonable engagement (not immediately)
- [ ] `beforeinstallprompt` warning count is reduced to 1 (single capture)
- [ ] Install flow works end-to-end (prompt → accept → installed)
- [ ] Dismissed prompts are remembered (localStorage)
