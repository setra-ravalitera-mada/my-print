import React, { forwardRef } from 'react';
import { LiquidGlassButton, LiquidButtonSize, LiquidButtonVariant } from './LiquidGlassButton';

export interface LiquidGlassIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: LiquidButtonVariant;
  size?: LiquidButtonSize;
  tooltip?: string;
  loading?: boolean;
  active?: boolean;
  icon: React.ReactNode;
  'aria-label': string;
}

export const LiquidGlassIconButton = forwardRef<HTMLButtonElement, LiquidGlassIconButtonProps>(
  (
    {
      variant = 'icon',
      size = 'md',
      tooltip,
      loading = false,
      active = false,
      icon,
      className = '',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative group inline-flex items-center justify-center">
        <LiquidGlassButton
          ref={ref}
          variant={variant}
          size={size}
          iconOnly
          loading={loading}
          aria-label={ariaLabel}
          className={`${active ? '!bg-blue-600 !text-white !border-blue-400 shadow-md ring-2 ring-blue-500/20' : ''} ${className}`}
          {...props}
        >
          {icon}
        </LiquidGlassButton>

        {tooltip && (
          <div
            role="tooltip"
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-medium tracking-wide shadow-lg border border-white/20 whitespace-nowrap backdrop-blur-md"
          >
            {tooltip}
          </div>
        )}
      </div>
    );
  }
);

LiquidGlassIconButton.displayName = 'LiquidGlassIconButton';
