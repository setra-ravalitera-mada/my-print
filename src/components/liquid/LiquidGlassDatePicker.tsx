import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LiquidGlassButton } from './LiquidGlassButton';

export interface LiquidGlassDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export const LiquidGlassDatePicker: React.FC<LiquidGlassDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Choisir une date...',
  minDate,
  maxDate,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const closePicker = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePicker();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePicker();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closePicker]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calcul du calendrier du mois
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Adapter au lundi comme premier jour (0 = Dimanche -> 6 = Dimanche)
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const todayStr = (() => {
    const t = new Date();
    return formatDateString(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const formatDisplay = (val?: string) => {
    if (!val) return '';
    try {
      const [y, m, d] = val.split('-').map(Number);
      return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
    } catch {
      return val;
    }
  };

  const handleSelectDay = (day: number) => {
    const dateStr = formatDateString(viewYear, viewMonth, day);
    onChange(dateStr);
    closePicker();
  };

  const setPreset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(dateStr);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    closePicker();
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}

      {/* Bouton déclencheur */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-2xl glass border flex items-center justify-between gap-2.5 text-left transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99] ${
          isOpen
            ? 'bg-white border-blue-400 ring-2 ring-blue-500/20 shadow-md'
            : 'bg-white/60 hover:bg-white/90 border-white/90 text-slate-900'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span className={`text-xs sm:text-sm truncate ${value ? 'font-semibold text-slate-950' : 'text-slate-400 font-normal'}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        {value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Effacer la date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Panneau Calendrier Liquid Glass */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendrier de sélection"
          className="liquid-glass-menu left-0 top-full mt-2 w-80 p-4 z-50 animate-in fade-in zoom-in-95 duration-180"
        >
          {/* En-tête Mois / Année */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-900/8">
            <LiquidGlassButton
              variant="tertiary"
              size="xs"
              iconOnly
              onClick={prevMonth}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </LiquidGlassButton>

            <span className="font-display text-sm font-bold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <LiquidGlassButton
              variant="tertiary"
              size="xs"
              iconOnly
              onClick={nextMonth}
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </LiquidGlassButton>
          </div>

          {/* Raccourcis rapides */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setPreset(0)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-white text-[10px] font-semibold text-slate-700 border border-slate-200 shrink-0 cursor-pointer transition-all"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setPreset(1)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-white text-[10px] font-semibold text-slate-700 border border-slate-200 shrink-0 cursor-pointer transition-all"
            >
              Demain
            </button>
            <button
              type="button"
              onClick={() => setPreset(7)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-white text-[10px] font-semibold text-slate-700 border border-slate-200 shrink-0 cursor-pointer transition-all"
            >
              Dans 7j
            </button>
          </div>

          {/* En-têtes jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_LABELS.map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const dateStr = formatDateString(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isBeforeMin = minDate ? dateStr < minDate : false;
              const isAfterMax = maxDate ? dateStr > maxDate : false;
              const isDisabled = isBeforeMin || isAfterMax;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  } ${isDisabled ? 'opacity-25 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
