import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-7 h-7',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill={color}
      aria-hidden="true"
    >
      <defs>
        {/* Pétale unitaire organique reproduisant fidèlement le logo trèfle 4 pétales */}
        <path
          id="app-logo-petal"
          d="M 464 478
             L 150 478
             C 95 478 52 452 32 405
             C 12 350 8 285 14 215
             C 18 160 26 95 32 28
             C 45 38 90 20 150 10
             C 215 2 285 2 355 12
             C 415 22 460 55 480 105
             C 485 120 485 140 485 170
             L 485 455
             C 485 470 475 478 464 478
             Z"
        />
      </defs>
      <g>
        <use href="#app-logo-petal" />
        <use href="#app-logo-petal" transform="rotate(90 500 500)" />
        <use href="#app-logo-petal" transform="rotate(180 500 500)" />
        <use href="#app-logo-petal" transform="rotate(270 500 500)" />
      </g>
    </svg>
  );
};

export default AppLogo;
