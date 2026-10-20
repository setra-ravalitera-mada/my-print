export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  baseColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accentOrb1: string;
  accentOrb2: string;
  accentOrb3: string;
  swatchHex: string;
}

export interface SiteThemeConfig {
  mode: 'preset' | 'custom';
  presetId: string;
  customColor: string;
  baseColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accentOrb1: string;
  accentOrb2: string;
  accentOrb3: string;
  bgImageUrl?: string;
  bgBlur?: number;
  bgOpacity?: number;
  bgBrightness?: number;
  bgContrast?: number;
  bgSaturate?: number;
}

export interface EventBackgroundPreset {
  id: string;
  name: string;
  eventLabel: string;
  subtitle: string;
  badgeColor: string;
  imageUrl: string;
  defaultFilters: {
    blur: number;
    opacity: number;
    brightness: number;
    contrast: number;
    saturate: number;
  };
}

export function createSvgDataUri(svgString: string): string {
  if (svgString.startsWith('data:image/') || svgString.startsWith('http://') || svgString.startsWith('https://')) {
    if (svgString.startsWith('data:image/svg+xml;utf8,')) {
      const raw = svgString.replace('data:image/svg+xml;utf8,', '');
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
    }
    return svgString;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

export const EVENT_PRESET_BACKGROUNDS: EventBackgroundPreset[] = [
  {
    id: 'fete-nationale-mg',
    name: 'Fête Nationale Malgache (26 Juin)',
    eventLabel: '26 Juin · Madagascar',
    subtitle: 'Symboles rouge, vert et blanc d’indépendance',
    badgeColor: 'bg-red-600 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="gM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="33%" stop-color="#f8fafc"/><stop offset="66%" stop-color="#dc2626"/><stop offset="100%" stop-color="#16a34a"/></linearGradient><radialGradient id="burst" cx="70%" cy="40%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="100%" stop-color="#dc2626" stop-opacity="0.1"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#gM)"/><rect x="0" y="0" width="380" height="800" fill="#ffffff" opacity="0.9"/><rect x="380" y="0" width="820" height="400" fill="#dc2626" opacity="0.85"/><rect x="380" y="400" width="820" height="400" fill="#16a34a" opacity="0.85"/><circle cx="380" cy="400" r="300" fill="url(#burst)"/></svg>'),
    defaultFilters: { blur: 2, opacity: 75, brightness: 100, contrast: 105, saturate: 110 },
  },
  {
    id: 'noel-fetes',
    name: 'Noël & Festivités de Fin d’Année',
    eventLabel: 'Noël · Décembre',
    subtitle: 'Fond rouge velours, flocons et étoiles d’hiver',
    badgeColor: 'bg-emerald-700 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="gN" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#991b1b"/><stop offset="50%" stop-color="#b91c1c"/><stop offset="100%" stop-color="#064e3b"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#gN)"/><circle cx="200" cy="150" r="8" fill="#ffffff" opacity="0.8"/><circle cx="500" cy="120" r="12" fill="#ffffff" opacity="0.9"/><circle cx="900" cy="180" r="10" fill="#ffffff" opacity="0.85"/><circle cx="1050" cy="300" r="15" fill="#fef08a" opacity="0.7"/><polygon points="600,100 620,150 670,150 630,180 650,230 600,200 550,230 570,180 530,150 580,150" fill="#fef08a" opacity="0.65"/><polygon points="250,500 350,650 150,650" fill="#047857" opacity="0.5"/><polygon points="950,450 1080,650 820,650" fill="#047857" opacity="0.5"/></svg>'),
    defaultFilters: { blur: 3, opacity: 70, brightness: 95, contrast: 110, saturate: 115 },
  },
  {
    id: 'nouvel-an',
    name: 'Nouvel An & Réveillon',
    eventLabel: '1er Janvier · Réveillon',
    subtitle: 'Nuit dorée, champagne et feux d’artifice',
    badgeColor: 'bg-amber-600 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="gNY" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#090d16"/><stop offset="50%" stop-color="#171e2e"/><stop offset="100%" stop-color="#2e1005"/></linearGradient><radialGradient id="spark" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/><stop offset="100%" stop-color="#d97706" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#gNY)"/><circle cx="350" cy="250" r="220" fill="url(#spark)"/><circle cx="850" cy="300" r="280" fill="url(#spark)"/><circle cx="600" cy="550" r="180" fill="url(#spark)"/><circle cx="150" cy="180" r="3" fill="#ffffff"/><circle cx="450" cy="100" r="4" fill="#fde047"/><circle cx="950" cy="120" r="5" fill="#fde047"/><circle cx="1050" cy="480" r="4" fill="#ffffff"/></svg>'),
    defaultFilters: { blur: 2, opacity: 80, brightness: 105, contrast: 110, saturate: 120 },
  },
  {
    id: 'paques-printemps',
    name: 'Pâques & Renouveau du Printemps',
    eventLabel: 'Pâques · Avr / Mai',
    subtitle: 'Nuances pastel fraîches, fleurs et œufs abstraits',
    badgeColor: 'bg-pink-600 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdf2f8"/><stop offset="50%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#fef9c3"/></linearGradient><radialGradient id="egg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f472b6" stop-opacity="0.35"/><stop offset="100%" stop-color="#ec4899" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g1)"/><ellipse cx="300" cy="400" rx="180" ry="240" fill="url(#egg1)"/><ellipse cx="900" cy="350" rx="220" ry="280" fill="url(#egg1)"/><circle cx="200" cy="250" r="15" fill="#f472b6" opacity="0.5"/><circle cx="850" cy="200" r="20" fill="#fde047" opacity="0.6"/></svg>'),
    defaultFilters: { blur: 1, opacity: 85, brightness: 100, contrast: 100, saturate: 105 },
  },
  {
    id: 'assomption-celeste',
    name: 'Assomption & Rayonnement Céleste',
    eventLabel: 'Assomption · 15 Août',
    subtitle: 'Ciel azur brillant et rayons de lumière dorée',
    badgeColor: 'bg-sky-600 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0284c7"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient><radialGradient id="sun" cx="50%" cy="30%" r="40%"><stop offset="0%" stop-color="#fef08a" stop-opacity="0.8"/><stop offset="100%" stop-color="#fef08a" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g2)"/><circle cx="600" cy="240" r="260" fill="url(#sun)"/></svg>'),
    defaultFilters: { blur: 2, opacity: 80, brightness: 105, contrast: 105, saturate: 110 },
  },
  {
    id: 'fete-du-travail',
    name: 'Fête du Travail (1er Mai)',
    eventLabel: '1er Mai · Muguet',
    subtitle: 'Clochettes de muguet et fraîcheur verdoyante',
    badgeColor: 'bg-emerald-600 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="gMug" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0fdf4"/><stop offset="50%" stop-color="#dcfce7"/><stop offset="100%" stop-color="#bbf7d0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#gMug)"/><circle cx="250" cy="350" r="35" fill="#ffffff" opacity="0.9"/><circle cx="290" cy="420" r="28" fill="#ffffff" opacity="0.9"/><circle cx="320" cy="480" r="22" fill="#ffffff" opacity="0.9"/></svg>'),
    defaultFilters: { blur: 1, opacity: 85, brightness: 100, contrast: 100, saturate: 105 },
  },
  {
    id: 'toussaint-automne',
    name: 'Toussaint & Lumière d’Automne',
    eventLabel: 'Toussaint · 1er Novembre',
    subtitle: 'Chaleur ambrée et douceur dorée automnale',
    badgeColor: 'bg-orange-700 text-white',
    imageUrl: createSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="gTou" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff7ed"/><stop offset="50%" stop-color="#ffedd5"/><stop offset="100%" stop-color="#fed7aa"/></linearGradient><radialGradient id="glow" cx="50%" cy="40%" r="40%"><stop offset="0%" stop-color="#f97316" stop-opacity="0.5"/><stop offset="100%" stop-color="#ea580c" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#gTou)"/><circle cx="600" cy="350" r="300" fill="url(#glow)"/></svg>'),
    defaultFilters: { blur: 2, opacity: 80, brightness: 100, contrast: 105, saturate: 110 },
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'mineral-default',
    name: 'Minéral Naturel (Standard)',
    subtitle: 'Calcaire et ivoire poudré emblématique de My PRINT',
    baseColor: '#F4F2ED',
    gradientFrom: '#F7F5F0',
    gradientVia: '#F2EFE9',
    gradientTo: '#EBE7DF',
    accentOrb1: '#DCE8F7',
    accentOrb2: '#F5E6D3',
    accentOrb3: '#E2ECE9',
    swatchHex: '#F4F2ED',
  },
  {
    id: 'sand-travertine',
    name: 'Sable Chaud Travertin',
    subtitle: 'Tons chauds de pierre ocre et de grès ensoleillé',
    baseColor: '#F2ECE1',
    gradientFrom: '#F7F2EA',
    gradientVia: '#EFE8DC',
    gradientTo: '#E5DDCF',
    accentOrb1: '#FCEFD8',
    accentOrb2: '#F5DEB3',
    accentOrb3: '#E8D5B5',
    swatchHex: '#EFE8DC',
  },
  {
    id: 'mist-azure',
    name: 'Brume Céleste Cristalline',
    subtitle: 'Fraîcheur azur et réfraction glacée haute clarté',
    baseColor: '#EBF1F7',
    gradientFrom: '#F0F5FA',
    gradientVia: '#E8F0F7',
    gradientTo: '#DDE7F2',
    accentOrb1: '#CBE2F8',
    accentOrb2: '#E0EEFB',
    accentOrb3: '#D0E4F7',
    swatchHex: '#DDE7F2',
  },
  {
    id: 'sage-celadon',
    name: 'Sauge Céladon Botanique',
    subtitle: 'Teinte végétale douce inspirée du coton biologique',
    baseColor: '#EBF0E9',
    gradientFrom: '#F2F6F0',
    gradientVia: '#E8EFE5',
    gradientTo: '#DEE7DA',
    accentOrb1: '#D5E6D0',
    accentOrb2: '#EBF3E8',
    accentOrb3: '#CCE0C7',
    swatchHex: '#DEE7DA',
  },
  {
    id: 'slate-chalk',
    name: 'Craie & Ardoise Pure',
    subtitle: 'Esthétique architecturale minimaliste et moderne',
    baseColor: '#ECEEF2',
    gradientFrom: '#F4F5F8',
    gradientVia: '#EAECEF',
    gradientTo: '#DFE2E8',
    accentOrb1: '#D8DEEA',
    accentOrb2: '#E7EAF2',
    accentOrb3: '#CAD1DF',
    swatchHex: '#DFE2E8',
  },
  {
    id: 'rose-quartz',
    name: 'Quartz Rosé & Argile',
    subtitle: 'Élégance subtile, chaleur poudrée et douce',
    baseColor: '#F7EFF1',
    gradientFrom: '#FAF4F6',
    gradientVia: '#F4EBEE',
    gradientTo: '#EBDDE1',
    accentOrb1: '#F7DDE4',
    accentOrb2: '#FDEFF3',
    accentOrb3: '#ECCBD4',
    swatchHex: '#EBDDE1',
  },
];

export const DEFAULT_THEME_CONFIG: SiteThemeConfig = {
  mode: 'preset',
  presetId: 'mineral-default',
  customColor: '#F4F2ED',
  baseColor: '#F4F2ED',
  gradientFrom: '#F7F5F0',
  gradientVia: '#F2EFE9',
  gradientTo: '#EBE7DF',
  accentOrb1: '#DCE8F7',
  accentOrb2: '#F5E6D3',
  accentOrb3: '#E2ECE9',
};

/**
 * Calcule un dégradé et des orbes harmonieux à partir d'une couleur hexadécimale arbitraire
 */
export function generateThemeFromCustomHex(hex: string): SiteThemeConfig {
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
  return {
    mode: 'custom',
    presetId: 'custom',
    customColor: cleanHex,
    baseColor: cleanHex,
    gradientFrom: cleanHex,
    gradientVia: cleanHex,
    gradientTo: cleanHex,
    accentOrb1: cleanHex,
    accentOrb2: cleanHex,
    accentOrb3: cleanHex,
  };
}
