import React from 'react';

export interface LiquidGlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const LiquidGlassSwitch: React.FC<LiquidGlassSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}) => {
  const switchId = id || `liquid-switch-${Math.random().toString(36).substring(2, 9)}`;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label && (
        <label
          htmlFor={switchId}
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

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`liquid-glass-switch ${checked ? 'is-checked' : ''} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <span className="liquid-glass-switch-thumb" />
      </button>
    </div>
  );
};
