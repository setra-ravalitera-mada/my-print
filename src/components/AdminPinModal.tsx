import React, { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';
import { verifyAdminPin, getCompanyProfile, fetchCompanyProfileFromFirestore, CompanyProfile } from '../services/adminStorage';
import { LiquidGlassButton } from './LiquidGlassButton';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [bouncingKey, setBouncingKey] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '', '', '']);
      setIsShaking(false);
      setBouncingKey(null);
      fetchCompanyProfileFromFirestore().then((cp) => setCompanyProfile(cp));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Déclenchement de l'effet de rebond sur un bouton
  const triggerKeyBounce = (keyId: string) => {
    setBouncingKey(keyId);
    setTimeout(() => {
      setBouncingKey((prev: string | null) => (prev === keyId ? null : prev));
    }, 280);
  };

  // Validation automatique du code à 6 chiffres
  const verifyCode = (code: string) => {
    if (verifyAdminPin(code)) {
      onSuccess();
    } else {
      // Si code faux : pas de boîte rouge, simple vibration et réinitialisation des chiffres
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPinDigits(['', '', '', '', '', '']);
      }, 420);
    }
  };

  // Saisie tactile avec validation automatique au 6e chiffre
  const handleVirtualKeyClick = (numStr: string) => {
    triggerKeyBounce(numStr);

    const firstEmptyIndex = pinDigits.findIndex((d: string) => d === '');
    if (firstEmptyIndex === -1) return;

    const updated = [...pinDigits];
    updated[firstEmptyIndex] = numStr;
    setPinDigits(updated);

    // Validation automatique immédiate lorsque les 6 chiffres sont renseignés
    if (firstEmptyIndex === 5) {
      const fullCode = updated.join('');
      verifyCode(fullCode);
    }
  };

  // Effacer le dernier chiffre
  const handleVirtualBackspace = () => {
    triggerKeyBounce('backspace');

    const lastFilledIndex = [...pinDigits].reverse().findIndex((d) => d !== '');
    if (lastFilledIndex === -1) return;

    const realIndex = 5 - lastFilledIndex;
    const updated = [...pinDigits];
    updated[realIndex] = '';
    setPinDigits(updated);
  };

  // Effacer tous les chiffres
  const handleClearAll = () => {
    triggerKeyBounce('clear');
    setPinDigits(['', '', '', '', '', '']);
  };

  return (
    <div
      className="dialog-backdrop is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      onClick={onClose}
    >
      <div
        className={`dialog-panel glass dialog-panel-compact p-6 sm:p-8 text-slate-900 transition-all duration-300 bg-white/70 border-white/80 ${
          isShaking ? 'animate-bounce' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img
                src={companyProfile.logoUrl || '/src/assets/images/app_logo.svg' || undefined}
                alt="Logo téléversé"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 id="pin-modal-title" className="font-display text-base font-semibold text-slate-950">
                Espace Administration
              </h2>
              <p className="text-xs text-slate-500">Validation automatique à 6 chiffres</p>
            </div>
          </div>

          <LiquidGlassButton
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
            className="!p-2 text-slate-600 hover:text-slate-950"
          >
            <X className="w-4 h-4" />
          </LiquidGlassButton>
        </div>

        {/* Corps : Boîtes d'affichage & Clavier tactile */}
        <div className="py-6 text-center select-none">
          <p className="text-xs sm:text-sm text-slate-600 mb-6">
            Touchez les 6 chiffres sur le clavier numérique.
          </p>

          {/* 6 Boîtes d'affichage sans input physique/android (affichage visuel pur) */}
          <div className={`flex items-center justify-center gap-2 sm:gap-3 mb-4 select-none ${isShaking ? 'animate-pulse' : ''}`}>
            {pinDigits.map((digit: string, idx: number) => (
              <div
                key={idx}
                className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border flex items-center justify-center text-xl sm:text-2xl font-mono-tabular font-bold transition-all duration-200 select-none ${
                  digit
                    ? 'bg-slate-900/10 border-slate-900/30 text-slate-950 shadow-inner'
                    : 'bg-white/60 border-white/90 text-slate-400'
                }`}
              >
                {digit ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-900" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                )}
              </div>
            ))}
          </div>

          {/* Pavé numérique tactile avec animation de rebond sur clic */}
          <div className="max-w-[260px] mx-auto grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-slate-900/10">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleVirtualKeyClick(num)}
                className={`py-3 rounded-2xl bg-white/60 hover:bg-white/90 active:scale-90 border border-white/90 text-base font-bold font-mono-tabular text-slate-900 transition-all cursor-pointer select-none shadow-2xs ${
                  bouncingKey === num ? 'keypad-bounce' : ''
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClearAll}
              className={`py-3 rounded-2xl bg-white/35 hover:bg-white/70 active:scale-90 border border-white/70 text-xs font-semibold text-slate-600 transition-all cursor-pointer select-none shadow-2xs ${
                bouncingKey === 'clear' ? 'keypad-bounce' : ''
              }`}
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={() => handleVirtualKeyClick('0')}
              className={`py-3 rounded-2xl bg-white/60 hover:bg-white/90 active:scale-90 border border-white/90 text-base font-bold font-mono-tabular text-slate-900 transition-all cursor-pointer select-none shadow-2xs ${
                bouncingKey === '0' ? 'keypad-bounce' : ''
              }`}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleVirtualBackspace}
              aria-label="Effacer le dernier chiffre"
              className={`py-3 rounded-2xl bg-white/35 hover:bg-white/70 active:scale-90 border border-white/70 text-slate-700 flex items-center justify-center transition-all cursor-pointer select-none shadow-2xs ${
                bouncingKey === 'backspace' ? 'keypad-bounce' : ''
              }`}
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pied : Bouton Annuler uniquement */}
        <div className="flex items-center justify-center pt-4 border-t border-slate-900/10">
          <LiquidGlassButton size="sm" onClick={onClose} className="px-6 text-slate-600 hover:text-slate-950">
            <span>Annuler</span>
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  );
};

