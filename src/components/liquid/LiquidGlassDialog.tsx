import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { LiquidGlassModal } from './LiquidGlassModal';
import { LiquidGlassButton } from './LiquidGlassButton';

export interface LiquidGlassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const LiquidGlassDialog: React.FC<LiquidGlassDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) => {
  const icon = {
    danger: <AlertTriangle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  }[variant];

  const iconBg = {
    danger: 'bg-red-500/15 border-red-200',
    warning: 'bg-amber-500/15 border-amber-200',
    info: 'bg-blue-500/15 border-blue-200',
    success: 'bg-emerald-500/15 border-emerald-200',
  }[variant];

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      compact
      titleId="liquid-dialog-title"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs ${iconBg}`}
          >
            {icon}
          </div>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-0.5">
            {description}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900/10">
          <LiquidGlassButton variant="secondary" size="md" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </LiquidGlassButton>

          <LiquidGlassButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </LiquidGlassButton>
        </div>
      </div>
    </LiquidGlassModal>
  );
};
