import React, { useRef, useEffect, useState } from 'react';

export interface LiquidTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface LiquidGlassTabsProps {
  tabs: LiquidTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const LiquidGlassTabs: React.FC<LiquidGlassTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // Mise à jour de l'indicateur coulissant en verre liquide
  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab, tabs]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      onChange(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      onChange(tabs[prevIndex].id);
    }
  };

  const sizeClasses = {
    sm: 'p-1 gap-1 text-xs',
    md: 'p-1.5 gap-1.5 text-xs sm:text-sm',
  }[size];

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
  }[size];

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex items-center rounded-2xl glass border border-white/80 bg-white/40 shadow-xs overflow-x-auto no-scrollbar ${sizeClasses} ${className}`}
    >
      {/* Pilule coulissante en verre liquide */}
      {indicatorStyle.width > 0 && (
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-sm border border-white/90 transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      )}

      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 inline-flex items-center gap-2 rounded-xl font-semibold select-none transition-colors duration-200 cursor-pointer whitespace-nowrap ${buttonSizeClasses} ${
              isActive
                ? 'text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/30'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`font-mono-tabular text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-900/8 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
