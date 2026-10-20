import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';

export interface LiquidGlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  clearable?: boolean;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  onClear?: () => void;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

export const LiquidGlassInput = forwardRef<HTMLInputElement, LiquidGlassInputProps>(
  (
    {
      type = 'text',
      label,
      error,
      success = false,
      loading = false,
      clearable = false,
      disabled = false,
      prefixIcon,
      suffixIcon,
      onClear,
      sizeVariant = 'md',
      className = '',
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const sizeClasses = {
      sm: 'py-1.5 px-3 text-xs min-h-[36px]',
      md: 'py-2 px-3.5 text-xs sm:text-sm min-h-[42px]',
      lg: 'py-3 px-4 text-sm sm:text-base min-h-[48px]',
    }[sizeVariant];

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
            {label}
          </label>
        )}

        <div
          className={`liquid-glass-input relative flex items-center transition-all duration-200 ${
            error
              ? '!border-red-400 !ring-2 !ring-red-500/25'
              : success
              ? '!border-emerald-400 !ring-2 !ring-emerald-500/25'
              : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {prefixIcon && (
            <div className="pl-3.5 pr-1 text-slate-500 shrink-0 flex items-center pointer-events-none">
              {prefixIcon}
            </div>
          )}

          <input
            ref={ref}
            type={effectiveType}
            disabled={disabled}
            value={value}
            onChange={onChange}
            className={`w-full bg-transparent text-slate-950 placeholder:text-slate-400 focus:outline-none ${sizeClasses} ${
              prefixIcon ? 'pl-2' : ''
            } ${suffixIcon || isPassword || clearable || loading ? 'pr-9' : ''}`}
            {...props}
          />

          <div className="absolute right-2.5 flex items-center gap-1.5 text-slate-400">
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" aria-hidden="true" />
            )}

            {clearable && value && !disabled && (
              <button
                type="button"
                onClick={onClear || (() => onChange?.({ target: { value: '' } } as any))}
                aria-label="Effacer le contenu"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            {suffixIcon && <div className="pointer-events-none">{suffixIcon}</div>}
          </div>
        </div>

        {error && <p className="text-[11px] text-red-600 font-medium mt-1">{error}</p>}
      </div>
    );
  }
);

LiquidGlassInput.displayName = 'LiquidGlassInput';
