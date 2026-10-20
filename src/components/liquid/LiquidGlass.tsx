import React, { forwardRef } from 'react';

export type LiquidGlassVariant = 'default' | 'elevated' | 'subtle' | 'card' | 'interactive';
export type LiquidGlassLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LiquidGlassVariant;
  level?: LiquidGlassLevel;
  interactive?: boolean;
  ripple?: boolean;
  as?: React.ElementType;
  children?: React.ReactNode;
}

/**
 * Surface universelle Liquid Glass inspirée d'Apple WWDC25 / iOS 26
 * - Reflet de réfraction lumineux dynamique (pointermove)
 * - Niveaux d'élévation hiérarchiques (z-index & profondeur)
 * - Dégradés internes et saturation optique
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      variant = 'default',
      level = 2,
      interactive = false,
      ripple = false,
      as: Component = 'div',
      className = '',
      children,
      onPointerMove,
      ...props
    },
    ref
  ) => {
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--lg-x', `${x.toFixed(1)}%`);
        target.style.setProperty('--lg-y', `${y.toFixed(1)}%`);
        target.style.setProperty('--touch-x', `${x.toFixed(1)}%`);
        target.style.setProperty('--touch-y', `${y.toFixed(1)}%`);
      }
      onPointerMove?.(e);
    };

    const variantClasses = {
      default: 'liquid-glass',
      elevated: 'liquid-glass liquid-glass-elevated',
      subtle: 'liquid-glass liquid-glass-subtle',
      card: 'liquid-glass',
      interactive: 'liquid-glass liquid-glass-interactive cursor-pointer',
    }[variant];

    const levelClasses = {
      1: 'z-[var(--z-base)]',
      2: 'z-[var(--z-card)]',
      3: 'z-[var(--z-floating)]',
      4: 'z-[var(--z-dropdown)]',
      5: 'z-[var(--z-modal)]',
      6: 'z-[var(--z-toast)]',
    }[level];

    const interactiveClass = interactive || variant === 'interactive' ? 'liquid-glass-interactive' : '';
    const rippleClass = ripple ? 'liquid-glass-ripple' : '';

    return (
      <Component
        ref={ref}
        onPointerMove={handlePointerMove}
        className={`${variantClasses} ${levelClasses} ${interactiveClass} ${rippleClass} ${className}`}
        {...props}
      >
        <div className="relative z-10 w-full h-full">{children}</div>
      </Component>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';
