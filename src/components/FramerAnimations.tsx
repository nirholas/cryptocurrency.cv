/**
 * Reusable Animation Components using Framer Motion
 */

'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideInFromBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Motion Components
interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, className, delay = 0, duration = 0.4 }: MotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className, delay = 0, duration = 0.4 }: MotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({ children, className, delay = 0, duration = 0.4 }: MotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInDown}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0, duration = 0.3 }: MotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={scaleIn}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// Page Transition Wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card Hover Animation
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function HoverCard({ children, className, scale = 1.02 }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ scale, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Button Press Animation
interface PressButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PressButton({ children, className, onClick, disabled }: PressButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.15 }}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

// Slide In Panel (for modals/sidebars)
interface SlideInPanelProps {
  children: ReactNode;
  isOpen: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  onClose?: () => void;
}

export function SlideInPanel({
  children,
  isOpen,
  direction = 'right',
  className,
  onClose,
}: SlideInPanelProps) {
  const variants = {
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={variants[direction].initial}
            animate={variants[direction].animate}
            exit={variants[direction].exit}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Number Counter Animation
interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1,
  className,
  prefix = '',
  suffix = '',
}: CounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={value}
      >
        {prefix}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value.toLocaleString()}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
}

// Skeleton Loading Animation
interface SkeletonProps {
  className?: string;
  count?: number;
}

export function AnimatedSkeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-gray-800 rounded ${className}`}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

// Tooltip with animation
interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function AnimatedTooltip({ children, content, position = 'top' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <motion.div className="relative group" whileHover="hover">
      {children}
      <motion.div
        className={`absolute ${positionClasses[position]} px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap pointer-events-none z-50`}
        initial={{ opacity: 0, scale: 0.9 }}
        variants={{
          hover: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.15 }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion };
