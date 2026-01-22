'use client';

import React, { useRef, useEffect, useState, useCallback, RefObject } from 'react';

interface FocusTrapOptions {
  /** Initial element to focus when trap activates */
  initialFocus?: RefObject<HTMLElement> | string;
  /** Element to return focus to when trap deactivates */
  returnFocus?: RefObject<HTMLElement> | boolean;
  /** Allow focus to escape via Tab at boundaries */
  allowEscape?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

/**
 * Hook for trapping focus within a container
 * Essential for modals, dialogs, and other overlays
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  options: FocusTrapOptions = {}
) {
  const { initialFocus, returnFocus = true, allowEscape = false, onEscape } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector))
      .filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }, [containerRef]);

  // Focus first element or specified initial focus
  const focusFirst = useCallback(() => {
    if (typeof initialFocus === 'string') {
      const element = containerRef.current?.querySelector<HTMLElement>(initialFocus);
      element?.focus();
    } else if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const focusable = getFocusableElements();
      focusable[0]?.focus();
    }
  }, [containerRef, initialFocus, getFocusableElements]);

  // Handle tab key to trap focus
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === firstElement) {
        if (allowEscape) return;
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastElement) {
        if (allowEscape) return;
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [getFocusableElements, allowEscape, onEscape]);

  // Activate/deactivate trap
  useEffect(() => {
    if (!isActive) return;

    // Store current focus
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus first element
    requestAnimationFrame(focusFirst);

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus
      if (returnFocus) {
        const elementToFocus = typeof returnFocus === 'boolean' 
          ? previousActiveElement.current 
          : returnFocus.current;
        
        elementToFocus?.focus();
      }
    };
  }, [isActive, focusFirst, handleKeyDown, returnFocus]);

  return { getFocusableElements, focusFirst };
}

/**
 * Hook for managing focus within a list (e.g., menu items)
 * Supports arrow key navigation
 */
export function useRovingFocus(
  containerRef: RefObject<HTMLElement>,
  options: {
    selector?: string;
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (element: HTMLElement, index: number) => void;
  } = {}
) {
  const {
    selector = '[role="menuitem"], [role="option"], button, a',
    orientation = 'vertical',
    loop = true,
    onSelect,
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);

  const getItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
  }, [containerRef, selector]);

  const focusItem = useCallback((index: number) => {
    const items = getItems();
    if (index >= 0 && index < items.length) {
      items[index]?.focus();
      setFocusedIndex(index);
    }
  }, [getItems]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = getItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex(item => item === document.activeElement);
    let nextIndex = currentIndex;

    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    switch (e.key) {
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          nextIndex = loop 
            ? (currentIndex + 1) % items.length 
            : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          nextIndex = loop 
            ? (currentIndex - 1 + items.length) % items.length 
            : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = loop 
            ? (currentIndex + 1) % items.length 
            : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = loop 
            ? (currentIndex - 1 + items.length) % items.length 
            : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (currentIndex >= 0) {
          e.preventDefault();
          onSelect?.(items[currentIndex], currentIndex);
        }
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      focusItem(nextIndex);
    }
  }, [getItems, orientation, loop, focusItem, onSelect]);

  return {
    focusedIndex,
    setFocusedIndex,
    focusItem,
    handleKeyDown,
    getItems,
  };
}

/**
 * Component wrapper that provides focus trap functionality
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocus?: string;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({ 
  children, 
  active = true, 
  initialFocus,
  onEscape,
  className = '',
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useFocusTrap(containerRef as React.RefObject<HTMLElement>, active, {
    initialFocus: initialFocus as unknown as RefObject<HTMLElement>,
    onEscape,
  });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export default FocusTrap;
