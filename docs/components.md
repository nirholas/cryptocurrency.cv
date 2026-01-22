# UI Components Documentation

This document covers the internal React components used in the Free Crypto News web application.

## Table of Contents

- [Navigation Components](#navigation-components)
  - [Header](#header)
  - [MobileNav](#mobilenav)
  - [CategoryNav](#categorynav)
  - [Breadcrumbs](#breadcrumbs)
- [Search & Commands](#search--commands)
  - [SearchModal](#searchmodal)
  - [CommandPalette](#commandpalette)
- [Links & Prefetching](#links--prefetching)
  - [PrefetchLink](#prefetchlink)
  - [NavLink](#navlink)
  - [CardLink](#cardlink)
- [Breaking News](#breaking-news)
  - [BreakingNewsTicker](#breakingnewsticker)
- [Feedback & Notifications](#feedback--notifications)
  - [Toast](#toast)
  - [EmptyState](#emptystate)
  - [ErrorBoundary](#errorboundary)
- [Accessibility & UX](#accessibility--ux)
  - [BackToTop](#backtotop)
  - [ScrollRestoration](#scrollrestoration)
  - [FocusManagement](#focusmanagement)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Navigation Components

### Header

**File:** `src/components/Header.tsx`

The main site header with mega menu navigation, search, and theme toggle.

#### Features

- **Sticky header** with scroll-based shrinking (80px → 64px)
- **Mega menu** on hover with staggered animations
- **Keyboard shortcuts** for search (⌘K) and command palette (⌘⇧P)
- **Skip link** for accessibility
- **Dark mode** support

#### Usage

```tsx
import Header from '@/components/Header';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
    </>
  );
}
```

---

### MobileNav

**File:** `src/components/MobileNav.tsx`

Full-screen mobile navigation drawer with collapsible sections.

#### Features

- **Full-screen drawer** sliding from right
- **Collapsible sections** for Categories and Resources
- **Focus trap** for accessibility
- **Body scroll lock** when open
- **Animated hamburger** icon

#### Usage

```tsx
// Typically used internally by Header
import { MobileNav } from '@/components/MobileNav';

<MobileNav />
```

---

### CategoryNav

**File:** `src/components/CategoryNav.tsx`

Horizontal scrolling category filter pills.

#### Features

- **Scroll fade indicators** showing more content
- **Auto-scroll** to active category
- **Color-coded pills** per category
- **Sticky positioning** below header

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeCategory` | `string` | `undefined` | Currently selected category slug |

#### Usage

```tsx
import CategoryNav from '@/components/CategoryNav';

<CategoryNav activeCategory="bitcoin" />
```

---

### Breadcrumbs

**File:** `src/components/Breadcrumbs.tsx`

Auto-generated breadcrumb navigation with Schema.org markup.

#### Features

- **Auto-generates** from current URL path
- **Schema.org** BreadcrumbList markup for SEO
- **Custom labels** mapping support
- **Home icon** option
- **Compact variant** for mobile (back link only)

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | Auto-generated | Override automatic breadcrumbs |
| `customLabels` | `Record<string, string>` | `{}` | Map path segments to labels |
| `showHomeIcon` | `boolean` | `true` | Show home icon vs "Home" text |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```tsx
import { Breadcrumbs, BreadcrumbsCompact } from '@/components/Breadcrumbs';

// Auto-generated from URL
<Breadcrumbs />

// With custom labels
<Breadcrumbs customLabels={{ 'btc': 'Bitcoin' }} />

// Manual items
<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Markets', href: '/markets' },
  { label: 'Bitcoin', href: '/markets/bitcoin' },
]} />

// Compact "Back to X" for mobile
<BreadcrumbsCompact />
```

---

## Search & Commands

### SearchModal

**File:** `src/components/SearchModal.tsx`

Full-screen search overlay with live results.

#### Features

- **Live search** with 300ms debounce
- **Keyboard navigation** (↑↓ arrows, Enter, Tab)
- **Recent searches** stored in localStorage
- **Popular/trending** searches
- **Quick actions** grid
- **Tab switching** (All / Articles / Actions)

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Controls modal visibility |
| `onClose` | `() => void` | ✓ | Callback when modal closes |

#### Usage

```tsx
import { SearchModal } from '@/components/SearchModal';

const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>Search</button>
<SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

#### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate results |
| `Enter` | Select result / Search |
| `Tab` | Switch tabs |
| `Escape` | Close modal |

---

### CommandPalette

**File:** `src/components/CommandPalette.tsx`

VS Code-style command palette for power users.

#### Features

- **Fuzzy search** through commands
- **Categorized commands** (Navigation, Search, Actions, Settings)
- **Keyboard navigation** with selection highlighting
- **Quick actions** like theme toggle, share page

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Controls palette visibility |
| `onClose` | `() => void` | ✓ | Callback when palette closes |

#### Usage

```tsx
import { CommandPalette } from '@/components/CommandPalette';

const [isOpen, setIsOpen] = useState(false);

// Typically triggered by ⌘+Shift+P
<CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

#### Available Commands

| Category | Commands |
|----------|----------|
| Navigation | Home, Markets, DeFi, Trending, Sources, Topics, Bookmarks |
| Search | Search Articles, Search by Topic, Search by Source |
| Actions | Toggle Theme, Share Page, Copy URL |
| Settings | Keyboard Shortcuts, Notifications |

---

## Links & Prefetching

### PrefetchLink

**File:** `src/components/LinkPrefetch.tsx`

Enhanced Next.js Link with hover prefetching.

#### Features

- **Configurable delay** before prefetch starts
- **Optional loading indicator** on click
- **Focus/blur support** for keyboard users

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string \| UrlObject` | Required | Link destination |
| `prefetchDelay` | `number` | `100` | Delay in ms before prefetching |
| `showLoadingOnClick` | `boolean` | `false` | Show loading state on click |
| `children` | `ReactNode` | Required | Link content |

#### Usage

```tsx
import { PrefetchLink } from '@/components/LinkPrefetch';

<PrefetchLink href="/markets" prefetchDelay={150}>
  View Markets
</PrefetchLink>
```

---

### NavLink

**File:** `src/components/LinkPrefetch.tsx`

Navigation link with active state styling and prefetch.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | Required | Link destination |
| `activePath` | `string` | `undefined` | Current path for active state |
| `activeClassName` | `string` | Brand styling | Classes when active |
| `inactiveClassName` | `string` | Gray styling | Classes when inactive |

#### Usage

```tsx
import { NavLink } from '@/components/LinkPrefetch';

<NavLink 
  href="/markets" 
  activePath={pathname}
  activeClassName="text-brand-600 bg-brand-50"
>
  Markets
</NavLink>
```

---

### CardLink

**File:** `src/components/LinkPrefetch.tsx`

Card wrapper link with hover lift effect.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | Required | Link destination |
| `external` | `boolean` | `false` | Opens in new tab if true |

#### Usage

```tsx
import { CardLink } from '@/components/LinkPrefetch';

<CardLink href="/article/123">
  <ArticleCard article={article} />
</CardLink>

<CardLink href="https://example.com" external>
  External Link
</CardLink>
```

---

## Breaking News

### BreakingNewsTicker

**File:** `src/components/BreakingNewsTicker.tsx`

Animated breaking news banner with auto-rotation.

#### Features

- **Auto-rotation** through multiple items
- **Progress bar** showing time until next item
- **Pause on hover**
- **Previous/Next controls**
- **Dot navigation**
- **Smooth slide animations**

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreakingNewsItem[]` | Required | News items to display |
| `rotateInterval` | `number` | `5000` | Auto-rotate interval in ms |
| `pauseOnHover` | `boolean` | `true` | Pause rotation on hover |

#### Item Interface

```typescript
interface BreakingNewsItem {
  id: string;
  title: string;
  link: string;
  source?: string;
  timeAgo?: string;
}
```

#### Usage

```tsx
import { BreakingNewsTicker } from '@/components/BreakingNewsTicker';

const breakingNews = [
  { id: '1', title: 'Bitcoin hits new ATH', link: '/article/1', source: 'CoinDesk', timeAgo: '5m ago' },
  { id: '2', title: 'ETH 2.0 upgrade complete', link: '/article/2', source: 'Decrypt', timeAgo: '10m ago' },
];

<BreakingNewsTicker 
  items={breakingNews} 
  rotateInterval={6000}
  pauseOnHover={true}
/>
```

---

## Feedback & Notifications

### Toast

**File:** `src/components/Toast.tsx`

Toast notification system for user feedback.

#### Features

- **Multiple toast types**: success, error, warning, info
- **Auto-dismiss** with progress bar
- **Action buttons** for undo/retry
- **Configurable position** and max count
- **Accessible** with ARIA live regions

#### Setup

Wrap your app with `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/Toast';

export default function Layout({ children }) {
  return (
    <ToastProvider position="bottom-right" maxToasts={5}>
      {children}
    </ToastProvider>
  );
}
```

#### Usage

```tsx
import { useToast, useToastActions } from '@/components/Toast';

function MyComponent() {
  const { addToast } = useToast();
  const toast = useToastActions();

  // Quick methods
  toast.success('Saved!', 'Your changes have been saved.');
  toast.error('Error', 'Something went wrong.');
  toast.warning('Warning', 'This action cannot be undone.');
  toast.info('Info', 'New articles available.');

  // Full control
  addToast({
    type: 'success',
    title: 'Article bookmarked',
    message: 'View in your bookmarks',
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: () => removeBookmark(),
    },
  });
}
```

---

### EmptyState

**File:** `src/components/EmptyState.tsx`

Empty state placeholders for no-data scenarios.

#### Variants

| Variant | Icon | Use Case |
|---------|------|----------|
| `default` | 📭 | Generic empty content |
| `search` | 🔍 | No search results |
| `bookmarks` | 🔖 | Empty bookmarks |
| `error` | ⚠️ | Failed to load |
| `offline` | 📡 | No connection |
| `loading` | ⏳ | Loading state |

#### Usage

```tsx
import { EmptyState, SearchEmptyState, BookmarksEmptyState } from '@/components/EmptyState';

// Generic
<EmptyState
  variant="search"
  title="No results"
  description="Try different keywords"
  action={{ label: 'Clear', onClick: clearSearch }}
/>

// Pre-configured variants
<SearchEmptyState query="bitcoin" onClear={clearSearch} />
<BookmarksEmptyState />
<OfflineEmptyState onRetry={retry} />
<LoadingState message="Fetching articles..." />
```

---

### ErrorBoundary

**File:** `src/components/ErrorBoundary.tsx`

Graceful error handling for component failures.

#### Features

- **Catches render errors** in child components
- **Custom fallback** UI support
- **Error callback** for logging
- **Reset functionality** to retry
- **HOC wrapper** available

#### Usage

```tsx
import { ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';

// As component wrapper
<ErrorBoundary
  onError={(error, info) => logError(error)}
  fallback={<CustomErrorUI />}
>
  <RiskyComponent />
</ErrorBoundary>

// As higher-order component
const SafeComponent = withErrorBoundary(RiskyComponent, {
  showReset: true,
  onError: logError,
});
```

---

## Accessibility & UX

### BackToTop

**File:** `src/components/BackToTop.tsx`

Floating button to scroll back to top with progress indicator.

#### Features

- **Shows after scrolling** past threshold
- **Circular progress ring** showing scroll position
- **Keyboard support** (Home key)
- **Smooth scrolling** option

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `threshold` | `number` | `400` | Scroll distance before showing |
| `smooth` | `boolean` | `true` | Use smooth scrolling |
| `bottomOffset` | `string` | `'6rem'` | Position from bottom |
| `rightOffset` | `string` | `'1.5rem'` | Position from right |

#### Usage

```tsx
import { BackToTop } from '@/components/BackToTop';

// In your layout
<BackToTop threshold={300} smooth />
```

---

### ScrollRestoration

**File:** `src/components/ScrollRestoration.tsx`

Handles scroll and focus management on route changes.

#### Components

| Component | Description |
|-----------|-------------|
| `ScrollRestoration` | Scrolls to top on navigation |
| `RouteAnnouncer` | Announces page changes to screen readers |
| `NavigationAccessibility` | Combined accessibility features |

#### Usage

```tsx
import { NavigationAccessibility } from '@/components/ScrollRestoration';

// In your layout
<NavigationAccessibility
  scrollToTop={true}
  smoothScroll={false}
  focusMainContent={true}
  announceRoutes={true}
/>
```

---

### FocusManagement

**File:** `src/components/FocusManagement.tsx`

Focus trap and roving focus utilities for accessibility.

#### Hooks

| Hook | Description |
|------|-------------|
| `useFocusTrap` | Trap focus within a container (modals) |
| `useRovingFocus` | Arrow key navigation for lists |

#### Usage

```tsx
import { useFocusTrap, useRovingFocus, FocusTrap } from '@/components/FocusManagement';

// Hook usage
function Modal({ isOpen }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, isOpen, {
    onEscape: closeModal,
  });
  return <div ref={containerRef}>...</div>;
}

// Component usage
<FocusTrap active={isOpen} onEscape={close}>
  <ModalContent />
</FocusTrap>

// Roving focus for menus
function Menu() {
  const containerRef = useRef(null);
  const { handleKeyDown } = useRovingFocus(containerRef, {
    orientation: 'vertical',
    loop: true,
  });
  return <ul ref={containerRef} onKeyDown={handleKeyDown}>...</ul>;
}
```

---

## Keyboard Shortcuts

Global keyboard shortcuts available throughout the application:

| Shortcut | Action | Component |
|----------|--------|-----------|
| `⌘K` / `Ctrl+K` | Open Search | SearchModal |
| `⌘⇧P` / `Ctrl+Shift+P` | Open Command Palette | CommandPalette |
| `Escape` | Close modal/menu | All modals |
| `↑` `↓` | Navigate items | SearchModal, CommandPalette |
| `Enter` | Select/Execute | SearchModal, CommandPalette |
| `Tab` | Switch tabs | SearchModal |

---

## Importing Components

All navigation components can be imported from the barrel file:

```tsx
import { 
  Breadcrumbs,
  BreadcrumbsCompact,
  CommandPalette,
  SearchModal,
  PrefetchLink,
  NavLink,
  CardLink,
  BreakingNewsTicker,
} from '@/components/navigation';
```

Or import individually:

```tsx
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CommandPalette } from '@/components/CommandPalette';
```

---

## CSS Classes & Animations

Custom CSS classes available in `globals.css`:

| Class | Description |
|-------|-------------|
| `.mega-menu-enter` | Fade-in animation for mega menu |
| `.mega-menu-item` | Staggered slide animation for menu items |
| `.command-palette-enter` | Scale-in animation for command palette |
| `.animate-fade-in-up` | Fade + translate up animation |
| `.stagger-children` | Apply staggered delays to children |
| `.focus-ring` | Consistent focus ring styling |
| `.card-hover` | Lift + shadow on hover |
