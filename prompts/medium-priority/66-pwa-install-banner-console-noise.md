# 66 — Fix PWA Install Banner Repeated Console Noise

## Goal

Reduce the console spam from repeated `beforeinstallprompt` events:

```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

This message appears **35+ times** in a single session, once per client-side navigation. While the behavior is intentional (deferring the install prompt for a custom UX), the volume of console messages indicates the event listener is being re-registered on every navigation or re-render.

## Context

- **Component:** `src/components/PWAProvider.tsx`
- **Current behavior:** The `beforeinstallprompt` handler calls `e.preventDefault()` and stores the event in `deferredPromptRef` for later use with a custom install button
- **Problem:** The event listener is added inside a `useEffect` that likely fires on every navigation, or the component re-mounts frequently, causing duplicate listener registrations
- **Impact:** Low severity — no user-facing bug, but pollutes console output making real errors harder to spot during debugging

## Files to Investigate

| File | Role |
|------|------|
| `src/components/PWAProvider.tsx` | `beforeinstallprompt` handler and SW registration |
| `src/app/[locale]/layout.tsx` | Where PWAProvider is mounted |

## Task

### 1. Ensure the event listener is registered only once

In `PWAProvider.tsx`, verify the `useEffect` cleanup properly removes the listener and doesn't re-register on every render:

```typescript
useEffect(() => {
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    deferredPromptRef.current = e;
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}, []); // Empty deps — register once
```

Key checks:
- Is the dependency array empty `[]`?
- Is there a cleanup function that removes the listener?
- Is the handler function stable (not recreated each render)?

### 2. Guard against duplicate registration

Add a module-level flag to prevent multiple registrations if the component re-mounts:

```typescript
let listenerRegistered = false;

useEffect(() => {
  if (listenerRegistered) return;
  listenerRegistered = true;
  // ...
}, []);
```

### 3. Consider suppressing the console message

The browser's "Banner not shown" message cannot be suppressed directly, but reducing re-registrations to a single call will reduce it to one message per page load instead of 35+.

## Acceptance Criteria

- [ ] `beforeinstallprompt` listener registered exactly once per page lifecycle
- [ ] "Banner not shown" message appears at most once in console
- [ ] Custom PWA install prompt still works when triggered
- [ ] Service worker registration unaffected
