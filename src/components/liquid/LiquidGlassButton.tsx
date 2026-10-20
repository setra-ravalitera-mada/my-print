import React, { forwardRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export type LiquidButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'glass'
  | 'danger'
  | 'destructive'
  | 'icon';

export type LiquidButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LiquidButtonVariant;
  size?: LiquidButtonSize;
  loading?: boolean;
  ripple?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
}

export const LiquidGlassButton = forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  (
    {
      variant = 'glass',
      size = 'md',
      loading = false,
      ripple = true,
      iconOnly = false,
      disabled = false,
      className = '',
      children,
      onClick,
      onPointerDown,
      onPointerMove,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
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

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && !loading && ripple) {
        const rect = e.currentTarget.getBoundingClientRect();
        const rippleSize = Math.max(rect.width, rect.height) * 2;
        const newRipple = {
          id: Date.now() + Math.random(),
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          size: rippleSize,
        };
        setRipples((prev) => [...prev.slice(-3), newRipple]);
      }
      onPointerDown?.(e);
    };

    const sizeClasses = iconOnly
      ? {
          xs: 'w-7 h-7 p-1 text-xs rounded-full',
          sm: 'w-8 h-8 p-1.5 text-xs rounded-full',
          md: 'w-10 h-10 p-2 text-sm rounded-full',
          lg: 'w-12 h-12 p-2.5 text-base rounded-full',
        }[size]
      : {
          xs: 'px-2.5 py-1 text-[11px] rounded-xl',
          sm: 'px-3.5 py-1.5 text-xs rounded-full',
          md: 'px-5 py-2.5 text-sm rounded-full',
          lg: 'px-6 py-3.5 text-sm rounded-full',
        }[size];

    let variantClasses = 'glass-button font-medium text-slate-900';
    if (variant === 'primary') {
      variantClasses = 'glass-button glass-button-primary font-semibold text-white';
    } else if (variant === 'secondary') {
      variantClasses =
        'glass-button bg-white/70 hover:bg-white text-slate-800 border-white/90 shadow-xs font-semibold';
    } else if (variant === 'tertiary') {
      variantClasses =
        'border border-transparent bg-transparent hover:bg-white/40 text-slate-700 hover:text-slate-950 font-medium rounded-full';
    } else if (variant === 'danger' || variant === 'destructive') {
      variantClasses =
        'glass-button bg-red-500/15 hover:bg-red-500/25 border-red-300/80 text-red-700 hover:text-red-800 font-semibold';
    } else if (variant === 'icon') {
      variantClasses =
        'glass-button bg-white/60 hover:bg-white border-white/90 text-slate-700 hover:text-slate-950 rounded-full flex items-center justify-center';
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : undefined}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onClick={onClick}
        className={`liquid-glass-ripple ${variantClasses} ${sizeClasses} relative inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer select-none transition-all duration-200 active:scale-[0.965] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none ${className}`}
        {...props}
      >
        {/* Onde de goutte d'eau (Liquid Ripple) */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="liquid-ripple"
            style={{
              width: `${r.size}px`,
              height: `${r.size}px`,
              left: `${r.x}px`,
              top: `${r.y}px`,
            }}
            onAnimationEnd={() => setRipples((prev) => prev.filter((item) => item.id !== r.id))}
          />
        ))}

        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" aria-hidden="true" />
          )}
          {children}
        </span>
      </button>
    );
  }
);

LiquidGlassButton.displayName = 'LiquidGlassButton';
