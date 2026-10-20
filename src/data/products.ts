export type CategoryId = string;

export interface CategoryItem {
  id: string;
  label: string;
  subtitle: string;
  iconName?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  swatchHex: string;
  finishLabel: string;
}

export interface PrintMethod {
  id: string;
  name: string;
  detail: string;
  unitSurcharge: number;
}

export interface Product {
  id: string;
  name: string;             // Nom
  imageUrl: string;         // Photo
  technicalDetail: string;  // Détail technique
  sellingPrice: number;     // Prix de vente
  category: string;         // Categorie
  categoryLabel: string;

  // Rétrocompatibilité transparente
  basePrice: number;
  shortDescription?: string;
  fullDescription?: string;
  minOrderQty: number;
  quantityStep: number;
  leadTimeDays: number;
  tag?: string;
  specs: {
    material: string;
    dimensions: string;
    certification: string;
    printArea: string;
  };
  variants: ProductVariant[];
  printMethods: PrintMethod[];
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'drinkware',
    label: 'Drinkware & Céramique',
    subtitle: 'Bouteilles isothermes gravées au laser & grès émaillé mat',
    iconName: 'Coffee',
  },
  {
    id: 'stationery',
    label: 'Papeterie & Édition',
    subtitle: 'Carnets reliés en toile de lin, dorure à chaud & instruments d’écriture',
    iconName: 'BookOpen',
  },
  {
    id: 'textile',
    label: 'Textile & Sacs Bio',
    subtitle: 'Coton biologique lourd 450 g/m² & sérigraphie encres à l’eau Pantone',
    iconName: 'Shirt',
  },
  {
    id: 'packaging',
    label: 'Coffrets & Onboarding',
    subtitle: 'Boîtes rigides embossées à sec & kits de bienvenue collaborateurs',
    iconName: 'Package',
  },
];

export const CATEGORIES: { id: string; label: string; subtitle: string; count: number }[] = [
  {
    id: 'all',
    label: 'Toutes les éditions',
    subtitle: '',
    count: 6,
  },
  ...DEFAULT_CATEGORIES.map((c) => ({ ...c, count: 2 })),
];

export const HERO_IMAGE_URL = '/src/assets/images/hero_luxury_print_kit_1792003115399.jpg';

export const PRODUCTS: Product[] = [
  {
    id: 'stylo-roller-titane-usiné',
    name: 'Roller Architectural Aluminium & Titane',
    imageUrl: '/src/assets/images/hero_luxury_print_kit_1792003115399.jpg',
    technicalDetail: 'Aluminium anodisé Grade 6061 usiné CNC, recharge céramique Schmidt et étui carton minéral inclus. Dimensions : Ø 10,5 mm × L 139 mm (34 g). Marquage gravure laser 45 × 6 mm.',
    sellingPrice: 1600,
    category: 'stationery',
    categoryLabel: 'Papeterie',
    basePrice: 1600,
    shortDescription: 'Corps monobloc usiné CNC au moletage de précision, recharge Schmidt et étui tubulaire.',
    fullDescription: 'Équilibre pondéré en main et fermeture magnétique franche. Usiné dans une barre d’aluminium aéronautique anodisé mat avec grip micro-texturé, ce roller reçoit une gravure laser micrométrique sur son clip ou sa bague centrale.',
    minOrderQty: 25,
    quantityStep: 25,
    leadTimeDays: 5,
    tag: 'Usinage CNC',
    specs: {
      material: 'Aluminium anodisé Grade 6061 & recharge céramique',
      dimensions: 'Ø 10,5 mm × L 139 mm · Poids 34 g',
      certification: 'Rechargeable à vie · Étui carton minéral inclus',
      printArea: 'Bague ou corps supérieur (45 × 6 mm)',
    },
    variants: [
      { id: 'brushed-titanium', name: 'Titane Brossé', swatchHex: '#94A3B8', finishLabel: 'Anodisé satiné' },
      { id: 'champagne-sand', name: 'Sable Champagne', swatchHex: '#D6C7B2', finishLabel: 'Microbillé mat' },
    ],
    printMethods: [
      {
        id: 'micro-laser',
        name: 'Micro-Gravure Laser Fibre',
        detail: 'Précision 20 microns sur surface cylindrique',
        unitSurcharge: 0,
      },
    ],
  },
  {
    id: 'totebag-architecte-450g',
    name: 'Cabas Structuré Coton Bio 450 g/m²',
    imageUrl: '/src/assets/images/product_organic_totebag_1791981762796.jpg',
    technicalDetail: '100% Coton biologique certifié GOTS lourd 450 g/m² à soufflet large et sangles renforcées. Dimensions : 400 × 340 × 140 mm (anses 58 cm). Sérigraphie encres à l’eau 280 × 240 mm.',
    sellingPrice: 3200,
    category: 'textile',
    categoryLabel: 'Textile Bio',
    basePrice: 3200,
    shortDescription: 'Toile de coton canevas extra-lourde à soufflet large, sérigraphie encres à l’eau.',
    fullDescription: 'Loin des tote bags souples jetables, ce cabas architectural est coupé dans un canevas de coton biologique GOTS de 450 g/m² qui se tient droit seul. Doté de sangles épaisses surpiquées en croix.',
    minOrderQty: 50,
    quantityStep: 50,
    leadTimeDays: 5,
    tag: 'Canevas GOTS 450g',
    specs: {
      material: '100% Coton biologique certifié GOTS · 450 g/m²',
      dimensions: '400 × 340 × 140 mm · Anses épaules 58 cm',
      certification: 'GOTS & OEKO-TEX Standard 100',
      printArea: 'Recto / Verso grand format (280 × 240 mm)',
    },
    variants: [
      { id: 'ecru-raw', name: 'Écru Non Blanchi', swatchHex: '#EFECE6', finishLabel: 'Canevas moucheté' },
      { id: 'mineral-grey', name: 'Gris Calcaire', swatchHex: '#CBD5E1', finishLabel: 'Teinture minérale' },
    ],
    printMethods: [
      {
        id: 'water-screen',
        name: 'Sérigraphie Encres à l’Eau',
        detail: 'Toucher doux sans film plastique',
        unitSurcharge: 0,
      },
    ],
  },
  {
    id: 'carnet-lin-archive-a5',
    name: 'Carnet Relié Toile de Lin « Archive » A5',
    imageUrl: '/src/assets/images/product_linen_notebook_1791981763268.jpg',
    technicalDetail: 'Toile de lin naturel belge cousue à plat 180° et 192 pages papier suédois Munken Pure 120 g/m² ivoire. Format : 148 × 210 mm (A5). Marquage à chaud argent/or ou débossage 100 × 120 mm.',
    sellingPrice: 4500,
    category: 'stationery',
    categoryLabel: 'Papeterie',
    basePrice: 4500,
    shortDescription: 'Couverture rigide entoilée lin naturel, papier 120 g/m² Munken et marquage à chaud.',
    fullDescription: 'Reliure cousue au fil permettant une ouverture parfaitement à plat à 180°. Habillé d’une toile de lin belge et garni de 192 pages de papier Munken 120 g/m².',
    minOrderQty: 50,
    quantityStep: 25,
    leadTimeDays: 7,
    tag: 'Papier Munken 120g',
    specs: {
      material: 'Toile de lin naturel & papier Munken Pure 120 g/m²',
      dimensions: '148 × 210 mm (A5) · 192 pages pointillées',
      certification: 'FSC Mix Credit · Encres végétales',
      printArea: 'Couverture centrale (100 × 120 mm) & tranche',
    },
    variants: [
      { id: 'raw-linen', name: 'Lin Grège Naturel', swatchHex: '#D6CFC2', finishLabel: 'Tissage brut' },
      { id: 'obsidian-linen', name: 'Anthracite Fumée', swatchHex: '#3F3F46', finishLabel: 'Lin teint fil' },
    ],
    printMethods: [
      {
        id: 'foil-silver',
        name: 'Marquage à Chaud Métallisé',
        detail: 'Transfert thermique par cliché magnésium',
        unitSurcharge: 0,
      },
    ],
  },
  {
    id: 'mug-gres-et-coffret-embosse',
    name: 'Tasse Grès Céramique & Écrin Embossé',
    imageUrl: '/src/assets/images/product_ceramic_mug_box_1791981762961.jpg',
    technicalDetail: 'Grès minéral tourné cuit grand feu à 1240°C (310 ml) livré dans son coffret tiroir rigide 1200 g/m² Fedrigoni (135 × 135 × 110 mm) avec gaufrage en creux et tirage ruban.',
    sellingPrice: 6800,
    category: 'drinkware',
    categoryLabel: 'Drinkware',
    basePrice: 6800,
    shortDescription: 'Grès tourné émaillé sable mat livré dans son coffret rigide à tirage ruban et gaufrage.',
    fullDescription: 'Chaque tasse est façonnée en grès minéral moucheté offrant une inertie thermique remarquable, accompagnée d’un coffret tiroir en carton rigide 1200 g/m².',
    minOrderQty: 25,
    quantityStep: 25,
    leadTimeDays: 8,
    tag: 'Coffret Inclus',
    specs: {
      material: 'Grès céramique cuit à 1240°C & Coffret Fedrigoni',
      dimensions: 'Tasse 310 ml · Coffret 135 × 135 × 110 mm',
      certification: 'Contact alimentaire UE · Papier FSC',
      printArea: 'Flanc céramique (65 × 45 mm) + Couvercle coffret',
    },
    variants: [
      { id: 'travertine-sand', name: 'Grès Sable Travertin', swatchHex: '#DDD3C3', finishLabel: 'Émail mat moucheté' },
      { id: 'kaolin-white', name: 'Kaolin Pur', swatchHex: '#F5F5F4', finishLabel: 'Glaçure satinée' },
    ],
    printMethods: [
      {
        id: 'kiln-transfer',
        name: 'Cuisson Grand Feu + Coffret Embossé',
        detail: 'Émaillage indélébile et gaufrage coffret',
        unitSurcharge: 0,
      },
    ],
  },
  {
    id: 'gourde-isotherme-prisme-500',
    name: 'Flacon Isotherme Minéral 500 ml',
    imageUrl: '/src/assets/images/product_thermos_bottle_1791981759732.jpg',
    technicalDetail: 'Inox 304 recyclé à 90% double paroi sous vide 500 ml (24h frais / 12h chaud). Bouchon acier brossé sans BPA. Dimensions : Ø 72 mm × H 218 mm. Gravure laser 360° ou tampographie Pantone.',
    sellingPrice: 8500,
    category: 'drinkware',
    categoryLabel: 'Drinkware',
    basePrice: 8500,
    shortDescription: 'Acier recyclé double paroi au toucher pierre mate, gravure laser 360° haute précision.',
    fullDescription: 'Conçu pour les studios et agences exigeantes, ce flacon isotherme maintient les boissons fraîches pendant 24h et chaudes pendant 12h.',
    minOrderQty: 25,
    quantityStep: 25,
    leadTimeDays: 6,
    tag: 'Série Architecturale',
    specs: {
      material: 'Inox 304 recyclé à 90% & bouchon acier brossé',
      dimensions: 'Ø 72 mm × H 218 mm · 500 ml',
      certification: 'Sans BPA · Certifié RCS Recyclé',
      printArea: 'Cylindre 360° (180 × 95 mm) ou blason frontal',
    },
    variants: [
      { id: 'albaster', name: 'Albâtre Minéral', swatchHex: '#EAE7E1', finishLabel: 'Poudré mat' },
      { id: 'slate', name: 'Ardoise Basalte', swatchHex: '#334155', finishLabel: 'Velours mat' },
    ],
    printMethods: [
      {
        id: 'laser-360',
        name: 'Gravure Laser Diamant',
        detail: 'Inaltérable au lave-vaisselle',
        unitSurcharge: 0,
      },
    ],
  },
  {
    id: 'coffret-onboarding-signature',
    name: 'Coffret Welcome Kit « My PRINT Signature »',
    imageUrl: '/src/assets/images/hero_custom_goodies_kit_1791981759014.jpg',
    technicalDetail: 'Coffret rigide magnétique 1400 g/m² (330 × 255 × 105 mm) avec calage éco-responsable réunissant 4 pièces : Flacon isotherme inox, carnet lin A5, roller métal et cabas coton bio personnalisés.',
    sellingPrice: 15000,
    category: 'packaging',
    categoryLabel: 'Coffrets',
    basePrice: 15000,
    shortDescription: 'Écrin magnétique réunissant gobelet isotherme, carnet lin, stylo métal et cabas bio.',
    fullDescription: 'La dotation complète pour accueillir vos nouveaux talents ou remercier vos clients stratégiques. Réunit 4 pièces coordonnées dans une boîte cloche à fermeture magnétique.',
    minOrderQty: 15,
    quantityStep: 15,
    leadTimeDays: 9,
    tag: 'Édition Prestige',
    specs: {
      material: 'Coffret rigide 1400 g/m² + 4 pièces personnalisées',
      dimensions: '330 × 255 × 105 mm · Poids complet 1,15 kg',
      certification: '100% Sans plastique · Qualité Grossiste Premium',
      printArea: 'Personnalisation individuelle sur les 5 éléments',
    },
    variants: [
      { id: 'monolith-stone', name: 'Harmonie Pierre & Anthracite', swatchHex: '#E5E0D8', finishLabel: 'Assortiment coordonné' },
    ],
    printMethods: [
      {
        id: 'full-pack-branding',
        name: 'Pack Marquage Multi-Supports',
        detail: 'Laser, dorure et sérigraphie inclus',
        unitSurcharge: 0,
      },
    ],
  },
];

/**
 * Formate un montant en Ariary au format abrégé "K Ar" pour les cartes produits
 * Exemple : 1600 -> "1,6K Ar", 15000 -> "15K Ar", 8500 -> "8,5K Ar"
 */
export function formatCompactAriary(amount: number): string {
  if (amount >= 1000) {
    const inThousands = amount / 1000;
    const formatted = Number.isInteger(inThousands)
      ? String(inThousands)
      : inThousands.toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${formatted}K Ar`;
  }
  return `${Math.round(amount)} Ar`;
}

/**
 * Formate un montant complet en Ariary avec séparateur de milliers pour le panier et les détails
 * Exemple : 1600 -> "1 600 Ar", 127500 -> "127 500 Ar"
 */
export function formatFullAriary(amount: number): string {
  const rounded = Math.round(amount);
  const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSpaces} Ar`;
}

/**
 * Calcule le tarif unitaire dégressif en Ariary selon la quantité commandée
 */
export function calculateTieredUnitPrice(
  basePrice: number,
  surcharge: number,
  quantity: number,
  minOrderQty: number
): { unitPrice: number; discountPercent: number } {
  const rawUnit = basePrice + surcharge;
  let discountPercent = 0;

  if (quantity >= minOrderQty * 8) {
    discountPercent = 18;
  } else if (quantity >= minOrderQty * 4) {
    discountPercent = 12;
  } else if (quantity >= minOrderQty * 2) {
    discountPercent = 6;
  }

  const unitPrice = Math.round(rawUnit * (1 - discountPercent / 100));
  return { unitPrice, discountPercent };
}

/**
 * Paliers de budget avec arrêts de tranchant (de 100 000 Ar à 100 000 000 Ar)
 */
export const BUDGET_STOPS = [
  100000,
  250000,
  500000,
  1000000,
  2500000,
  5000000,
  10000000,
  25000000,
  50000000,
  100000000,
];

/**
 * Mappe un nom de couleur (ex: "Vert", "Vert Bouteille", "Red", "Black", etc.) ou un code Hex
 * vers un code couleur Hex réel et précis au lieu de basculer sur du bleu (#2563EB).
 */
export function resolveSwatchHex(colorNameOrHex?: string, fallbackHex: string = '#16A34A'): string {
  if (!colorNameOrHex) return fallbackHex;
  const trimmed = colorNameOrHex.trim();

  // Si c'est déjà un code Hex explicite
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) {
    // Si c'est le bleu par défaut (#2563EB) mais que le nom (si dispo) ou le nom de variante indique autre chose, laisser résoudre
    if (trimmed.toUpperCase() !== '#2563EB') {
      return trimmed;
    }
  }

  const norm = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Verts / Greens
  if (
    norm.includes('vert') ||
    norm.includes('green') ||
    norm.includes('kaki') ||
    norm.includes('khaki') ||
    norm.includes('sapin') ||
    norm.includes('olive') ||
    norm.includes('lime') ||
    norm.includes('emeraude') ||
    norm.includes('emerald') ||
    norm.includes('menthe') ||
    norm.includes('bouteille') ||
    norm.includes('pistache') ||
    norm.includes('sauge') ||
    norm.includes('sage')
  ) {
    return '#16A34A'; // Vert
  }

  // Rouges / Reds
  if (
    norm.includes('rouge') ||
    norm.includes('red') ||
    norm.includes('bordeaux') ||
    norm.includes('burgundy') ||
    norm.includes('cerise') ||
    norm.includes('carmin') ||
    norm.includes('vermillon')
  ) {
    return '#DC2626'; // Rouge
  }

  // Noirs / Blacks
  if (
    norm.includes('noir') ||
    norm.includes('black') ||
    norm.includes('charcoal') ||
    norm.includes('obsidienne') ||
    norm.includes('basalte') ||
    norm.includes('ebene') ||
    norm.includes('ebony')
  ) {
    return '#18181B'; // Noir
  }

  // Blancs / Whites
  if (
    norm.includes('blanc') ||
    norm.includes('white') ||
    norm.includes('ivoire') ||
    norm.includes('ivory') ||
    norm.includes('ecru') ||
    norm.includes('neige') ||
    norm.includes('kaolin')
  ) {
    return '#FFFFFF'; // Blanc
  }

  // Jaunes / Yellows
  if (
    norm.includes('jaune') ||
    norm.includes('yellow') ||
    norm.includes('citron') ||
    norm.includes('amber') ||
    norm.includes('ambre') ||
    norm.includes('gold') ||
    norm.includes('champagne')
  ) {
    return '#EAB308'; // Jaune
  }

  // Oranges
  if (
    norm.includes('orange') ||
    norm.includes('cuivre') ||
    norm.includes('copper') ||
    norm.includes('coral') ||
    norm.includes('corail')
  ) {
    return '#EA580C'; // Orange
  }

  // Bleus / Blues
  if (
    norm.includes('bleu') ||
    norm.includes('blue') ||
    norm.includes('cyan') ||
    norm.includes('marine') ||
    norm.includes('navy') ||
    norm.includes('azur') ||
    norm.includes('indigo') ||
    norm.includes('turquoise') ||
    norm.includes('royal')
  ) {
    return '#2563EB'; // Bleu
  }

  // Gris / Greys
  if (
    norm.includes('gris') ||
    norm.includes('grey') ||
    norm.includes('gray') ||
    norm.includes('argent') ||
    norm.includes('silver') ||
    norm.includes('ardoise') ||
    norm.includes('calcaire')
  ) {
    return '#64748B'; // Gris
  }

  // Roses / Pinks
  if (
    norm.includes('rose') ||
    norm.includes('pink') ||
    norm.includes('fuchsia') ||
    norm.includes('magenta')
  ) {
    return '#EC4899'; // Rose
  }

  // Violets / Purples
  if (
    norm.includes('violet') ||
    norm.includes('purple') ||
    norm.includes('pourpre') ||
    norm.includes('prune') ||
    norm.includes('plum') ||
    norm.includes('lavande') ||
    norm.includes('mauve')
  ) {
    return '#8B5CF6'; // Violet
  }

  // Marrons / Browns
  if (
    norm.includes('marron') ||
    norm.includes('brown') ||
    norm.includes('chocolat') ||
    norm.includes('taupe') ||
    norm.includes('noisette') ||
    norm.includes('havane') ||
    norm.includes('beige') ||
    norm.includes('sable') ||
    norm.includes('travertin')
  ) {
    return '#78350F'; // Marron
  }

  // Si c'est un hex explicite valide
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) {
    return trimmed;
  }

  return fallbackHex;
}

/**
 * Corrige et assainit automatiquement la couleur des variantes d'un produit
 */
export function sanitizeProductColors(product: Product): Product {
  if (!product.variants || product.variants.length === 0) return product;

  const sanitizedVariants = product.variants.map((variant) => {
    const nameHex = resolveSwatchHex(variant.name, variant.swatchHex);
    // Si la couleur actuelle est le bleu générique #2563EB ou si le nom correspond à une couleur connue (ex: Vert), appliquer la couleur résolue
    let finalHex = variant.swatchHex;
    if (!finalHex || finalHex.toUpperCase() === '#2563EB' || nameHex !== '#16A34A') {
      finalHex = nameHex;
    } else {
      finalHex = resolveSwatchHex(variant.name, variant.swatchHex);
    }

    return {
      ...variant,
      swatchHex: finalHex,
    };
  });

  return {
    ...product,
    variants: sanitizedVariants,
  };
}

