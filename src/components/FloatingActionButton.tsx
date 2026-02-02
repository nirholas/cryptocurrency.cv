'use client';

import { useState, ReactNode } from 'react';
import { useScrollDirection, useHapticFeedback } from '@/hooks/useMobile';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  actions?: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  hideOnScroll?: boolean;
  className?: string;
}

export default function FloatingActionButton({
  icon,
  onClick,
  actions,
  position = 'bottom-right',
  hideOnScroll = true,
  className = '',
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollDirection = useScrollDirection();
  const haptic = useHapticFeedback();

  const isHidden = hideOnScroll && scrollDirection === 'down';

  const positionClasses = {
    'bottom-right': 'right-4 bottom-20 md:bottom-6',
    'bottom-left': 'left-4 bottom-20 md:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20 md:bottom-6',
  };

  const handleMainClick = () => {
    haptic('light');
    
    if (actions && actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    haptic('medium');
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div 
        className={`fab fixed z-50 transition-all duration-300 ${positionClasses[position]} ${className}`}
        style={{
          transform: isHidden ? 'translateY(100px)' : 'translateY(0)',
          opacity: isHidden ? 0 : 1,
        }}
      >
        {/* Action buttons (when expanded) */}
        {actions && isExpanded && (
          <div className="fab-actions absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2">
            {actions.map((action, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
                <button
                  onClick={() => handleActionClick(action)}
                  className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center haptic-tap ${
                    action.color || 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={handleMainClick}
          className={`fab-main w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center haptic-tap hover:bg-orange-600 active:scale-95 transition-all ${
            isExpanded ? 'rotate-45' : ''
          }`}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          aria-expanded={isExpanded}
        >
          {icon}
        </button>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}
