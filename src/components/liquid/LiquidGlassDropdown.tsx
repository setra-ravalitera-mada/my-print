import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface LiquidDropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface LiquidGlassDropdownProps {
  trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
  items: (LiquidDropdownItem | 'separator')[];
  header?: string;
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

export const LiquidGlassDropdown: React.FC<LiquidGlassDropdownProps> = ({
  trigger,
  items,
  header,
  align = 'left',
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actionableItems = items.filter((it): it is LiquidDropdownItem => it !== 'separator' && !it.disabled);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  // Fermeture clic extérieur et touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        const triggerBtn = containerRef.current?.querySelector('button');
        triggerBtn?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % actionableItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + actionableItems.length) % actionableItems.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(actionableItems.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (activeIndex >= 0 && activeIndex < actionableItems.length) {
          e.preventDefault();
          const item = actionableItems[activeIndex];
          item.onClick?.();
          closeMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu, actionableItems, activeIndex]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="inline-block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-full"
      >
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`liquid-glass-menu ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 w-56 sm:w-64 max-w-[calc(100vw-32px)] ${menuClassName}`}
        >
          {header && (
            <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900/8 mb-1 flex items-center justify-between">
              <span>{header}</span>
              <span className="text-[10px] text-blue-600 font-mono">Liquid Glass</span>
            </div>
          )}

          <div className="space-y-0.5">
            {items.map((item, idx) => {
              if (item === 'separator') {
                return (
                  <div
                    key={`sep-${idx}`}
                    className="my-1.5 border-t border-slate-900/8"
                    role="separator"
                  />
                );
              }

              const isHighlighted =
                actionableItems.indexOf(item) === activeIndex && activeIndex !== -1;

              return (
                <button
                  key={item.id}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    closeMenu();
                  }}
                  onMouseEnter={() => {
                    const itemIdx = actionableItems.indexOf(item);
                    if (itemIdx !== -1) setActiveIndex(itemIdx);
                  }}
                  className={`liquid-glass-menu-item ${
                    isHighlighted ? 'is-highlighted bg-white/70' : ''
                  } ${item.destructive ? 'is-destructive !text-red-600 hover:!bg-red-500/15' : ''} ${
                    item.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {item.icon && <span className="w-4 h-4 shrink-0 opacity-80">{item.icon}</span>}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900/8 text-slate-700 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
