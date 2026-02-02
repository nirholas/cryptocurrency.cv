// Mobile-optimized components
// Components are in the parent directory
export { default as BottomNav } from '../BottomNav';
export { default as SwipeableCard } from '../SwipeableCard';
export { default as PullToRefresh } from '../PullToRefresh';
export { default as FloatingActionButton } from '../FloatingActionButton';

// Re-export mobile hooks for convenience
export {
  useOnlineStatus,
  useIsMobile,
  useTouchDevice,
  useSafeAreaInsets,
  usePullToRefresh,
  useHapticFeedback,
  useScrollDirection,
  useBodyScrollLock,
  useStandaloneMode,
} from '@/hooks/useMobile';
