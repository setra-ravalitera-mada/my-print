import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLiquidGlassPointer } from '../hooks/useLiquidGlassPointer';
import { LiquidGlassButton } from './LiquidGlassButton';

interface LiquidModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  descriptionId?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const LiquidModal: React.FC<LiquidModalProps> = ({
  isOpen,
  onClose,
  titleId,
  descriptionId,
  title,
  subtitle,
  compact = false,
  triggerRef,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const pointerDownOnBackdrop = useRef<boolean>(false);
  const pointerHandlers = useLiquidGlassPointer();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Sauvegarder l'élément ayant déclenché l'ouverture
      previousActiveElement.current =
        (triggerRef?.current as HTMLElement | null) ||
        (document.activeElement as HTMLElement | null);

      // Verrouiller le défilement de l'arrière-plan
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Placer le focus dans la modale uniquement au premier affichage si l'utilisateur n'est pas déjà dans un champ
      const focusTimer = window.setTimeout(() => {
        if (!panelRef.current) return;
        if (panelRef.current.contains(document.activeElement)) {
          return;
        }
        const firstInput = panelRef.current.querySelector<HTMLElement>('[autofocus], input, textarea, select');
        if (firstInput) {
          firstInput.focus({ preventScroll: true });
        } else if (closeBtnRef.current) {
          closeBtnRef.current.focus({ preventScroll: true });
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCloseRef.current();
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
        window.clearTimeout(focusTimer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;

        // Restituer le focus au bouton qui a ouvert la fenêtre
        const targetToFocus = triggerRef?.current || previousActiveElement.current;
        if (targetToFocus && typeof targetToFocus.focus === 'function') {
          window.setTimeout(() => {
            targetToFocus.focus({ preventScroll: true });
          }, 20);
        }
      };
    }
  }, [isOpen, triggerRef]);

  // Empêcher les clics commencés à l'intérieur du panneau de fermer accidentellement la modale
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
        onPointerMove={pointerHandlers.onPointerMove}
        onClick={(e) => e.stopPropagation()}
        className={`dialog-panel glass ${compact ? 'dialog-panel-compact' : ''} p-6 sm:p-8 text-slate-900`}
      >
        {/* Reflet lumineux discret qui traverse la membrane liquide à l'apparition */}
        <div className="dialog-shimmer" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-900/10">
            <div>
              {subtitle && (
                <p className="text-xs font-medium tracking-wide text-slate-500 mb-1">
                  {subtitle}
                </p>
              )}
              <h2
                id={titleId}
                className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-slate-900"
              >
                {title}
              </h2>
            </div>

            <LiquidGlassButton
              ref={closeBtnRef}
              size="sm"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="!p-2.5 rounded-full text-slate-700 hover:text-slate-950"
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
