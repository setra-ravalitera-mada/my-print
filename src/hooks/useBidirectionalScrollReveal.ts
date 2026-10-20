import { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
  selector?: string;
  staggerStepMs?: number; // 80ms à 120ms (par défaut 95ms)
  threshold?: number;
  rootMargin?: string;
  deps?: any[];
}

/**
 * Hook pour animer les éléments en cascade bidirectionnelle au défilement (Scroll Reveal)
 * - Durée : 600 ms
 * - Déplacement vertical : 25 px
 * - Opacité : 0% à 100%
 * - Transition : ease-out
 * - Décalage Stagger : 80ms à 120ms (95ms par défaut)
 * - Bidirectionnel : réapparaît à chaque passage dans les deux sens de défilement
 */
export function useBidirectionalScrollReveal({
  selector = '.scroll-reveal',
  staggerStepMs = 95,
  threshold = 0,
  rootMargin = '15px 0px -25px 0px',
  deps = [],
}: ScrollRevealOptions = {}) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect de la préférence système de réduction de mouvement
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach((el) => {
        (el as HTMLElement).classList.add('is-revealed');
      });
      return;
    }

    // Calcul du délai en cascade (Stagger Effect)
    const setStaggerDelay = (el: HTMLElement, batchOrder = 0) => {
      const explicitIndex = el.getAttribute('data-stagger-index');
      let indexToUse: number;

      if (explicitIndex !== null) {
        const parsed = parseInt(explicitIndex, 10);
        indexToUse = isNaN(parsed) ? batchOrder : parsed;
      } else {
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll(selector));
          const sIndex = siblings.indexOf(el);
          indexToUse = sIndex > -1 ? sIndex : batchOrder;
        } else {
          indexToUse = batchOrder;
        }
      }

      // Grille responsive : 2 colonnes (mobile), 3-4 colonnes (tablette), 6 colonnes (desktop)
      const width = window.innerWidth;
      const colCount = width < 640 ? 2 : width < 1024 ? 4 : 6;
      const colIndex = indexToUse % colCount;

      const delay = Math.max(0, colIndex * staggerStepMs);
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let batchIndex = 0;
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            // Entrée dans le viewport (vers le bas ou vers le haut) : déclenchement du fade-up & stagger
            setStaggerDelay(target, batchIndex++);
            target.classList.add('is-revealed');
          } else {
            // Sortie du viewport : réinitialisation transparente pour permettre la ré-animation bidirectionnelle
            target.classList.remove('is-revealed');
            target.style.setProperty('--reveal-delay', '0ms');
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    const observer = observerRef.current;
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));

    // Surveillance des mutations du DOM pour observer les éléments injectés dynamiquement
    const mutationObserver = new MutationObserver(() => {
      const currentElements = document.querySelectorAll(selector);
      currentElements.forEach((el) => {
        observer.observe(el);
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [selector, staggerStepMs, threshold, rootMargin, ...deps]);
}
