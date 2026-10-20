export interface FinishSimulatorItem {
  id: string;
  label: string;
  description: string;
}

export interface GuaranteeCardItem {
  id: string;
  iconName: 'Layers' | 'ShieldCheck' | 'Clock' | 'Sparkles' | 'Truck' | 'Package' | 'Award';
  title: string;
  detail: string;
}

export interface DeliveryTier {
  id: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
}

export interface EventSlide {
  id: string;
  shortTitle: string; // Nom court de l'événement
  description: string; // Description de l'événement
  imageUrl: string; // Image événementielle téléversée
  buttonText?: string; // Ex: "Acheter" / "Découvrir"
  productId?: string; // Produit associé si applicable
  active?: boolean;
}

export interface SiteContentConfig {
  heroTagline: string;
  heroHeading: string;
  heroDescription: string;
  heroImage?: string;
  heroImageMode?: 'split' | 'full'; // 'split' = Format petit / Côté à côté, 'full' = Pleine écran (Fond sous le calque texte)
  heroFinishSimulators: FinishSimulatorItem[];
  guaranteeCards: GuaranteeCardItem[];
  deliveryTiers?: DeliveryTier[];
  eventSlides?: EventSlide[];
}

export const DEFAULT_DELIVERY_TIERS: DeliveryTier[] = [
  { id: 'tier-1', minAmount: 0, maxAmount: 200000, fee: 5000 },
  { id: 'tier-2', minAmount: 200000, maxAmount: 500000, fee: 15000 },
  { id: 'tier-3', minAmount: 500000, maxAmount: 1000000, fee: 25000 },
  { id: 'tier-4', minAmount: 1000000, maxAmount: 3000000, fee: 30000 },
  { id: 'tier-5', minAmount: 3000000, maxAmount: 999999999, fee: 40000 },
];

export function calculateDeliveryFee(totalAmount: number, tiers?: DeliveryTier[]): number {
  const activeTiers = tiers && tiers.length > 0 ? tiers : DEFAULT_DELIVERY_TIERS;
  const sorted = [...activeTiers].sort((a, b) => a.minAmount - b.minAmount);
  for (const tier of sorted) {
    if (totalAmount >= tier.minAmount && (totalAmount < tier.maxAmount || tier.maxAmount === 0)) {
      return tier.fee;
    }
  }
  return sorted[sorted.length - 1]?.fee || 0;
}

export const DEFAULT_EVENT_SLIDES: EventSlide[] = [
  {
    id: 'evt-welcome-kit',
    shortTitle: 'Offre Spéciale Welcome Kit 2026',
    description: 'Coffrets sur-mesure pour onboarding collaborateurs et séminaires d’entreprise à Antananarivo.',
    imageUrl: '/src/assets/images/hero_custom_goodies_kit_1791981759014.jpg',
    buttonText: 'Acheter',
    active: true,
  },
  {
    id: 'evt-luxury-print',
    shortTitle: 'Édition Prestige Papeterie Lin',
    description: 'Carnets reliés toile de lin avec dorure à chaud et tranches argentées d’exception.',
    imageUrl: '/src/assets/images/hero_luxury_print_kit_1792003115399.jpg',
    buttonText: 'Acheter',
    active: true,
  },
  {
    id: 'evt-eco-totebag',
    shortTitle: 'Collection Éco-Responsable',
    description: 'Cabas structurés en coton bio certifié GOTS et gourdes isothermes gravées au laser.',
    imageUrl: '/src/assets/images/product_organic_totebag_1791981762796.jpg',
    buttonText: 'Acheter',
    active: true,
  },
];

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  heroTagline: 'My PRINT · Imprimerie de Goodies Personnalisés · Tarifs Grossiste · Dès 15 exemplaires',
  heroHeading: 'La matière minérale sublimée par votre empreinte de marque.',
  heroDescription:
    'Concevez chez My PRINT vos objets d’édition, coffrets d’accueil et supports imprimés sur-mesure. Gravure laser diamant, dorure à chaud sur toile de lin et sérigraphie aux encres à l’eau dès 1,6K Ar l’unité.',
  heroImage: '/src/assets/images/hero_luxury_print_kit_1792003115399.jpg',
  heroImageMode: 'split',
  heroFinishSimulators: [
    {
      id: 'laser',
      label: 'Laser 360°',
      description: 'Gravure Laser 360° — Creusement micrométrique inaltérable sur acier et grès',
    },
    {
      id: 'foil',
      label: 'Dorure à chaud',
      description: 'Marquage à Chaud — Transfert métallique par cliché magnésium sur toile de lin',
    },
    {
      id: 'screen',
      label: 'Sérigraphie',
      description: 'Sérigraphie Pantone — Encres à l’eau haute densité certifiées OEKO-TEX',
    },
  ],
  guaranteeCards: [
    {
      id: 'bat-4h',
      iconName: 'Layers',
      title: 'BAT Numérique en 4h',
      detail: 'Vérification vectorielle et simulation 3D avant lancement presse.',
    },
    {
      id: 'certified-mat',
      iconName: 'ShieldCheck',
      title: 'Matériaux Certifiés',
      detail: 'Coton GOTS 450g, papier FSC Munken et acier recyclé RCS.',
    },
    {
      id: 'express-prod',
      iconName: 'Clock',
      title: 'Production Express 5–9j',
      detail: 'Ateliers de marquage haute cadence sans intermédiaire.',
    },
    {
      id: 'tiered-rates',
      iconName: 'Sparkles',
      title: 'Tarifs Dégressifs Live',
      detail: 'Jusqu’à -18% en Ariary calculés automatiquement selon vos paliers.',
    },
  ],
  deliveryTiers: DEFAULT_DELIVERY_TIERS,
  eventSlides: DEFAULT_EVENT_SLIDES,
};

