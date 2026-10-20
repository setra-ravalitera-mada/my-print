import React, { useCallback } from 'react';

/**
 * Gestionnaire ultra-léger pour les surfaces Liquid Glass :
 * - Ajuste les variables CSS de survol sans bloquer le thread principal
 * - ZÉRO injection DOM au clic (suppression intégrale de l'effet de goutte d'eau lourd)
 * - Rétroaction immédiate et native à 60 FPS
 */
export function useLiquidGlassPointer() {
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Calcul throttlé / simplifié
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--touch-x', `${x.toFixed(1)}%`);
    target.style.setProperty('--touch-y', `${y.toFixed(1)}%`);
  }, []);

  return {
    onPointerMove: handlePointerMove,
  };
}
