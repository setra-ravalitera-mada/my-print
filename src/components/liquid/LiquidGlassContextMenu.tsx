import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiquidDropdownItem } from './LiquidGlassDropdown';

export interface LiquidGlassContextMenuProps {
  items: (LiquidDropdownItem | 'separator')[];
  children: React.ReactElement;
  className?: string;
}

export const LiquidGlassContextMenu: React.FC<LiquidGlassContextMenuProps> = ({
  items,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setPosition({ x, y });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      {React.cloneElement(children as React.ReactElement<any>, {
        onContextMenu: handleContextMenu,
      })}

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          className={`liquid-glass-menu z-[var(--z-dropdown)] w-56 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        >
          <div className="space-y-0.5">
            {items.map((item, idx) => {
              if (item === 'separator') {
                return (
                  <div
                    key={`ctx-sep-${idx}`}
                    className="my-1.5 border-t border-slate-900/8"
                    role="separator"
                  />
                );
              }

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
                  className={`liquid-glass-menu-item ${
                    item.destructive ? 'is-destructive !text-red-600 hover:!bg-red-500/15' : ''
                  } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
    </>
  );
};
