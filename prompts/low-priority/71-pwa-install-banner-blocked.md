# 71 — Fix PWA Install Banner Blocked Warning

## Goal

Resolve the browser warning about the PWA install banner being blocked because `preventDefault()` was called on the `beforeinstallprompt` event without later calling `prompt()`.

## Context

- **Component:** `src/components/PWAProvider.tsx` (lines 183-187)
- **Browser:** Chrome/Chromium
- **Impact:** Low — cosmetic console warning, but indicates the PWA install flow is incomplete

### Browser Console Warning

```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

### Current Code

```typescript
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault(); // Prevents automatic banner
  deferredPromptRef.current = e; // Stores for later use
};
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
```

The code correctly defers the prompt for later use via `promptInstall()`, but Chrome logs a warning when `preventDefault()` is called and `prompt()` is never subsequently invoked during the page visit.

## Task

### Option A: Show Install Prompt UI (Recommended)

Instead of silently deferring, expose a visible "Install App" button or banner when the prompt is available:

```typescript
const [installReady, setInstallReady] = useState(false);

const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  deferredPromptRef.current = e;
  setInstallReady(true); // Signal UI to show install button
};
```

Then in the component tree, conditionally render an install prompt:

```tsx
{installReady && <InstallBanner onInstall={promptInstall} onDismiss={() => setInstallReady(false)} />}
```

### Option B: Don't Prevent Default (Let Browser Handle It)

If you don't need custom install UI, remove the `preventDefault()` call and let the browser show its native install banner:

```typescript
const handleBeforeInstallPrompt = (e: Event) => {
  // Don't prevent default — let browser show its own banner
  deferredPromptRef.current = e;
};
```

### Option C: Suppress the Warning (Minimal Fix)

The warning is harmless if the user can trigger install elsewhere (e.g., via a menu item). To suppress:
- Store the prompt but only call `preventDefault()` if you have visible install UI ready
- Or simply remove `e.preventDefault()` if no custom install flow is active

## Files to Modify

- `src/components/PWAProvider.tsx` — update `beforeinstallprompt` handler

## Acceptance Criteria

- [ ] No "Banner not shown" warning in browser console
- [ ] PWA install prompt still works (either native or custom)
- [ ] If custom install UI: visible install button/banner appears when eligible
- [ ] Install flow completes successfully on Chrome/Edge
