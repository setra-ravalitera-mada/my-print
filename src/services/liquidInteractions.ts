/**
 * Service global d'interactions optiques Liquid Glass (WWDC25 / iOS 26)
 * - Traque la réfraction optique du pointeur (--lg-x, --lg-y, --touch-x, --touch-y)
 * - Réinitialise les reflets à la sortie
 * - Optimisé 60 FPS, passif, n'interfère pas avec les événements de clic
 */

export function initLiquidGlassInteractions() {
  if (typeof window === 'undefined') return () => {};

  const handlePointerMove = (e: PointerEvent) => {
    // Uniquement pour les pointeurs fins ou souris (évite les calculs superflus sur mobile)
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('.liquid-glass, .glass, .glass-button');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty('--lg-x', `${x.toFixed(1)}%`);
      target.style.setProperty('--lg-y', `${y.toFixed(1)}%`);
      target.style.setProperty('--touch-x', `${x.toFixed(1)}%`);
      target.style.setProperty('--touch-y', `${y.toFixed(1)}%`);
    }
  };

  const handlePointerOut = (e: PointerEvent) => {
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('.liquid-glass, .glass, .glass-button');
    if (!target) return;

    if (e.relatedTarget && target.contains(e.relatedTarget as Node)) {
      return;
    }

    target.style.setProperty('--lg-x', '50%');
    target.style.setProperty('--lg-y', '50%');
    target.style.setProperty('--touch-x', '50%');
    target.style.setProperty('--touch-y', '50%');
  };

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerout', handlePointerOut, { passive: true });

  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerout', handlePointerOut);
  };
}
