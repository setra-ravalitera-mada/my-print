import React, { useState, useRef, useCallback } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCcw, Package } from 'lucide-react';

interface AmazonImageZoomProps {
  src?: string;
  alt: string;
  className?: string;
  hasFailedImage?: boolean;
}

export const AmazonImageZoom: React.FC<AmazonImageZoomProps> = ({
  src,
  alt,
  className = '',
  hasFailedImage = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState<number>(2.5);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setCoords({ x, y });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];

    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));

    setCoords({ x, y });
    setIsHovered(true);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const increaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(4, +(prev + 0.5).toFixed(1)));
  };

  const decreaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(1.5, +(prev - 0.5).toFixed(1)));
  };

  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(2.5);
    setCoords({ x: 50, y: 50 });
  };

  if (!src || hasFailedImage) {
    return (
      <div className={`relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[380px] sm:max-h-[440px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100/90 border border-white/90 shadow-md flex flex-col items-center justify-center p-6 text-slate-400 ${className}`}>
        <Package className="w-12 h-12 mb-2 text-slate-400 stroke-1" />
        <span className="text-xs font-medium text-slate-500">Photo non disponible</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsHovered(false)}
      className={`relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[380px] sm:max-h-[440px] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/90 border border-white/90 shadow-md select-none ${
        isHovered ? 'cursor-crosshair' : 'cursor-zoom-in'
      } ${className}`}
      aria-label={`Photo zoomable de ${alt}`}
    >
      {/* Image produit avec transformation fluide style Amazon */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain p-2 sm:p-4 pointer-events-none will-change-transform"
        style={{
          transformOrigin: `${coords.x}% ${coords.y}%`,
          transform: isHovered ? `scale(${zoomLevel})` : 'scale(1)',
          transition: isHovered
            ? 'transform 0.06s ease-out'
            : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.28s ease',
        }}
      />

      {/* Réticule loupe discret qui suit la position (Style Amazon) */}
      {isHovered && (
        <div
          className="absolute pointer-events-none rounded-xl border border-blue-500/30 bg-blue-500/10 shadow-sm hidden sm:block"
          style={{
            width: '120px',
            height: '120px',
            left: `${coords.x}%`,
            top: `${coords.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Badge guide en bas à gauche */}
      <div
        className={`absolute bottom-3 left-3 pointer-events-none transition-all duration-300 ${
          isHovered ? 'opacity-90 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium shadow-md">
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>{isHovered ? `Zoom ${zoomLevel}x · Explorez avec la souris` : 'Survolez pour zoomer'}</span>
        </span>
      </div>

      {/* Outils de contrôle du zoom flottants en haut à droite (Amazon Pro) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
        <button
          type="button"
          onClick={decreaseZoom}
          disabled={zoomLevel <= 1.5}
          title="Réduire le zoom"
          aria-label="Réduire le zoom"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] font-bold text-slate-800 px-1.5 min-w-[34px] text-center select-none">
          {zoomLevel}x
        </span>

        <button
          type="button"
          onClick={increaseZoom}
          disabled={zoomLevel >= 4}
          title="Augmenter le zoom"
          aria-label="Augmenter le zoom"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {zoomLevel !== 2.5 && (
          <button
            type="button"
            onClick={resetZoom}
            title="Réinitialiser zoom standard (2.5x)"
            aria-label="Réinitialiser zoom"
            className="w-7 h-7 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer ml-0.5"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
