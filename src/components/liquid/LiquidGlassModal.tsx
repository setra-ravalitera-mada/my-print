import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LiquidGlassButton } from './LiquidGlassButton';

export interface LiquidGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  compact?: boolean;
  children: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement | null>;
  titleId?: string;
  descriptionId?: string;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  compact = false,
  children,
  triggerRef,
  titleId = 'liquid-modal-title',
  descriptionId,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const pointerDownOnBackdrop = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current =
        (triggerRef?.current as HTMLElement | null) ||
        (document.activeElement as HTMLElement | null);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (!panelRef.current) return;
        const firstFocusable = panelRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        firstFocusable?.focus({ preventScroll: true });
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && panelRef.current) {
          const focusable = Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
          ).filter((el) => el.offsetParent !== null);

          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !panelRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !panelRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;

        const targetToFocus = triggerRef?.current || previousActiveElement.current;
        if (targetToFocus && typeof targetToFocus.focus === 'function') {
          setTimeout(() => targetToFocus.focus({ preventScroll: true }), 20);
        }
      };
    }
  }, [isOpen, onClose, triggerRef]);

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pointerDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    pointerDownOnBackdrop.current = false;
  };

  return (
    <div
      className={`dialog-backdrop ${isOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal={isOpen ? 'true' : undefined}
      aria-hidden={!isOpen}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      inert={!isOpen ? true : undefined}
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`dialog-panel glass ${
          compact ? 'dialog-panel-compact' : ''
        } p-6 sm:p-8 text-slate-900 ${className}`}
      >
        <div className="dialog-shimmer" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-900/10">
            <div>
              {subtitle && (
                <p className="text-xs font-semibold tracking-wide text-slate-500 mb-0.5 uppercase">
                  {subtitle}
                </p>
              )}
              <h2
                id={titleId}
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950"
              >
                {title}
              </h2>
            </div>

            <LiquidGlassButton
              variant="tertiary"
              size="sm"
              iconOnly
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="!w-8 !h-8 text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </LiquidGlassButton>
          </div>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
