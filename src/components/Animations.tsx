/**
 * @fileoverview Animated Components with Framer Motion
 * 
 * Micro-animations for polished UI interactions.
 * 
 * @module components/Animations
 * 
 * @features
 * - Fade in/out transitions
 * - Slide animations
 * - Scale effects
 * - Stagger children
 * - Loading shimmer
 */
'use client';

import { ReactNode } from 'react';

interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fade in animation using CSS
 */
export function FadeIn({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Slide up animation
 */
export function SlideUp({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-slideUp ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Scale in animation
 */
export function ScaleIn({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-scaleIn ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered children animation
 */
interface StaggerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function Stagger({ children, className = '', staggerDelay = 50 }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-fadeIn"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer loading effect
 */
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

/**
 * Pulse animation for live indicators
 */
export function Pulse({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
    </span>
  );
}

/**
 * Bounce animation for attention
 */
export function Bounce({ children, className = '' }: AnimatedProps) {
  return (
    <div className={`animate-bounce ${className}`}>
      {children}
    </div>
  );
}

/**
 * Spin animation for loading
 */
export function Spin({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-brand-600 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Counter animation - animates number changes
 */
interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function Counter({ value, className = '' }: CounterProps) {
  return (
    <span className={`tabular-nums ${className}`}>
      {value.toLocaleString()}
    </span>
  );
}

/**
 * Typewriter effect for text
 */
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export function Typewriter({ text, className = '' }: TypewriterProps) {
  return (
    <span className={`inline-block overflow-hidden whitespace-nowrap border-r-2 border-current animate-typewriter ${className}`}>
      {text}
    </span>
  );
}

/**
 * Hover lift effect wrapper
 */
export function HoverLift({ children, className = '' }: AnimatedProps) {
  return (
    <div className={`transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      {children}
    </div>
  );
}

/**
 * Hover glow effect wrapper
 */
export function HoverGlow({ children, className = '' }: AnimatedProps) {
  return (
    <div className={`transition-shadow duration-200 hover:shadow-xl hover:shadow-brand-500/20 ${className}`}>
      {children}
    </div>
  );
}
