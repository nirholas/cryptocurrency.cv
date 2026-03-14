# 63 — Fix PWA Install Banner Suppression

## Goal

Fix the console warning: `Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.` The PWA install prompt is captured and deferred but may never be presented to the user, wasting a key engagement opportunity.

## Context

- **Framework:** Next.js with App Router
- **PWA setup:** `src/components/PWAProvider.tsx` — registers service worker, captures `beforeinstallprompt` event
- **Manifest:** `public/manifest.json` — fully configured with icons, shortcuts, screenshots
- **Service Worker:** `public/sw.js` — caching strategies for static, API, and image resources

### Current Implementation (PWAProvider.tsx ~lines 184-193)

```typescript
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  deferredPromptRef.current = e;
};
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
```

The deferred prompt is stored in a ref but may never be triggered via `.prompt()`.

### Console Warning

```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

## Task

### Step 1: Audit the PWAProvider

1. **Read** `src/components/PWAProvider.tsx` in full
2. **Check** if there is any UI that calls `deferredPromptRef.current.prompt()` — e.g., an install button, banner, or modal
3. **Check** if the deferred prompt is exposed via React context so child components can trigger it

### Step 2: Implement an Install Prompt Trigger

If no UI exists to trigger the install prompt, add one. Common patterns:

**Option A: Smart Install Banner**
- Show a dismissible banner after the user has visited 2+ pages or spent 30+ seconds
- Banner says "Install cryptocurrency.cv for offline access" with an Install button
- On click, call `deferredPromptRef.current.prompt()`
- On dismiss, set a localStorage flag to not show again for 30 days

**Option B: Install Button in Settings/More**
- Add an "Install App" button to the settings page or the `/more` page
- Only show when `deferredPromptRef.current` is available (PWA install is possible)
- On click, call `.prompt()` and handle the result

**Option C: Both**
- Smart banner for first-time visitors + persistent install option in settings

### Step 3: Handle the Prompt Result

After calling `.prompt()`, handle the user's choice:

```typescript
const result = await deferredPromptRef.current.prompt();
if (result.outcome === 'accepted') {
  // Track install event (analytics)
  deferredPromptRef.current = null;
} else {
  // User dismissed — don't show again for a while
}
```

### Step 4: Verify

1. Test on Chrome/Edge (desktop and mobile) — these are the primary browsers that support `beforeinstallprompt`
2. Verify the install banner/button appears
3. Verify clicking Install triggers the native PWA install dialog
4. Verify dismissing respects the cooldown
5. Verify the console warning is gone

## Files to Examine

- `src/components/PWAProvider.tsx` — main PWA provider with deferred prompt logic
- `public/manifest.json` — PWA manifest
- `public/sw.js` — service worker
- `src/app/[locale]/layout.tsx` — where PWAProvider is mounted

## Acceptance Criteria

- [ ] Console warning `Banner not shown: beforeinstallpromptevent.preventDefault()...` resolved
- [ ] Users have a way to trigger the PWA install prompt (banner, button, or both)
- [ ] Install prompt only shows when the browser supports it (`beforeinstallprompt` event fired)
- [ ] Prompt dismissal is remembered (localStorage) with a reasonable cooldown
- [ ] Install flow works end-to-end: banner → click → native dialog → app installed
