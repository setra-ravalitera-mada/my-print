import React from 'react';
import { Check } from 'lucide-react';

export interface LiquidGlassCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export const LiquidGlassCheckbox: React.FC<LiquidGlassCheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  error,
  className = '',
  id,
}) => {
  const checkboxId = id || `liquid-checkbox-${Math.random().toString(36).substring(2, 9)}`;

  const toggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-start gap-2.5">
        <button
          id={checkboxId}
          type="button"
          role="checkbox"
          aria-checked={checked}
          disabled={disabled}
          onClick={toggle}
          className={`w-5 h-5 mt-0.5 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
            checked
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white/70 hover:bg-white border-white/90 text-transparent'
          } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${
            error ? 'border-red-400 ring-2 ring-red-500/20' : ''
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
              checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
          />
        </button>

        {label && (
          <label
            htmlFor={checkboxId}
            className={`flex flex-col cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-xs sm:text-sm font-semibold text-slate-900 select-none">
              {label}
            </span>
            {description && (
              <span className="text-[11px] text-slate-500 select-none leading-relaxed">
                {description}
              </span>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
};
