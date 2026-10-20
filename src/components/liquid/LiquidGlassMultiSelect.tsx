import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { LiquidSelectOption } from './LiquidGlassSelect';

export interface LiquidGlassMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: LiquidSelectOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const LiquidGlassMultiSelect: React.FC<LiquidGlassMultiSelectProps> = ({
  values,
  onChange,
  options,
  placeholder = 'Sélectionner plusieurs options...',
  label,
  searchable = true,
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => values.includes(opt.value));

  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const removeValue = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== val));
  };

  const selectAll = () => {
    onChange(options.filter((o) => !o.disabled).map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}

      {/* Trigger Button with Chips */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[44px] px-3 py-1.5 rounded-2xl glass border flex items-center justify-between gap-2 text-left transition-all duration-200 cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-white border-blue-400 ring-2 ring-blue-500/20 shadow-md'
            : 'bg-white/60 hover:bg-white/90 border-white/90 text-slate-900'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${
          error ? 'border-red-400 ring-2 ring-red-500/20' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 py-0.5">
          {selectedOptions.length === 0 ? (
            <span className="text-xs sm:text-sm text-slate-400 font-normal truncate px-1">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100/90 text-blue-900 border border-blue-200 text-xs font-semibold shadow-2xs backdrop-blur-xs"
              >
                <span>{opt.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeValue(e, opt.value)}
                  className="p-0.5 rounded-full hover:bg-blue-200/80 transition-colors cursor-pointer"
                  title="Retirer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-500 ml-1">
          {values.length > 0 && (
            <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
              {values.length}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="liquid-glass-menu left-0 top-full mt-2 w-full max-h-72 overflow-y-auto no-scrollbar z-50 animate-in fade-in zoom-in-95 duration-180"
        >
          {searchable && (
            <div className="p-1.5 pb-2 border-b border-slate-900/8 mb-1 sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-xl space-y-2">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher des options..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Tout effacer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-500">
                Aucun élément correspondant
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => toggleOption(option.value)}
                    className={`liquid-glass-menu-item justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-950 font-semibold'
                        : 'text-slate-800 hover:bg-white/80'
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[11px] text-slate-500 truncate">{option.description}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                            : 'border-slate-300 bg-white/80'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
};
