import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface LiquidSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface LiquidGlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LiquidSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  align?: 'left' | 'right';
}

export const LiquidGlassSelect: React.FC<LiquidGlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner une option...',
  searchable = false,
  clearable = false,
  disabled = false,
  error,
  label,
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            closeDropdown();
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown, filteredOptions, highlightedIndex, searchable, onChange]);

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-2xl glass border flex items-center justify-between gap-2.5 text-left transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99] ${
          isOpen
            ? 'bg-white border-blue-400 ring-2 ring-blue-500/20 shadow-md'
            : 'bg-white/60 hover:bg-white/90 border-white/90 text-slate-900'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${
          error ? 'border-red-400 ring-2 ring-red-500/20' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <span className="text-xs sm:text-sm font-semibold text-slate-950 truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-slate-400 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-full hover:bg-black/5 hover:text-slate-800 transition-colors cursor-pointer"
              title="Effacer la sélection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Listbox */}
      {isOpen && (
        <div
          role="listbox"
          className={`liquid-glass-menu ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 w-full max-h-64 overflow-y-auto no-scrollbar z-50 animate-in fade-in zoom-in-95 duration-180`}
        >
          {searchable && (
            <div className="p-1.5 pb-2 border-b border-slate-900/8 mb-1 sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-xl">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-500">
                Aucune option disponible
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      onChange(option.value);
                      closeDropdown();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`liquid-glass-menu-item justify-between ${
                      isSelected
                        ? '!bg-blue-600 !text-white font-semibold shadow-xs'
                        : isHighlighted
                        ? 'bg-white/80 text-slate-900'
                        : 'text-slate-800'
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {option.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {option.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-900/8 text-slate-700'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
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
