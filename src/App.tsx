import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Settings,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  Check,
  ArrowRight,
  ArrowDown,
  Layers,
  ShieldCheck,
  Clock,
  RotateCcw,
  Eye,
  Package,
  Lock,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Info,
  FileText,
  Smartphone,
  Truck,
  CreditCard,
  Send,
  Printer,
  Download,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  MessageCircle,
  ArrowUpDown,
  Tags,
  Coffee,
  BookOpen,
  Shirt,
  Tag,
  Folder,
  Crown,
  Grid,
  Upload,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  PRODUCTS,
  CATEGORIES,
  HERO_IMAGE_URL,
  Product,
  CategoryId,
  CategoryItem,
  calculateTieredUnitPrice,
  formatCompactAriary,
  formatFullAriary,
  BUDGET_STOPS,
} from './data/products';
import { useLiquidGlassPointer } from './hooks/useLiquidGlassPointer';
import { useBidirectionalScrollReveal } from './hooks/useBidirectionalScrollReveal';
import { LiquidGlassButton } from './components/LiquidGlassButton';
import { LiquidGlassSwitch, LiquidGlassTooltip } from './components/liquid';
import { LiquidModal } from './components/LiquidModal';
import { AdminPortal } from './components/AdminPortal';
import { AdminPinModal } from './components/AdminPinModal';
import { AppLogo } from './components/AppLogo';
import { AmazonImageZoom } from './components/AmazonImageZoom';
import {
  saveNewOrder,
  notifyNewOrder,
  getSiteTheme,
  fetchSiteThemeFromFirestore,
  subscribeToSiteTheme,
  getSiteContent,
  fetchSiteContentFromFirestore,
  subscribeToSiteContent,
  getStoredProducts,
  fetchProductsFromFirestore,
  subscribeToProducts,
  getStoredCategories,
  fetchCategoriesFromFirestore,
  subscribeToCategories,
  getCompanyProfile,
  fetchCompanyProfileFromFirestore,
  subscribeToCompanyProfile,
  CompanyProfile,
} from './services/adminStorage';
import { CustomerOrder } from './types/order';
import { SiteThemeConfig } from './types/theme';
import {
  SiteContentConfig,
  calculateDeliveryFee,
  DEFAULT_DELIVERY_TIERS,
  EventSlide,
  DEFAULT_EVENT_SLIDES,
} from './types/siteContent';
import { executeMVolaMerchantPay, getMVolaConfig } from './services/mvolaService';

export const GoogleMapsColorIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 7.35 12.3.38.38.98.38 1.36 0C13 22 20 15.25 20 10c0-4.42-3.58-8-8-8z"
      fill="#EA4335"
    />
    <path
      d="M12 2C7.58 2 4 5.58 4 10c0 2.5 1.2 5.2 2.8 7.5L12 10V2z"
      fill="#4285F4"
    />
    <path
      d="M12 22.3c.38-.38 7.35-7.13 7.35-12.3 0-2.2-.9-4.2-2.3-5.7L12 10v12.3z"
      fill="#34A853"
    />
    <path
      d="M12 2c2.8 0 5.3 1.4 6.8 3.6L12 10V2z"
      fill="#FBBC04"
    />
    <circle cx="12" cy="9.5" r="3.2" fill="#FFFFFF" />
  </svg>
);

export interface HeroSlideItem {
  id: string;
  shortTitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
}

interface CustomizationDraft {
  variantId: string;
  printMethodId: string;
  quantity: number;
  customBrandingText: string;
  pantoneReference?: string;
  customizationType?: 'texte' | 'logo';
  customLogoUrl?: string;
  productId?: string;
}

interface CartItem {
  cartItemId: string;
  product: Product;
  variantId: string;
  variantName: string;
  swatchHex: string;
  printMethodId: string;
  printMethodName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  customBrandingText: string;
  pantoneReference: string;
  customizationType?: 'texte' | 'logo';
  customLogoUrl?: string;
}

interface ToastNotification {
  id: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
}

const SORT_OPTIONS: {
  id: 'featured' | 'price-asc' | 'price-desc' | 'lead-time';
  label: string;
  shortLabel: string;
  tag: string;
  badgeColor: string;
  offsetClass: string;
}[] = [
  {
    id: 'featured',
    label: 'Sélection My PRINT',
    shortLabel: 'Sélection',
    tag: 'Recommandé',
    badgeColor: 'bg-blue-500/15 text-blue-700',
    offsetClass: 'translate-x-0',
  },
  {
    id: 'price-asc',
    label: 'Prix unitaire croissant',
    shortLabel: 'Prix croissant',
    tag: '1,6k → 24,5k Ar',
    badgeColor: 'bg-emerald-500/15 text-emerald-700',
    offsetClass: 'translate-x-1 sm:translate-x-2',
  },
  {
    id: 'price-desc',
    label: 'Prix unitaire décroissant',
    shortLabel: 'Prix décroissant',
    tag: '24,5k → 1,6k Ar',
    badgeColor: 'bg-amber-500/15 text-amber-700',
    offsetClass: 'translate-x-2 sm:translate-x-3.5',
  },
  {
    id: 'lead-time',
    label: 'Délai de fabrication express',
    shortLabel: 'Délai express',
    tag: '⚡ 5–7 jours',
    badgeColor: 'bg-indigo-500/15 text-indigo-700',
    offsetClass: 'translate-x-1 sm:translate-x-2',
  },
];

export default function App() {
  // État de navigation et de filtrage avec direction de transition simulée
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [viewDirection, setViewDirection] = useState<'forward' | 'backward'>('forward');
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxUnitPrice, setMaxUnitPrice] = useState<number>(15000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'lead-time'>('featured');

  // Barre de recherche compacte en rond qui s'allonge au clic
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Menu déroulant de tri iOS 26 avec affichage d'éléments décalés
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  // Activation du filtre par budget unitaire (compacté par défaut)
  const [isUnitPriceFilterActive, setIsUnitPriceFilterActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('myprint_unit_price_filter_active');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('myprint_unit_price_filter_active', JSON.stringify(isUnitPriceFilterActive));
  }, [isUnitPriceFilterActive]);

  // Si du texte est saisi, maintenir la recherche ouverte
  useEffect(() => {
    if (searchQuery) {
      setIsSearchExpanded(true);
    }
  }, [searchQuery]);

  // Fermer la recherche ou le menu de tri si clic à l'extérieur
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        !searchQuery
      ) {
        setIsSearchExpanded(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [searchQuery]);

  // Navigation mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Aperçu interactif dans la bannière Hero
  const [heroPrintPreview, setHeroPrintPreview] = useState<'laser' | 'foil' | 'screen'>('laser');

  // État des modales et références des boutons déclencheurs pour le retour du focus
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);
  const [orderQuoteConfirmed, setOrderQuoteConfirmed] = useState<string | null>(null);
  const [orderClientNote, setOrderClientNote] = useState<string>('');

  const handleShareProduct = useCallback(async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    const shareText = `Découvrez ${product.name} chez My PRINT Madagascar !`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // En cas d'annulation ou d'erreur sur le partage natif, fallback sur la modale
      }
    }

    setSharingProduct(product);
  }, []);

  // Modale Demande de Proforma
  const [isProformaModalOpen, setIsProformaModalOpen] = useState<boolean>(false);
  const [proformaChannel, setProformaChannel] = useState<'email' | 'whatsapp'>('email');
  const [proformaEmail, setProformaEmail] = useState<string>('');
  const [proformaName, setProformaName] = useState<string>('');
  const [proformaPhone, setProformaPhone] = useState<string>('');
  const [proformaSuccessRef, setProformaSuccessRef] = useState<string | null>(null);

  // Modale Choix du Mode de Paiement (MVola & Livraison)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentOption, setPaymentOption] = useState<'mvola' | 'livraison'>('livraison');
  const [mvolaPhone, setMvolaPhone] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [mvolaStep, setMvolaStep] = useState<'idle' | 'push_sent' | 'success'>('idle');
  const [mvolaTxnRef, setMvolaTxnRef] = useState<string>('');
  const [deliveryName, setDeliveryName] = useState<string>('');
  const [deliveryPhone, setDeliveryPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<CustomerOrder | null>(null);

  // Système de Glissement & Saisie : Budget Portefeuille (100.000 Ar à 100.000.000 Ar)
  const [isBudgetActive, setIsBudgetActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('myprint_budget_active');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [budgetMode, setBudgetMode] = useState<'glisser' | 'saisir'>(() => {
    try {
      const saved = localStorage.getItem('myprint_budget_mode');
      return saved === 'saisir' ? 'saisir' : 'glisser';
    } catch {
      return 'glisser';
    }
  });

  const [budgetStopIndex, setBudgetStopIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('myprint_budget_stop_index');
      return saved !== null ? Number(saved) : 3; // Defaut: 1 000 000 Ar
    } catch {
      return 3;
    }
  });

  const [customBudgetAmount, setCustomBudgetAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('myprint_custom_budget_amount');
      return saved !== null ? Number(saved) : 1000000;
    } catch {
      return 1000000;
    }
  });

  // Mémorisation dans le navigateur du choix budgétaire
  useEffect(() => {
    localStorage.setItem('myprint_budget_active', JSON.stringify(isBudgetActive));
  }, [isBudgetActive]);

  useEffect(() => {
    localStorage.setItem('myprint_budget_mode', budgetMode);
  }, [budgetMode]);

  useEffect(() => {
    localStorage.setItem('myprint_budget_stop_index', String(budgetStopIndex));
  }, [budgetStopIndex]);

  useEffect(() => {
    localStorage.setItem('myprint_custom_budget_amount', String(customBudgetAmount));
  }, [customBudgetAmount]);

  // Option de livraison avec calcul automatique des frais selon la grille
  const [isDeliveryActive, setIsDeliveryActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('myprint_delivery_active');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('myprint_delivery_active', JSON.stringify(isDeliveryActive));
  }, [isDeliveryActive]);

  // État dynamique du catalogue produits (Chargé depuis local/Firestore)
  const [products, setProducts] = useState<Product[]>(getStoredProducts());

  // État du profil et logo de la société
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    fetchCompanyProfileFromFirestore().then((remoteCp) => setCompanyProfile(remoteCp));
    const unsubCompany = subscribeToCompanyProfile((liveCp) => setCompanyProfile(liveCp));
    const handleCompanyUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<CompanyProfile>;
      if (customEvent && customEvent.detail) {
        setCompanyProfile(customEvent.detail);
      } else {
        setCompanyProfile(getCompanyProfile());
      }
    };
    window.addEventListener('myprint_company_profile_changed', handleCompanyUpdate);
    window.addEventListener('storage', handleCompanyUpdate);
    return () => {
      unsubCompany();
      window.removeEventListener('myprint_company_profile_changed', handleCompanyUpdate);
      window.removeEventListener('storage', handleCompanyUpdate);
    };
  }, []);

  useEffect(() => {
    fetchProductsFromFirestore().then((remotePts) => setProducts(remotePts));
    const unsubProducts = subscribeToProducts((livePts) => setProducts(livePts));
    const handleProductsUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (customEvent && customEvent.detail && Array.isArray(customEvent.detail)) {
        setProducts(customEvent.detail);
      } else {
        setProducts(getStoredProducts());
      }
    };
    window.addEventListener('myprint_products_changed', handleProductsUpdate);
    window.addEventListener('storage', handleProductsUpdate);
    return () => {
      unsubProducts();
      window.removeEventListener('myprint_products_changed', handleProductsUpdate);
      window.removeEventListener('storage', handleProductsUpdate);
    };
  }, []);

  const [categories, setCategories] = useState<CategoryItem[]>(getStoredCategories());

  useEffect(() => {
    fetchCategoriesFromFirestore().then((cats) => setCategories(cats));
    const unsubCats = subscribeToCategories((cats) => setCategories(cats));
    const handleCatsUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<CategoryItem[]>;
      if (customEvent && customEvent.detail && Array.isArray(customEvent.detail)) {
        setCategories(customEvent.detail);
      } else {
        setCategories(getStoredCategories());
      }
    };
    window.addEventListener('myprint_categories_changed', handleCatsUpdate);
    window.addEventListener('storage', handleCatsUpdate);
    return () => {
      unsubCats();
      window.removeEventListener('myprint_categories_changed', handleCatsUpdate);
      window.removeEventListener('storage', handleCatsUpdate);
    };
  }, []);

  const activeCategoriesList = useMemo(() => {
    // 1. Ne conserver que les catégories dont au moins un produit existe réellement dans le catalogue
    const existingConfigured = categories
      .map((c) => {
        const cId = (c.id || '').trim().toLowerCase();
        const cLabel = (c.label || '').trim().toLowerCase();
        const count = products.filter((p) => {
          if (!p.category) return false;
          const pCat = p.category.trim().toLowerCase();
          const pLabel = (p.categoryLabel || '').trim().toLowerCase();
          return pCat === cId || pCat === cLabel || (pLabel && pLabel === cLabel);
        }).length;
        return {
          ...c,
          count,
        };
      })
      .filter((c) => c.count > 0);

    // 2. Détecter les produits ayant une catégorie non déclarée dans categories
    const configuredKeys = new Set(
      categories.flatMap((c) => [(c.id || '').trim().toLowerCase(), (c.label || '').trim().toLowerCase()])
    );
    const extraCategories: { id: string; label: string; subtitle: string; count: number }[] = [];

    products.forEach((p) => {
      const pCat = (p.category || '').trim();
      const pCatLower = pCat.toLowerCase();
      if (!pCat) return;

      const isConfigured = configuredKeys.has(pCatLower) ||
        existingConfigured.some((c) => (c.label || '').trim().toLowerCase() === (p.categoryLabel || '').trim().toLowerCase());
      const isAlreadyExtra = extraCategories.some(
        (e) => e.id.trim().toLowerCase() === pCatLower
      );

      if (!isConfigured && !isAlreadyExtra) {
        const count = products.filter(
          (item) => item.category && item.category.trim().toLowerCase() === pCatLower
        ).length;
        if (count > 0) {
          extraCategories.push({
            id: p.category,
            label: p.categoryLabel || p.category,
            subtitle: '',
            count,
          });
        }
      }
    });

    return [
      { id: 'all', label: 'Toutes les éditions', subtitle: '', count: products.length },
      ...existingConfigured,
      ...extraCategories,
    ];
  }, [categories, products]);

  // Si la catégorie actuellement sélectionnée n'a plus de produits, basculer sur "Toutes les éditions"
  useEffect(() => {
    if (activeCategory !== 'all') {
      const exists = activeCategoriesList.some((c) => c.id === activeCategory && c.count > 0);
      if (!exists) {
        setActiveCategory('all');
      }
    }
  }, [activeCategoriesList, activeCategory]);

  // Montant effectif du budget (Glissé ou Saisi)
  const effectiveBudget = useMemo(() => {
    if (budgetMode === 'saisir') {
      return Math.max(100000, customBudgetAmount || 100000);
    }
    return BUDGET_STOPS[budgetStopIndex] || 1000000;
  }, [budgetMode, customBudgetAmount, budgetStopIndex]);

  const calculateQtyForBudget = useCallback((product: Product, budget: number): number => {
    if (!product || budget <= 0) return 0;
    let q = Math.floor(budget / product.basePrice);
    if (q <= 0) return 0;
    const tiered = calculateTieredUnitPrice(product.basePrice, 0, q, product.minOrderQty);
    if (tiered.unitPrice < product.basePrice && tiered.unitPrice > 0) {
      q = Math.floor(budget / tiered.unitPrice);
    }
    return q;
  }, []);

  // Boîte de dialogue de quantité rapide (mobile & direct)
  const [quickQtyProduct, setQuickQtyProduct] = useState<Product | null>(null);
  const [quickQtyValue, setQuickQtyValue] = useState<number | string>(50);
  const [quickQtyVariantId, setQuickQtyVariantId] = useState<string>('');
  const [quickQtyIsCustomized, setQuickQtyIsCustomized] = useState<boolean>(false);
  const [quickQtyCustomType, setQuickQtyCustomType] = useState<'text' | 'image'>('text');
  const [quickQtyCustomText, setQuickQtyCustomText] = useState<string>('');
  const [quickQtyCustomLogo, setQuickQtyCustomLogo] = useState<string>('');

  const openQuickQtyDialog = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentDraft = draftsByProduct[product.id];
    let defaultQty = currentDraft?.quantity || product.minOrderQty;
    if (isBudgetActive) {
      const budgetQty = calculateQtyForBudget(product, effectiveBudget);
      if (budgetQty >= product.minOrderQty) {
        defaultQty = budgetQty;
      }
    }
    setQuickQtyProduct(product);
    setQuickQtyValue(defaultQty);
    setQuickQtyVariantId(currentDraft?.variantId || product.variants[0]?.id || '');
    setQuickQtyIsCustomized(false);
    setQuickQtyCustomType('text');
    setQuickQtyCustomText(currentDraft?.customBrandingText || '');
    setQuickQtyCustomLogo('');
  };

  // État de l'espace Paramètres & Administration sécurisé
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Thème et fond de couleur du site (synchronisé en temps réel avec Firestore)
  const [siteTheme, setSiteTheme] = useState<SiteThemeConfig>(getSiteTheme());
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(getSiteContent());

  useEffect(() => {
    const handleThemeUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<SiteThemeConfig>;
      if (customEvent?.detail) {
        setSiteTheme(customEvent.detail);
      } else {
        setSiteTheme(getSiteTheme());
      }
    };

    fetchSiteThemeFromFirestore().then((theme) => setSiteTheme(theme));
    const unsubscribeTheme = subscribeToSiteTheme((theme) => setSiteTheme(theme));

    window.addEventListener('myprint_theme_changed', handleThemeUpdate);
    window.addEventListener('storage', handleThemeUpdate);

    fetchSiteContentFromFirestore().then((content) => setSiteContent(content));
    const unsubscribeContent = subscribeToSiteContent((content) => setSiteContent(content));

    return () => {
      unsubscribeTheme();
      window.removeEventListener('myprint_theme_changed', handleThemeUpdate);
      window.removeEventListener('storage', handleThemeUpdate);
      unsubscribeContent();
    };
  }, []);

  // Carrousel dynamique d'images événementielles (changement toutes les 4s)
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(0);
  const [isHeroSlidePaused, setIsHeroSlidePaused] = useState<boolean>(false);

  const heroSlides: HeroSlideItem[] = useMemo(() => {
    const events: EventSlide[] = (siteContent.eventSlides || DEFAULT_EVENT_SLIDES).filter(
      (s: EventSlide) => s.active !== false
    );
    if (events.length > 0) {
      return events.map((evt: EventSlide) => ({
        id: `hero-event-${evt.id}-${evt.imageUrl || ''}`,
        shortTitle: evt.shortTitle,
        description: evt.description,
        imageUrl: evt.imageUrl,
        buttonText: evt.buttonText || 'Acheter',
      }));
    }
    const list = products && products.length > 0 ? products : PRODUCTS;
    return list.map((product) => ({
      id: `hero-slide-${product.id}`,
      shortTitle: product.name,
      description: product.shortDescription || 'Édition personnalisée My PRINT',
      imageUrl: product.imageUrl,
      buttonText: 'Acheter',
    }));
  }, [siteContent.eventSlides, products]);

  const activeSlideIndex = heroSlides.length > 0 ? heroSlideIndex % heroSlides.length : 0;
  const currentHeroSlide = heroSlides[activeSlideIndex] || heroSlides[0];

  useEffect(() => {
    if (heroSlideIndex >= heroSlides.length && heroSlides.length > 0) {
      setHeroSlideIndex(0);
    }
  }, [heroSlides.length, heroSlideIndex]);

  // Carrousel dynamique d'images & dotations pour la carte principale (changement toutes les 4s avec glissement)
  useEffect(() => {
    if (isHeroSlidePaused || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHeroSlidePaused, heroSlides.length]);

  const lastProductTriggerRef = useRef<HTMLElement | null>(null);
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Conservation des saisies de formulaires par produit (persistance lors d'une fermeture temporaire)
  const [draftsByProduct, setDraftsByProduct] = useState<Record<string, CustomizationDraft>>(() => {
    const initial: Record<string, CustomizationDraft> = {};
    for (const p of PRODUCTS) {
      initial[p.id] = {
        variantId: p.variants[0].id,
        printMethodId: p.printMethods[0].id,
        quantity: p.minOrderQty * 2,
        customBrandingText: '',
        pantoneReference: '',
      };
    }
    return initial;
  });

const GmailGIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

  // Panier vide par défaut (même après actualisation), mis à jour uniquement lorsque le client ajoute manuellement des données via Acheter
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('myprint_active_cart_v3', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Notification flottante en verre avec onde lors d'un ajout au panier
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Équilibrer automatiquement les quantités du panier selon le budget
  const balanceCartForBudget = useCallback(() => {
    if (cart.length === 0) return;
    const targetBudget = effectiveBudget;
    const N = cart.length;
    const itemBudget = targetBudget / N;

    const updatedCart = cart.map((item) => {
      let q = calculateQtyForBudget(item.product, itemBudget);
      if (q < item.product.minOrderQty) {
        q = item.product.minOrderQty;
      }
      const tiered = calculateTieredUnitPrice(
        item.product.basePrice,
        0,
        q,
        item.product.minOrderQty
      );
      return {
        ...item,
        quantity: q,
        unitPrice: tiered.unitPrice,
        discountPercent: tiered.discountPercent,
      };
    });

    setCart(updatedCart);
    setToast({
      id: Date.now(),
      productName: 'Panier équilibré selon votre budget',
      variantName: formatFullAriary(targetBudget),
      quantity: updatedCart.reduce((sum, i) => sum + i.quantity, 0),
      unitPrice: 0,
    });
  }, [cart, effectiveBudget, calculateQtyForBudget]);

  // Gestion des images en cas d'erreur (Zero-Broken-Image Policy)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedImages({});
  }, [siteContent.eventSlides]);

  const pointerHandlers = useLiquidGlassPointer();

  // Changement de catégorie avec animation directionnelle (ouverture / retour de vue)
  const handleSelectCategory = useCallback(
    (newCat: CategoryId) => {
      setIsMobileMenuOpen(false);
      if (newCat === activeCategory) return;
      const oldIdx = activeCategoriesList.findIndex((c) => c.id === activeCategory);
      const newIdx = activeCategoriesList.findIndex((c) => c.id === newCat);
      setViewDirection(newIdx >= oldIdx ? 'forward' : 'backward');
      setActiveCategory(newCat);
      setViewTransitionKey((prev) => prev + 1);
    },
    [activeCategory, activeCategoriesList]
  );

  // Filtrage et tri des produits
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((product) => {
      const matchesCat = activeCategory === 'all' || product.category === activeCategory;
      const matchesPrice = !isUnitPriceFilterActive || product.basePrice <= maxUnitPrice;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        Boolean(product.technicalDetail && product.technicalDetail.toLowerCase().includes(q)) ||
        Boolean(product.shortDescription && product.shortDescription.toLowerCase().includes(q)) ||
        product.categoryLabel.toLowerCase().includes(q) ||
        Boolean(product.specs?.material && product.specs.material.toLowerCase().includes(q)) ||
        Boolean(product.printMethods?.some((m) => m.name.toLowerCase().includes(q)));
      return matchesCat && matchesPrice && matchesQuery;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.basePrice - b.basePrice);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.basePrice - a.basePrice);
    }
    if (sortBy === 'lead-time') {
      return [...list].sort((a, b) => a.leadTimeDays - b.leadTimeDays);
    }
    return list;
  }, [activeCategory, maxUnitPrice, isUnitPriceFilterActive, searchQuery, sortBy, products]);

  // Ouvrir la fenêtre modale de détail d'un produit
  const openProductModal = (product: Product, triggerElement: HTMLElement | null) => {
    lastProductTriggerRef.current = triggerElement;
    if (!draftsByProduct[product.id]) {
      setDraftsByProduct((prev) => ({
        ...prev,
        [product.id]: {
          productId: product.id,
          quantity: product.minOrderQty || 1,
          printMethodId: product.printMethods?.[0]?.id || 'std',
          variantId: product.variants?.[0]?.id || 'std',
          customBrandingText: '',
          customLogoUrl: '',
          customizationType: 'texte',
        },
      }));
    }
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = useCallback(() => {
    setIsProductModalOpen(false);
  }, []);

  // Redirection automatique vers le détail "i" du produit au chargement si un paramètre ?product=ID est présent dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetProductId = params.get('product');
    if (targetProductId && products.length > 0) {
      const targetProduct = products.find((p) => p.id === targetProductId);
      if (targetProduct) {
        openProductModal(targetProduct, null);
      }
    }
  }, [products]);

  // Mettre à jour le brouillon de personnalisation du produit actif (persisté même si modale fermée)
  const updateProductDraft = (productId: string, patch: Partial<CustomizationDraft>) => {
    setDraftsByProduct((prev) => {
      const existing = prev[productId] || {
        productId,
        quantity: selectedProduct?.minOrderQty || 1,
        printMethodId: selectedProduct?.printMethods?.[0]?.id || 'std',
        variantId: selectedProduct?.variants?.[0]?.id || 'std',
        customBrandingText: '',
        customLogoUrl: '',
        customizationType: 'texte',
      };
      return {
        ...prev,
        [productId]: {
          ...existing,
          ...patch,
        },
      };
    });
  };

  // Déclencher la petite fenêtre de confirmation animée avec ondulation de verre
  const triggerConfirmationToast = (notification: Omit<ToastNotification, 'id'>) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    const id = Date.now();
    setToast({ ...notification, id });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Ajouter un produit au panier (depuis la carte ou depuis la modale de personnalisation)
  const handleAddToCart = (product: Product, customConfig?: CustomizationDraft) => {
    const config = customConfig || draftsByProduct[product.id];
    const defaultMethod = { id: 'std', name: 'Marquage standard', detail: 'Inclus', unitSurcharge: 0 };
    const defaultVariant = { id: 'std', name: 'Standard', swatchHex: '#2563EB', finishLabel: 'Standard' };
    const variant =
      product.variants?.find((v) => v.id === config?.variantId) || product.variants?.[0] || defaultVariant;
    const printMethod =
      product.printMethods?.find((m) => m.id === config?.printMethodId) ||
      product.printMethods?.[0] ||
      defaultMethod;
    const minQty = product.minOrderQty || 1;
    const quantity = Math.max(config?.quantity || minQty, minQty);
    const productPrice = product.sellingPrice || product.basePrice || 0;

    const { unitPrice, discountPercent } = calculateTieredUnitPrice(
      productPrice,
      printMethod.unitSurcharge,
      quantity,
      minQty
    );

    const brandingKey = config?.customBrandingText?.trim() || 'Marquage standard selon fichier vectoriel';
    const cartItemId = `${product.id}-${variant.id}-${printMethod.id}-${brandingKey}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        const recalculated = calculateTieredUnitPrice(
          product.basePrice,
          printMethod.unitSurcharge,
          newQty,
          product.minOrderQty
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          unitPrice: recalculated.unitPrice,
          discountPercent: recalculated.discountPercent,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId,
          product,
          variantId: variant.id,
          variantName: variant.name,
          swatchHex: variant.swatchHex,
          printMethodId: printMethod.id,
          printMethodName: printMethod.name,
          quantity,
          unitPrice,
          discountPercent,
          customBrandingText: brandingKey,
          pantoneReference: config.pantoneReference?.trim() || 'Nuancier standard',
        },
      ];
    });

    setOrderQuoteConfirmed(null);

    triggerConfirmationToast({
      productName: product.name,
      variantName: `${variant.name} · ${printMethod.name}`,
      quantity,
      unitPrice,
    });
  };

  // Modifier la quantité d'une ligne dans le panier rapide
  const updateCartItemQuantity = (cartItemId: string, deltaSteps: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const nextQty = item.quantity + deltaSteps * item.product.quantityStep;
        if (nextQty < item.product.minOrderQty) {
          return item;
        }
        const printMethod =
          item.product.printMethods.find((m) => m.id === item.printMethodId) ||
          item.product.printMethods[0];
        const recalculated = calculateTieredUnitPrice(
          item.product.basePrice,
          printMethod.unitSurcharge,
          nextQty,
          item.product.minOrderQty
        );
        return {
          ...item,
          quantity: nextQty,
          unitPrice: recalculated.unitPrice,
          discountPercent: recalculated.discountPercent,
        };
      })
    );
  };

  // Modifier exactement la quantité par saisie manuelle
  const updateCartItemExactQuantity = (cartItemId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const validQty = Math.max(1, newQty);
        const printMethod =
          item.product.printMethods.find((m) => m.id === item.printMethodId) ||
          item.product.printMethods[0];
        const recalculated = calculateTieredUnitPrice(
          item.product.basePrice,
          printMethod.unitSurcharge,
          validQty,
          item.product.minOrderQty
        );
        return {
          ...item,
          quantity: validQty,
          unitPrice: recalculated.unitPrice,
          discountPercent: recalculated.discountPercent,
        };
      })
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Totaux du panier en Ariary (sans mention HT / TTC)
  const cartSummary = useMemo(() => {
    const totalLines = cart.length;
    const totalPieces = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const rawWithoutDiscount = cart.reduce((acc, item) => {
      const method =
        item.product.printMethods.find((m) => m.id === item.printMethodId) ||
        item.product.printMethods[0];
      return acc + (item.product.basePrice + method.unitSurcharge) * item.quantity;
    }, 0);
    const totalSavings = Math.max(0, rawWithoutDiscount - totalAmount);

    return {
      totalLines,
      totalPieces,
      totalAmount,
      totalSavings,
    };
  }, [cart]);

  // Frais de livraison variables calculés automatiquement selon la grille si option active
  const currentDeliveryFee = useMemo(() => {
    if (!isDeliveryActive) return 0;
    return calculateDeliveryFee(cartSummary.totalAmount, siteContent.deliveryTiers);
  }, [isDeliveryActive, cartSummary.totalAmount, siteContent.deliveryTiers]);

  const grandTotalAmount = useMemo(() => {
    return cartSummary.totalAmount + currentDeliveryFee;
  }, [cartSummary.totalAmount, currentDeliveryFee]);

  const activeCategoryMeta =
    activeCategoriesList.find((c) => c.id === activeCategory) || activeCategoriesList[0];

  const currentSortMeta =
    SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  const activeDraft = useMemo(() => {
    if (!selectedProduct) return null;
    const existing = draftsByProduct[selectedProduct.id];
    if (existing) return existing;
    return {
      productId: selectedProduct.id,
      quantity: selectedProduct.minOrderQty || 1,
      printMethodId: selectedProduct.printMethods?.[0]?.id || 'std',
      variantId: selectedProduct.variants?.[0]?.id || 'std',
      customBrandingText: '',
      customLogoUrl: '',
      customizationType: 'texte' as const,
    };
  }, [selectedProduct, draftsByProduct]);

  const activeModalCalculation = useMemo(() => {
    if (!selectedProduct || !activeDraft) return null;
    const defaultMethod = { id: 'std', name: 'Marquage standard', detail: 'Inclus', unitSurcharge: 0 };
    const defaultVariant = { id: 'std', name: 'Standard', swatchHex: '#2563EB', finishLabel: 'Standard' };
    const method =
      selectedProduct.printMethods?.find((m) => m.id === activeDraft.printMethodId) ||
      selectedProduct.printMethods?.[0] ||
      defaultMethod;
    const variant =
      selectedProduct.variants?.find((v) => v.id === activeDraft.variantId) ||
      selectedProduct.variants?.[0] ||
      defaultVariant;
    const productPrice = selectedProduct.sellingPrice || selectedProduct.basePrice || 0;
    const minQty = selectedProduct.minOrderQty || 1;
    const qty = Math.max(activeDraft.quantity || minQty, 1);
    const pricing = calculateTieredUnitPrice(
      productPrice,
      method.unitSurcharge,
      qty,
      minQty
    );
    return {
      method,
      variant,
      unitPrice: pricing.unitPrice,
      discountPercent: pricing.discountPercent,
      lineTotal: pricing.unitPrice * qty,
    };
  }, [selectedProduct, activeDraft]);

  // Animation de défilement bidirectionnelle fluide avec fondu ascendant et effet Stagger
  useBidirectionalScrollReveal({
    selector: '.scroll-reveal',
    staggerStepMs: 95,
    threshold: 0,
    rootMargin: '15px 0px -25px 0px',
    deps: [filteredProducts, activeCategory, searchQuery, isBudgetActive, isUnitPriceFilterActive],
  });

  const signatureKitProduct = products[5] || products[0];

  if (isAdminLoggedIn) {
    return (
      <AdminPortal
        onBackToStore={() => {
          setProducts(getStoredProducts());
          setSiteTheme(getSiteTheme());
          setCategories(getStoredCategories());
          setIsAdminLoggedIn(false);
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen selection:bg-blue-600/15 selection:text-blue-950">
      {/* Arrière-plan du site : Gradient de base + Image d'arrière-plan personnalisée avec filtres CSS */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
        style={{ backgroundColor: siteTheme.baseColor }}
      >
        <div
          className="absolute inset-0 transition-colors duration-500"
          style={{
            background: `linear-gradient(to bottom, ${siteTheme.gradientFrom} 0%, ${siteTheme.gradientVia} 50%, ${siteTheme.gradientTo} 100%)`,
            opacity: siteTheme.bgImageUrl ? 0.4 : 1,
          }}
        />

        {/* Calque d'image d'arrière-plan avec filtres (flou, transparence, luminosité, contraste, saturation) */}
        {siteTheme.bgImageUrl && (
          <div className="absolute inset-0 overflow-hidden transition-all duration-300 pointer-events-none">
            <img
              src={siteTheme.bgImageUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
              style={{
                filter: `blur(${siteTheme.bgBlur ?? 0}px) brightness(${siteTheme.bgBrightness ?? 100}%) contrast(${siteTheme.bgContrast ?? 100}%) saturate(${siteTheme.bgSaturate ?? 100}%)`,
                opacity: (siteTheme.bgOpacity ?? 80) / 100,
              }}
            />
          </div>
        )}

        {/* Halos lumineux minéraux */}
        <div
          className={`absolute -top-28 left-[8%] w-[36rem] h-[36rem] rounded-full blur-[95px] transition-colors duration-500 ${
            siteTheme.bgImageUrl ? 'opacity-25' : 'opacity-70'
          }`}
          style={{ backgroundColor: siteTheme.accentOrb1 }}
        />
        <div
          className={`absolute top-[26%] right-[4%] w-[32rem] h-[32rem] rounded-full blur-[90px] transition-colors duration-500 ${
            siteTheme.bgImageUrl ? 'opacity-25' : 'opacity-70'
          }`}
          style={{ backgroundColor: siteTheme.accentOrb2 }}
        />
        <div
          className={`absolute bottom-[10%] left-[22%] w-[40rem] h-[28rem] rounded-full blur-[100px] transition-colors duration-500 ${
            siteTheme.bgImageUrl ? 'opacity-25' : 'opacity-70'
          }`}
          style={{ backgroundColor: siteTheme.accentOrb3 }}
        />
        {/* Trame architecturale subtile qui révèle la transparence des cartes en verre */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(15, 23, 42, 0.14) 0.75px, transparent 0.75px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Contenu principal interactif au-dessus du fond fixe (z-10) */}
      <div className="relative z-10">

      {/* 1. BARRE DE NAVIGATION FLOTTANTE LIQUID GLASS (Optimisée tous écrans & mobile) */}
      <div className="sticky top-3 sm:top-4 z-40 px-3 sm:px-8 max-w-[1440px] mx-auto">
        {/* Backdrop overlay transparent si le menu mobile est ouvert */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <header
          onPointerMove={pointerHandlers.onPointerMove}
          className="glass relative z-40 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-full"
        >
          {/* Zone 1 : Logo & Titre Société (Le clic sur le logo ouvre l'interface administrateur) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAdminPinModalOpen(true);
              }}
              className="group flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left"
              aria-label="Accès Administrateur"
            >
              {companyProfile.logoUrl ? (
                <img
                  src={companyProfile.logoUrl}
                  alt={companyProfile.name || 'Logo'}
                  className="h-8 sm:h-9 max-w-[150px] sm:max-w-[180px] object-contain group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-950 text-white p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <AppLogo className="w-full h-full text-white" />
                </div>
              )}
              <span className="hidden md:inline-block font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">
                My PRINT
              </span>
            </button>
          </div>

          {/* Zone 2 Desktop : Jusqu'à 8 filtres de catégories dans le menu du haut */}
          <nav
            aria-label="Navigation des collections"
            className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-5 text-xs lg:text-sm font-medium text-slate-700 overflow-x-auto no-scrollbar"
          >
            {activeCategoriesList
              .filter((c) => c.id !== 'all' && c.count > 0)
              .slice(0, 8)
              .map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <a
                  key={cat.id}
                  href={`#catalogue-${cat.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectCategory(cat.id);
                    const catalogEl = document.getElementById('catalogue-section');
                    catalogEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-slate-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {cat.label}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-blue-600"
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3 : Actions principales (Bouton Maps, Menu 3 traits mobile & Panier) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Bouton Nous trouver (Google Maps) icône colorée sans texte */}
            <a
              href="https://maps.app.goo.gl/mDW3khQXF9pabD6W8"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nous trouver sur Google Maps"
              className="p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-white border border-white/90 shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <GoogleMapsColorIcon className="w-5 h-5 shrink-0" />
            </a>

            {/* Bouton 3 traits en mode mobile, placé juste à côté de l'icône Maps */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Ouvrir le menu"
              className="flex md:hidden items-center justify-center p-2 rounded-full bg-white/75 hover:bg-white border border-white/90 text-slate-950 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Menu className="w-4 h-4 text-blue-600 shrink-0" />
              )}
            </button>

            {/* Bouton Panier */}
            <LiquidGlassButton
              ref={cartTriggerRef}
              variant="primary"
              size="md"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCartModalOpen(true);
              }}
              aria-label={`Ouvrir le panier (${cartSummary.totalLines} commandes)`}
              className="px-3 sm:px-4 py-2 font-semibold flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="font-mono-tabular text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold transition-transform duration-300">
                {cartSummary.totalLines}
              </span>
            </LiquidGlassButton>
          </div>
        </header>

        {/* Panneau Déroulant Mobile en Verre Liquide */}
        {isMobileMenuOpen && (
          <div className="md:hidden relative z-40 mt-2 p-4 sm:p-5 rounded-3xl glass backdrop-blur-2xl border border-white/80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Entête du menu mobile */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-900/10">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-950 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Naviguer dans la collection</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-black/5"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de Recherche Rapide directe */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher produit, matière, marquage..."
                className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white/70 border border-white/90 text-xs text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Liste des Catégories de Goodies */}
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Toutes les catégories ({activeCategoriesList.filter((cat) => cat.id !== 'all' && cat.count > 0).length})
            </p>
            <div className="grid grid-cols-1 gap-1.5 mb-4 max-h-[48vh] overflow-y-auto pr-1">
              {activeCategoriesList
                .filter((cat) => (cat.id === 'all' ? products.length > 0 : cat.count > 0))
                .map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      handleSelectCategory(cat.id);
                      const catalogEl = document.getElementById('catalogue-section');
                      catalogEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'bg-white/50 hover:bg-white/80 text-slate-900 border border-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-1.5 rounded-xl shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cat.id === 'all' ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{cat.label}</p>
                        <p
                          className={`text-[10px] truncate ${
                            isActive ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {cat.subtitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {cat.count} réf.
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pied du Menu Mobile avec Bouton Panier Raccourci */}
            <div className="pt-3 border-t border-slate-900/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCartModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-semibold shadow-md hover:bg-slate-900 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-blue-300" />
                <span>Panier ({cartSummary.totalLines})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTENU PRINCIPAL */}
      <main id="top" className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8 pb-24">
        {/* 2. BANNIÈRE PRINCIPALE (HERO) - RENDER DYNAMIQUE DE L'IMAGE & MODE (PLEINE ÉCRAN vs PETIT FORMAT) */}
        {siteContent.heroImageMode === 'full' ? (
          /* Mode 1 : Pleine Écran (Image de fond sous le calque texte) avec carrousel 4s */
          <section
            aria-labelledby="hero-heading"
            className="scroll-reveal relative rounded-[32px] overflow-hidden p-8 sm:p-14 mb-14 shadow-2xl border border-white/40 group min-h-[540px] flex flex-col justify-between"
            onMouseEnter={() => setIsHeroSlidePaused(true)}
            onMouseLeave={() => setIsHeroSlidePaused(false)}
          >
            {/* Image de fond pleine écran avec glissement animé de droite vers la gauche (4s) */}
            <div className="absolute inset-0 overflow-hidden -z-20">
              <div
                className="flex h-full w-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
              >
                {heroSlides.map((slide: HeroSlideItem, idx: number) => (
                  <div key={slide.id} className="w-full h-full shrink-0 relative">
                    {!failedImages[slide.id] ? (
                      <img
                        src={slide.imageUrl || undefined}
                        alt={slide.shortTitle}
                        referrerPolicy="no-referrer"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        onError={() => setFailedImages((prev: Record<string, boolean>) => ({ ...prev, [slide.id]: true }))}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800" />
                    )}
                  </div>
                ))}
              </div>
            </div>



            {/* Scrim / Calque d'ombrage */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/40 -z-10 backdrop-blur-[2px]"
              aria-hidden="true"
            />

            {/* Contenu textuel avec calque protecteur et style contrasté */}
            <div className="relative z-10 max-w-3xl pt-2">
              <h1
                id="hero-heading"
                style={{ textWrap: 'balance' }}
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12] mb-6 drop-shadow-md"
              >
                {siteContent.heroHeading}
              </h1>

              <p className="text-base sm:text-lg text-slate-100/95 leading-relaxed max-w-2xl mb-8 font-normal drop-shadow-xs">
                {siteContent.heroDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <LiquidGlassButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('catalogue-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-semibold shadow-xl hover:scale-102"
                >
                  <span>Commander ici</span>
                  <ArrowDown className="w-4 h-4" />
                </LiquidGlassButton>

                <a
                  href="https://scanqrcode.client-myprint.workers.dev/?ref=REF-001"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#ff9d00', color: '#00375e' }}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <span>CATALOGUE MY PRINT</span>
                </a>
              </div>
            </div>

            {/* Overlay Événement (Carrousel 4s) : Nom court & Description de l'événement ancrés tout en bas sans fond */}
            {currentHeroSlide && (
              <div
                key={`hero-cards-full-${activeSlideIndex}`}
                className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 max-w-2xl z-20 overflow-hidden space-y-1"
              >
                <div className="overflow-hidden">
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] animate-newspaper-title">
                    {currentHeroSlide.shortTitle}
                  </h3>
                </div>
                {currentHeroSlide.description && (
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm text-slate-100/95 font-normal leading-relaxed max-w-xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] animate-newspaper-desc">
                      {currentHeroSlide.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        ) : (
          /* Mode 2 : Format Petit / Côté à Côté (Standard) avec Carrousel 4s */
          <section
            aria-labelledby="hero-heading"
            className="scroll-reveal relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-14"
          >
            {/* Colonne Éditoriale en Verre Liquide Ultra-Transparent */}
            <div
              onPointerMove={pointerHandlers.onPointerMove}
              className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between rounded-[32px]"
            >
              <div className="relative z-10">
                <h1
                  id="hero-heading"
                  style={{ textWrap: 'balance' }}
                  className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-[1.1] mb-6"
                >
                  {siteContent.heroHeading}
                </h1>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl mb-8">
                  {siteContent.heroDescription}
                </p>

                <div className="flex flex-wrap items-center gap-3.5 mb-10">
                  <LiquidGlassButton
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById('catalogue-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-semibold shadow-lg hover:scale-102"
                  >
                    <span>Commander ici</span>
                    <ArrowDown className="w-4 h-4" />
                  </LiquidGlassButton>

                  <a
                    href="https://scanqrcode.client-myprint.workers.dev/?ref=REF-001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/70 hover:bg-white text-slate-900 border border-slate-300 font-semibold shadow-sm transition-all hover:scale-102"
                  >
                    <span>CATALOGUE MY PRINT</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne Visuelle Hero avec Carrousel d'images des vrais produits (4s) */}
            <div
              className="lg:col-span-5 relative rounded-[32px] overflow-hidden min-h-[420px] lg:min-h-full group shadow-xl border border-white/80 bg-[#E6E2D8] flex flex-col justify-between"
              onMouseEnter={() => setIsHeroSlidePaused(true)}
              onMouseLeave={() => setIsHeroSlidePaused(false)}
            >
              {/* Glissement animé de droite à gauche : Piste d'images des vrais produits */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
                >
                  {heroSlides.map((slide: HeroSlideItem, idx: number) => (
                    <div key={slide.id} className="w-full h-full shrink-0 relative">
                      {!failedImages[slide.id] ? (
                        <img
                          src={slide.imageUrl || undefined}
                          alt={slide.shortTitle}
                          referrerPolicy="no-referrer"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          onError={() => setFailedImages((prev: Record<string, boolean>) => ({ ...prev, [slide.id]: true }))}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#EAE6DF] to-[#D6CFC2] text-slate-700">
                          <Package className="w-12 h-12 mb-3 text-slate-600" />
                          <span className="font-display font-semibold text-lg text-center">
                            {slide.shortTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrim mesuré pour garantir la lisibilité */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />

              {/* Flèches de navigation manuelles gauche / droite au survol */}
              <button
                type="button"
                onClick={() => setHeroSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                aria-label="Diapositive précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm border border-white/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setHeroSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                aria-label="Diapositive suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm border border-white/20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Overlay Événement (Carrousel 4s) : Nom court & Description de l'événement ancrés tout en bas sans fond */}
              {currentHeroSlide && (
                <div
                  key={`hero-cards-split-${activeSlideIndex}`}
                  className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 z-20 overflow-hidden space-y-0.5"
                >
                  <div className="overflow-hidden">
                    <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] animate-newspaper-title">
                      {currentHeroSlide.shortTitle}
                    </h3>
                  </div>
                  {currentHeroSlide.description && (
                    <div className="overflow-hidden">
                      <p className="text-xs text-slate-100/95 font-normal line-clamp-2 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] animate-newspaper-desc">
                        {currentHeroSlide.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}



        {/* 3. RECHERCHE INTERACTIVE, CATÉGORIES & FILTRES EN VERRE LIQUIDE */}
        <section id="catalogue-section" className="scroll-mt-24">
          {/* Ligne d'en-tête du catalogue : Titre + Recherche compacte en rond qui s'allonge + Tri iOS 26 décalé */}
          <div className="scroll-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5" data-stagger-index={0}>
            <div>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#00375e]"
                style={{ color: '#00375e' }}
              >
                {activeCategoryMeta.label}
              </h2>
              {activeCategoryMeta.subtitle ? (
                <p className="text-sm text-slate-600 mt-0.5">{activeCategoryMeta.subtitle}</p>
              ) : null}
            </div>

            {/* Outils d'action iOS 26 : Recherche compacte + Tri avec affichage décalé + Compteur */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {/* Barre de Recherche Compacte : Simple rond avec loupe (rond avec poil) qui s'allonge sur clic */}
              <div ref={searchContainerRef} className="relative flex items-center">
                {!isSearchExpanded && !searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(true);
                      setTimeout(() => searchInputRef.current?.focus(), 120);
                    }}
                    aria-label="Rechercher un produit ou marquage"
                    className="w-10 h-10 rounded-full glass border border-white/90 bg-white/60 hover:bg-white text-slate-700 hover:text-blue-600 flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                  >
                    <Search className="w-4 h-4 text-slate-700 group-hover:text-blue-600 transition-colors" />
                  </button>
                ) : (
                  <div className="relative flex items-center w-56 sm:w-72 md:w-80 h-10 rounded-full glass border border-white/90 bg-white/85 shadow-md px-3 gap-2 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
                    <Search className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher : gourde, carnet, lin..."
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchExpanded(false);
                      }}
                      aria-label="Fermer la recherche"
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Compteur de références */}
              <div className="h-10 px-3 rounded-full glass border border-white/80 bg-white/40 text-xs font-mono-tabular text-slate-700 flex items-center justify-center font-medium shadow-2xs">
                {filteredProducts.length} réf.
              </div>
            </div>
          </div>

          {/* SECTIONS COMPACTES CÔTE À CÔTE : "Acheter selon mes budget" & "Budget / unité" */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 mb-6 items-start">
            {/* SECTION 1 : ACHETER SELON MES BUDGET (Portefeuille) */}
            <div
              data-stagger-index={0}
              onPointerMove={pointerHandlers.onPointerMove}
              className={`glass scroll-reveal rounded-2xl border border-white/80 transition-all duration-300 overflow-hidden shadow-xs ${
                isBudgetActive ? 'bg-white/55 p-3.5 sm:p-4 shadow-sm' : 'bg-white/35 p-3 hover:bg-white/45'
              }`}
            >
              {/* En-tête compact ultra-épuré */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsBudgetActive(!isBudgetActive)}
                  className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
                >
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${
                      isBudgetActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200/90 text-slate-700 group-hover:bg-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs sm:text-sm font-bold text-slate-950 truncate">
                        Acheter selon mes budget
                      </span>
                      <span
                        className={`text-[10px] font-mono-tabular font-semibold px-2 py-0.5 rounded-full border ${
                          isBudgetActive
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isBudgetActive ? formatCompactAriary(effectiveBudget) : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Switch iOS 26 Liquid Glass */}
                <LiquidGlassSwitch
                  checked={isBudgetActive}
                  onChange={setIsBudgetActive}
                />
              </div>

              {/* Panneau de Réglage : S'agrandit UNIQUEMENT sur activation */}
              {isBudgetActive && (
                <div className="mt-3 pt-3 border-t border-slate-900/10 animate-in fade-in slide-in-from-top-1 duration-200 space-y-2.5">
                  {/* Sélecteur de mode Glisser / Saisir + Montant actif */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/60 p-2 rounded-xl border border-white/80">
                    <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setBudgetMode('glisser')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          budgetMode === 'glisser'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        🎚️ Glisser
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetMode('saisir')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          budgetMode === 'saisir'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        ✏️ Saisir
                      </button>
                    </div>

                    <div className="flex items-baseline gap-1 bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-xs self-start sm:self-auto text-xs font-mono-tabular font-bold">
                      <span className="text-[10px] font-normal opacity-90">Budget :</span>
                      <span>{formatFullAriary(effectiveBudget)}</span>
                    </div>
                  </div>

                  {/* Mode Glisser */}
                  {budgetMode === 'glisser' && (
                    <div className="relative py-1">
                      <input
                        type="range"
                        min={0}
                        max={BUDGET_STOPS.length - 1}
                        step={1}
                        value={budgetStopIndex}
                        onChange={(e) => setBudgetStopIndex(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200/90 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between items-center text-[10px] font-mono-tabular text-slate-600 font-semibold mt-1 px-0.5 overflow-x-auto no-scrollbar gap-1">
                        {BUDGET_STOPS.map((stop, idx) => {
                          const isCurrent = idx === budgetStopIndex;
                          return (
                            <button
                              key={stop}
                              type="button"
                              onClick={() => setBudgetStopIndex(idx)}
                              className={`transition-all py-0.5 px-1.5 rounded-md cursor-pointer whitespace-nowrap ${
                                isCurrent
                                  ? 'bg-blue-600 text-white font-bold scale-105 shadow-xs'
                                  : 'hover:bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {formatCompactAriary(stop).replace(' Ar', '')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode Saisir */}
                  {budgetMode === 'saisir' && (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type="number"
                          min={100000}
                          max={100000000}
                          step={50000}
                          value={customBudgetAmount || ''}
                          onChange={(e) => setCustomBudgetAmount(Number(e.target.value))}
                          placeholder="Montant du budget en Ariary"
                          className="w-full font-mono-tabular font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-slate-950"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 pointer-events-none">
                          Ariary (Ar)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                        {[100000, 500000, 1000000, 2500000, 5000000, 10000000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCustomBudgetAmount(preset)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold cursor-pointer shrink-0 transition-all ${
                              customBudgetAmount === preset
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white/80 hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {formatCompactAriary(preset)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2 : BUDGET / UNITÉ (Filtre par prix unitaire) */}
            <div
              data-stagger-index={1}
              onPointerMove={pointerHandlers.onPointerMove}
              className={`glass scroll-reveal rounded-2xl border border-white/80 transition-all duration-300 overflow-hidden shadow-xs ${
                isUnitPriceFilterActive ? 'bg-white/55 p-3.5 sm:p-4 shadow-sm' : 'bg-white/35 p-3 hover:bg-white/45'
              }`}
            >
              {/* En-tête compact ultra-épuré */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnitPriceFilterActive(!isUnitPriceFilterActive)}
                  className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
                >
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${
                      isUnitPriceFilterActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200/90 text-slate-700 group-hover:bg-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs sm:text-sm font-bold text-slate-950 truncate">
                        Budget / unité
                      </span>
                      <span
                        className={`text-[10px] font-mono-tabular font-semibold px-2 py-0.5 rounded-full border ${
                          isUnitPriceFilterActive
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isUnitPriceFilterActive ? `≤ ${formatCompactAriary(maxUnitPrice)}` : 'Sans plafond'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Switch iOS 26 Liquid Glass */}
                <LiquidGlassSwitch
                  checked={isUnitPriceFilterActive}
                  onChange={setIsUnitPriceFilterActive}
                />
              </div>

              {/* Panneau de Réglage : S'agrandit UNIQUEMENT sur activation */}
              {isUnitPriceFilterActive && (
                <div className="mt-3 pt-3 border-t border-slate-900/10 animate-in fade-in slide-in-from-top-1 duration-200 space-y-2.5">
                  <div className="bg-white/60 p-2.5 rounded-xl border border-white/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-600">Plafond par pièce :</span>
                      <span className="font-mono-tabular font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        ≤ {formatFullAriary(maxUnitPrice)}
                      </span>
                    </div>

                    <input
                      id="price-filter"
                      type="range"
                      min={1600}
                      max={15000}
                      step={200}
                      value={maxUnitPrice}
                      onChange={(e) => setMaxUnitPrice(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200/90 rounded-lg appearance-none"
                    />

                    <div className="flex justify-between items-center text-[10px] font-mono-tabular text-slate-500 font-semibold px-0.5">
                      <span>Min : 1 600 Ar</span>
                      <span>Max : 15 000 Ar</span>
                    </div>
                  </div>

                  {/* Boutons paliers rapides de budget / unité */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">Paliers :</span>
                    {[2000, 3000, 5000, 10000, 15000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMaxUnitPrice(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold cursor-pointer shrink-0 transition-all ${
                          maxUnitPrice === preset
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white/80 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {preset === 15000 ? 'Max (15k)' : formatCompactAriary(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Onglets de catégories avec défilement horizontal fluide sur mobile */}
          <div
            role="tablist"
            aria-label="Filtrer par catégorie de goodies"
            data-stagger-index={2}
            className="scroll-reveal flex items-center gap-3 overflow-x-auto no-scrollbar py-5 -my-2 mb-6"
          >
            {activeCategoriesList
              .filter((category) => (category.id === 'all' ? products.length > 0 : category.count > 0))
              .map((category) => {
                const isSelected = activeCategory === category.id;
              return (
                <LiquidGlassButton
                  key={category.id}
                  role="tab"
                  aria-selected={isSelected}
                  variant={isSelected ? 'primary' : 'glass'}
                  size="md"
                  onClick={() => handleSelectCategory(category.id)}
                  className={`transition-all duration-300 ${isSelected ? 'shadow-lg scale-105' : 'hover:scale-102'}`}
                >
                  <span className="font-display font-bold tracking-tight">{category.label}</span>
                  <span
                    className={`font-mono-tabular text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                      isSelected 
                        ? 'bg-white/30 text-white border border-white/40' 
                        : 'bg-slate-950/10 text-slate-800 border border-slate-950/5'
                    }`}
                  >
                    {category.count}
                  </span>
                </LiquidGlassButton>
              );
            })}

            {(searchQuery || isUnitPriceFilterActive || isBudgetActive || activeCategory !== 'all') && (
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setIsUnitPriceFilterActive(false);
                  setMaxUnitPrice(15000);
                  setIsBudgetActive(false);
                  handleSelectCategory('all');
                }}
                className="ml-auto text-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </LiquidGlassButton>
            )}
          </div>

          {/* 4. GRILLE DE CARTES PRODUITS AVEC TRANSITION DE VUE & PRIX EN "K Ar" */}
          <div
            key={viewTransitionKey}
            className={
              viewDirection === 'forward'
                ? 'view-transition-forward'
                : 'view-transition-backward'
            }
          >
            {filteredProducts.length === 0 ? (
              <div className="glass scroll-reveal p-12 text-center max-w-xl mx-auto my-8">
                <div className="relative z-10">
                  <p className="font-display text-lg font-semibold text-slate-900 mb-2">
                    Aucun support personnalisé ne correspond à ces critères
                  </p>
                  <p className="text-sm text-slate-600 mb-6">
                    Essayez d’augmenter le budget unitaire maximum ou de réinitialiser votre
                    recherche pour afficher l’ensemble du catalogue My PRINT.
                  </p>
                  <LiquidGlassButton
                    variant="primary"
                    onClick={() => {
                      setSearchQuery('');
                      setMaxUnitPrice(15000);
                      handleSelectCategory('all');
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Afficher toute la collection</span>
                  </LiquidGlassButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
                {filteredProducts.map((product, index) => {
                  return (
                    <article
                      key={product.id}
                      data-stagger-index={index}
                      onPointerMove={pointerHandlers.onPointerMove}
                      className="glass scroll-reveal group flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 p-2.5 sm:p-3 rounded-2xl"
                    >
                      {/* Zone Image */}
                      <div className="relative z-10 mb-2">
                        <div
                          onClick={() => openQuickQtyDialog(product)}
                          className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#EAE6DF] cursor-pointer"
                        >
                          {!failedImages[product.id] ? (
                            <img
                              src={product.imageUrl || undefined}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                              }
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-[#EDE9E0] to-[#DBD4C6] text-slate-700 text-center">
                              <Package className="w-6 h-6 mb-1 text-slate-600" />
                              <span className="font-display text-[10px] font-semibold line-clamp-2">
                                {product.name}
                              </span>
                            </div>
                          )}

                          {/* Badge Portefeuille disponible sur l'image si budget actif */}
                          {isBudgetActive && (
                            <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-lg bg-blue-600/95 text-white font-mono-tabular text-[9px] sm:text-[10px] font-bold shadow-xs backdrop-blur-xs flex items-center border border-white/30">
                              <span>
                                {calculateQtyForBudget(product, effectiveBudget) >= product.minOrderQty
                                  ? `${calculateQtyForBudget(product, effectiveBudget).toLocaleString('fr-FR')} ex.`
                                  : 'Min non atteint'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Corps de la carte produit : Infos essentielles (Nom, Prix agrandi, Boutons i & Acheter sans icône) */}
                      <div className="relative z-10 flex-1 flex flex-col justify-between gap-1.5">
                        {/* Nom du produit (#00375e, taille réduite de 30%) et Prix (#ff9d00, agrandi) directement collé */}
                        <div className="space-y-0.5">
                          <h3
                            className="font-display text-[9.5px] sm:text-[10.5px] font-bold line-clamp-2 leading-tight text-[#00375e]"
                            style={{ color: '#00375e' }}
                          >
                            <button
                              type="button"
                              onClick={() => openQuickQtyDialog(product)}
                              className="text-left hover:opacity-80 transition-opacity cursor-pointer text-[#00375e]"
                              style={{ color: '#00375e' }}
                            >
                              {product.name}
                            </button>
                          </h3>

                          {/* Prix unitaire en #ff9d00, sans "P.U :", sans "Ar" (ex: 35K) et Bouton Partage Social à l'extrême droite */}
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <div
                              className="font-mono-tabular text-lg sm:text-xl font-black tracking-tight leading-none text-[#ff9d00]"
                              style={{ color: '#ff9d00' }}
                            >
                              {formatCompactAriary(product.basePrice).replace(/\s*Ar$/i, '')}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleShareProduct(product, e)}
                              aria-label={`Partager ${product.name}`}
                              title="Partager sur les réseaux sociaux"
                              className="p-1 rounded-full text-[#ff9d00] hover:bg-[#ff9d00]/15 active:scale-90 transition-all cursor-pointer shrink-0"
                              style={{ color: '#ff9d00' }}
                            >
                              <Share2 className="w-4 h-4 text-[#ff9d00]" style={{ color: '#ff9d00' }} />
                            </button>
                          </div>
                        </div>

                        {/* Boutons "i" et "Acheter" (Seulement du texte dans le bouton Acheter) */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <LiquidGlassTooltip content="Détails du support" position="top">
                            <button
                              type="button"
                              onClick={(e) => openProductModal(product, e.currentTarget)}
                              aria-label={`Détails du produit ${product.name}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-950 flex items-center justify-center shrink-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                            </button>
                          </LiquidGlassTooltip>

                          <LiquidGlassButton
                            variant="primary"
                            size="sm"
                            onClick={() => openQuickQtyDialog(product)}
                            aria-label={`Acheter ${product.name}`}
                            className="btn-acheter py-1 px-2 text-[11px] font-bold shadow-xs whitespace-nowrap flex-1 justify-center min-h-[1.75rem]"
                          >
                            <span>Acheter</span>
                          </LiquidGlassButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* PIED DE PAGE ÉPURÉ */}
      <footer className="scroll-reveal max-w-[1440px] mx-auto px-4 sm:px-8 py-10 border-t border-slate-900/10 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {companyProfile.logoUrl ? (
            <img
              src={companyProfile.logoUrl}
              alt={companyProfile.name || 'Logo'}
              className="h-6 max-w-[120px] object-contain shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <AppLogo className="w-full h-full text-white" />
            </div>
          )}
          <div>
            <span className="font-display font-semibold text-slate-900">
              {companyProfile.name || 'My PRINT'}
            </span>
            <span aria-hidden="true"> · </span>
            <span>Imprimerie de goodies personnalisés & supports corporate</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <a
            href="https://maps.app.goo.gl/mDW3khQXF9pabD6W8"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nous trouver sur Google Maps"
            className="p-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200 shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          >
            <GoogleMapsColorIcon className="w-5 h-5 shrink-0" />
          </a>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-slate-950 transition-colors"
          >
            Haut de page
          </a>
          <button
            type="button"
            onClick={() => setIsCartModalOpen(true)}
            className="hover:text-slate-950 transition-colors cursor-pointer"
          >
            Panier ({cartSummary.totalLines})
          </button>
        </div>
      </footer>
      </div>

      {/* 6. FENÊTRE MODALE PRODUIT COMPACTÉE & MISE À JOUR CHOIX DE QUANTITÉ (bouton Acheter) */}
      <LiquidModal
        isOpen={isProductModalOpen && selectedProduct !== null}
        onClose={closeProductModal}
        titleId="product-modal-title"
        descriptionId="product-modal-description"
        title={selectedProduct?.name || ''}
        subtitle={
          selectedProduct
            ? `Catégorie : ${selectedProduct.categoryLabel} · ${formatFullAriary(selectedProduct.sellingPrice || selectedProduct.basePrice)}`
            : ''
        }
        triggerRef={lastProductTriggerRef}
      >
        {selectedProduct && (
          <div className="flex flex-col gap-4 text-slate-900">
            {/* 1. BLOC PHOTO (Zoom interactif dynamique style Amazon) */}
            <AmazonImageZoom
              src={selectedProduct.imageUrl || undefined}
              alt={selectedProduct.name}
              hasFailedImage={Boolean(failedImages[selectedProduct.id])}
            />

            {/* 2. BLOC INFÉRIEUR : DESCRIPTION À GAUCHE & BOUTON ACHETER À DROITE (Comme sur l'illustration) */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/85 border border-white/95 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              {/* Côté Gauche : Description détaillée */}
              <div className="space-y-2 flex-1 min-w-0 pr-0 sm:pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Description
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {selectedProduct.categoryLabel}
                  </span>
                  <span className="text-xs font-mono-tabular font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    P.U : {formatFullAriary(selectedProduct.sellingPrice || selectedProduct.basePrice)}
                  </span>
                </div>

                <p
                  id="product-modal-description"
                  className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                >
                  {selectedProduct.technicalDetail || selectedProduct.shortDescription || 'Matière et confection certifiées My PRINT.'}
                </p>

                {selectedProduct.minOrderQty > 1 && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Minimum de commande : {selectedProduct.minOrderQty} pièces
                  </p>
                )}
              </div>

              {/* Côté Droit : Bouton Acheter */}
              <div className="shrink-0 w-full sm:w-auto flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900/10">
                <LiquidGlassButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    closeProductModal();
                    openQuickQtyDialog(selectedProduct);
                  }}
                  className="btn-acheter w-full sm:w-auto px-8 py-3 text-sm font-bold shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-2.5 cursor-pointer"
                  aria-label={`Acheter ${selectedProduct.name}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Acheter</span>
                </LiquidGlassButton>
              </div>
            </div>
          </div>
        )}
      </LiquidModal>

      {/* 7. FENÊTRE MODALE DU PANIER RAPIDE & RÉCAPITULATIF INSTANTANÉ (MONTANTS COMPLETS EN AR, ZÉRO HT/TTC) */}
      <LiquidModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        titleId="cart-modal-title"
        title="Panier Rapide My PRINT"
        subtitle={`${cartSummary.totalLines} référence(s) configurée(s) · ${cartSummary.totalPieces} pièces au total`}
        triggerRef={cartTriggerRef}
      >
        {cart.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-display text-base font-semibold text-slate-900 mb-1">
              Votre sélection d’impression est vide
            </p>
            <p className="text-xs text-slate-600 mb-6">
              Ajoutez des objets personnalisés depuis le catalogue My PRINT pour calculer vos
              remises sur volume.
            </p>
            <LiquidGlassButton
              variant="primary"
              onClick={() => setIsCartModalOpen(false)}
            >
              <span>Parcourir les objets</span>
            </LiquidGlassButton>
          </div>
        ) : (
          <div className="space-y-6">
            {/* PANNEAU BUDGET "ACHETER SELON MES BUDGET" DANS LE PANIER */}
            <div className={`p-4 rounded-2xl transition-all duration-200 border shadow-xs space-y-3 ${
              isBudgetActive ? 'bg-blue-50/90 border-blue-200/90' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isBudgetActive ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className={`font-display text-xs sm:text-sm font-bold ${
                      isBudgetActive ? 'text-blue-950' : 'text-slate-800'
                    }`}>
                      Acheter selon mes budget
                    </h4>
                    <p className={`text-[11px] ${isBudgetActive ? 'text-blue-800' : 'text-slate-600'}`}>
                      {isBudgetActive
                        ? 'Équilibre automatiquement les quantités de tous vos produits'
                        : 'Budget désactivé — Activer pour équilibrer vos quantités selon votre budget'}
                    </p>
                  </div>
                </div>

                {/* Switch Activation du Budget & Interrupteur Se Faire Livrer */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                  {isBudgetActive && (
                    <div className="flex items-center gap-1 p-0.5 bg-blue-100/90 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setBudgetMode('glisser')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          budgetMode === 'glisser'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-blue-900 hover:text-blue-950'
                        }`}
                      >
                        🎚️ Glisser
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetMode('saisir')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          budgetMode === 'saisir'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-blue-900 hover:text-blue-950'
                        }`}
                      >
                        ✏️ Saisir
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pl-1 border-l border-slate-300">
                    <span className="text-[11px] font-semibold text-slate-700">
                      {isBudgetActive ? 'Actif' : 'Off'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isBudgetActive}
                      onClick={() => setIsBudgetActive(!isBudgetActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isBudgetActive ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isBudgetActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bouton interrupteur "Se faire livrer" à côté à droite */}
                  <div className="flex items-center gap-1.5 pl-2.5 border-l border-slate-300">
                    <Truck className={`w-3.5 h-3.5 ${isDeliveryActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                      Se faire livrer
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDeliveryActive}
                      onClick={() => setIsDeliveryActive(!isDeliveryActive)}
                      title="Activer la livraison à domicile avec frais automatiques"
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDeliveryActive ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isDeliveryActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Ajustement du Budget et Bouton d'Action (Affichés uniquement si budget actif) */}
              {isBudgetActive && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {budgetMode === 'glisser' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold text-blue-900">
                        <span>Budget cible :</span>
                        <span className="font-mono-tabular font-bold text-sm text-blue-950">
                          {formatFullAriary(effectiveBudget)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={BUDGET_STOPS.length - 1}
                        step={1}
                        value={budgetStopIndex}
                        onChange={(e) => setBudgetStopIndex(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-200 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between items-center text-[9px] font-mono-tabular text-blue-800 font-medium overflow-x-auto no-scrollbar gap-1 pt-0.5">
                        {BUDGET_STOPS.map((stop, idx) => (
                          <button
                            key={stop}
                            type="button"
                            onClick={() => setBudgetStopIndex(idx)}
                            className={`px-1 rounded ${
                              idx === budgetStopIndex
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-blue-100'
                            }`}
                          >
                            {formatCompactAriary(stop).replace(' Ar', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={100000}
                          max={100000000}
                          step={50000}
                          value={customBudgetAmount || ''}
                          onChange={(e) => setCustomBudgetAmount(Number(e.target.value))}
                          placeholder="Budget en Ar"
                          className="w-full font-mono-tabular font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-slate-950"
                        />
                        <span className="text-xs font-bold text-blue-900 shrink-0">
                          {formatFullAriary(effectiveBudget)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={balanceCartForBudget}
                    className="btn-acheter w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Acheter selon mon budget ({formatFullAriary(effectiveBudget)})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Liste des articles du panier */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-4 rounded-2xl bg-white/55 border border-white/85 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EAE6DF] shrink-0 border border-white">
                      {!failedImages[item.product.id] ? (
                        <img
                          src={item.product.imageUrl || undefined}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-sm font-semibold text-slate-950">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block border border-black/15"
                          style={{ backgroundColor: item.swatchHex }}
                        />
                        <span>{item.variantName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.printMethodName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Marquage :{' '}
                        <span className="text-slate-800 font-medium">
                          {item.customBrandingText}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Contrôle fluide de quantité & sous-total de ligne en Ar complet */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                        disabled={item.quantity <= item.product.minOrderQty}
                        aria-label={`Réduire la quantité de ${item.product.name}`}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="flex items-center px-1">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateCartItemExactQuantity(item.cartItemId, isNaN(val) ? 1 : val);
                          }}
                          aria-label={`Saisir la quantité pour ${item.product.name}`}
                          className="font-mono-tabular text-xs font-bold text-slate-950 w-14 text-center focus:outline-none focus:ring-1 focus:ring-blue-600 rounded bg-transparent"
                        />
                        <span className="text-[10px] font-semibold text-slate-500">ex.</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                        aria-label={`Augmenter la quantité de ${item.product.name}`}
                        className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeCartItem(item.cartItemId)}
                        aria-label={`Retirer ${item.product.name} du panier`}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-mono-tabular text-sm font-bold text-slate-950">
                        {formatFullAriary(item.unitPrice * item.quantity)}
                      </span>
                      <span className="block font-mono-tabular text-[11px] text-slate-500">
                        {formatFullAriary(item.unitPrice)} / unité
                        {item.discountPercent > 0 ? ` (-${item.discountPercent}%)` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note / instruction de dossier persistée dans la session */}
            <div>
              <label
                htmlFor="cart-client-note"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Consigne de livraison ou référence de bon de commande (conservée)
              </label>
              <input
                id="cart-client-note"
                type="text"
                value={orderClientNote}
                onChange={(e) => setOrderClientNote(e.target.value)}
                placeholder="Ex: Livraison Siège My PRINT · Référence Dossier..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/60 border border-white/90 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Récapitulatif chiffré instantané (sans aucune mention HT ni TTC) */}
            <div className="p-5 rounded-2xl bg-white/60 border border-white/90 space-y-2 text-xs">
              {cartSummary.totalSavings > 0 && (
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>Économie paliers dégressifs appliquée</span>
                  <span className="font-mono-tabular">
                    -{formatFullAriary(cartSummary.totalSavings)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Frais de clichés, vectorisation & BAT 3D</span>
                <span className="font-mono-tabular font-medium text-slate-900">Offerts</span>
              </div>
              {isDeliveryActive && (
                <div className="flex justify-between items-center text-blue-950 font-medium py-1.5 border-t border-slate-900/5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Frais de livraison (calcul automatique)</span>
                  </span>
                  <span className="font-mono-tabular font-bold text-blue-900">
                    +{formatFullAriary(currentDeliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-900/10 text-sm font-bold text-slate-950">
                <span>Total de la commande ({cartSummary.totalPieces} pièces)</span>
                <span className="font-mono-tabular text-lg">
                  {formatFullAriary(grandTotalAmount)}
                </span>
              </div>
            </div>

            {/* Confirmation instantanée de demande de BAT / commande */}
            {orderQuoteConfirmed ? (
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-slate-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-600 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">
                      Dossier #{orderQuoteConfirmed} enregistré — Préparation du BAT 3D
                    </p>
                    <p className="text-xs text-slate-600">
                      Votre récapitulatif My PRINT de {cartSummary.totalPieces} pièces est prêt
                      pour validation graphique.
                    </p>
                  </div>
                </div>
                <LiquidGlassButton
                  size="sm"
                  onClick={() => setIsCartModalOpen(false)}
                >
                  Fermer
                </LiquidGlassButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <LiquidGlassButton
                    variant="glass"
                    size="lg"
                    onClick={() => {
                      setIsCartModalOpen(false);
                      setIsProformaModalOpen(true);
                    }}
                    className="w-full justify-center !border-blue-600/30 !text-blue-950 font-semibold shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Obtenir proforma</span>
                  </LiquidGlassButton>

                  <LiquidGlassButton
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      setIsCartModalOpen(false);
                      setPaymentOption('livraison');
                      setPaymentError(null);
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full justify-center font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Payer ({formatFullAriary(grandTotalAmount)})</span>
                  </LiquidGlassButton>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsCartModalOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1"
                  >
                    ← Continuer la sélection de produits
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </LiquidModal>

      {/* 7.5. BOÎTE DE DIALOGUE DE QUANTITÉ PERSONNALISABLE SANS BOUTONS + ET - */}
      <LiquidModal
        isOpen={quickQtyProduct !== null}
        onClose={() => setQuickQtyProduct(null)}
        titleId="quick-qty-modal-title"
        descriptionId="quick-qty-modal-desc"
        title={quickQtyProduct?.name || ''}
        subtitle="Choix de la quantité souhaitée"
      >
        {quickQtyProduct && (() => {
          const minQty = quickQtyProduct.minOrderQty;
          const numVal = typeof quickQtyValue === 'number' ? quickQtyValue : parseInt(quickQtyValue, 10);
          const currentQty = isNaN(numVal) || numVal <= 0 ? minQty : numVal;
          const printMethod = quickQtyProduct.printMethods[0];
          const { unitPrice, discountPercent } = calculateTieredUnitPrice(
            quickQtyProduct.basePrice,
            printMethod.unitSurcharge,
            currentQty,
            minQty
          );
          const totalPrice = unitPrice * currentQty;

          return (
            <div className="space-y-5">
              {/* Élement 1 : Aperçu du produit */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/50 border border-white/80 animate-slide-up-stagger">
                <img
                  src={quickQtyProduct.imageUrl || undefined}
                  alt={quickQtyProduct.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm sm:text-base font-bold text-slate-950 truncate">
                    {quickQtyProduct.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Prix unitaire : <strong className="font-mono-tabular text-slate-950">{formatFullAriary(unitPrice)}</strong>
                    {discountPercent > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-800">
                        -{discountPercent}% dégressif
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Minimum de commande : {minQty} pièces
                  </p>
                </div>
              </div>

              {/* Élement 2 : Choix de couleur */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar animate-slide-up-stagger">
                {quickQtyProduct.variants.map((variant) => {
                  const isSelected = (quickQtyVariantId || quickQtyProduct.variants[0]?.id) === variant.id;
                  const isLightColor = ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#FEF08A', '#FFF', '#FFFF00'].includes(
                    variant.swatchHex.toUpperCase()
                  );
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setQuickQtyVariantId(variant.id)}
                      title={variant.name}
                      className={`w-4.5 h-4.5 rounded-full shrink-0 border border-black/20 transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'ring-1.5 ring-blue-600 ring-offset-1 scale-105 shadow-2xs'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: variant.swatchHex }}
                    >
                      {isSelected && (
                        <Check className={`w-2.5 h-2.5 ${isLightColor ? 'text-slate-900' : 'text-white'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Élement 3 : Champ de saisie direct sans fleches haut/bas */}
              <div className="animate-slide-up-stagger">
                <label
                  htmlFor="custom-qty-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                >
                  Saisissez la quantité (chiffre personnalisable) :
                </label>
                <div className="relative">
                  <input
                    id="custom-qty-input"
                    type="number"
                    min={1}
                    step={1}
                    value={quickQtyValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuickQtyValue('');
                      } else {
                        const parsed = parseInt(val, 10);
                        setQuickQtyValue(isNaN(parsed) ? '' : Math.max(0, parsed));
                      }
                    }}
                    placeholder={`${minQty}`}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-blue-600/40 text-xl font-mono-tabular font-bold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20 shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                    pièces
                  </span>
                </div>
              </div>

              {/* Élement 4 : Paliers de quantités directes */}
              <div className="animate-slide-up-stagger">
                <div className="flex flex-wrap gap-2">
                  {[minQty, minQty * 2, minQty * 5, minQty * 10, minQty * 20].map((qtyVal) => (
                    <button
                      key={qtyVal}
                      type="button"
                      onClick={() => setQuickQtyValue(qtyVal)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono-tabular font-semibold transition-all cursor-pointer ${
                        quickQtyValue === qtyVal
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white/70 text-slate-800 hover:bg-white border border-slate-200'
                      }`}
                    >
                      {qtyVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Élement 5 : Option de personnalisation */}
              <div className="p-3.5 rounded-2xl bg-white/60 border border-slate-200/80 space-y-3 animate-slide-up-stagger">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Personnalisé</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={quickQtyIsCustomized}
                    onClick={() => setQuickQtyIsCustomized(!quickQtyIsCustomized)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      quickQtyIsCustomized ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        quickQtyIsCustomized ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {quickQtyIsCustomized && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickQtyCustomType('text')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          quickQtyCustomType === 'text'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Texte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuickQtyCustomType('image')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          quickQtyCustomType === 'image'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 rotate-180" />
                        <span>Image / Logo</span>
                      </button>
                    </div>

                    {quickQtyCustomType === 'text' ? (
                      <div>
                        <input
                          type="text"
                          value={quickQtyCustomText}
                          onChange={(e) => setQuickQtyCustomText(e.target.value)}
                          placeholder="Texte à marquer / imprimer..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                        />
                      </div>
                    ) : (
                      <div>
                        {quickQtyCustomLogo ? (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-300">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={quickQtyCustomLogo || undefined}
                                alt="Logo téléversé"
                                className="w-10 h-10 rounded-lg object-contain bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <span className="text-xs font-bold text-emerald-700 truncate">Logo chargé avec succès</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuickQtyCustomLogo('')}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Retirer l'image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl bg-white/80 cursor-pointer transition-colors text-center">
                            <Download className="w-5 h-5 text-blue-600 mb-1 rotate-180" />
                            <span className="text-xs font-semibold text-slate-800">Téléverser votre logo</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">Formats acceptés : PNG, JPG, SVG, WEBP</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    if (evt.target?.result) {
                                      setQuickQtyCustomLogo(evt.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Élement 6 : Récapitulatif et bouton Acheter */}
              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-600/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-slide-up-stagger">
                <div>
                  <span className="text-xs text-slate-600 block">Total estimé</span>
                  <span className="font-mono-tabular text-xl font-bold text-blue-950">
                    {formatFullAriary(totalPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={() => setQuickQtyProduct(null)}
                  >
                    Annuler
                  </LiquidGlassButton>

                  <LiquidGlassButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      const parsedVal = typeof quickQtyValue === 'number' ? quickQtyValue : parseInt(quickQtyValue, 10);
                      const finalQty = Math.max(1, isNaN(parsedVal) || parsedVal <= 0 ? minQty : parsedVal);
                      const selectedVariantId = quickQtyVariantId || quickQtyProduct.variants[0]?.id || '';
                      let brandingText = 'Marquage standard selon fichier vectoriel';
                      if (quickQtyIsCustomized) {
                        if (quickQtyCustomType === 'text' && quickQtyCustomText.trim()) {
                          brandingText = `Texte : ${quickQtyCustomText.trim()}`;
                        } else if (quickQtyCustomType === 'image' && quickQtyCustomLogo) {
                          brandingText = `Logo téléversé`;
                        } else {
                          brandingText = `Marquage sur mesure`;
                        }
                      }

                      const existingDraft = draftsByProduct[quickQtyProduct.id] || {
                        variantId: selectedVariantId,
                        printMethodId: quickQtyProduct.printMethods[0]?.id || '',
                        quantity: finalQty,
                        customBrandingText: brandingText,
                        pantoneReference: '',
                      };

                      handleAddToCart(quickQtyProduct, {
                        ...existingDraft,
                        variantId: selectedVariantId,
                        quantity: finalQty,
                        customBrandingText: brandingText,
                      });
                      setQuickQtyProduct(null);
                      setIsCartModalOpen(true);
                    }}
                    className="btn-acheter font-bold shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Acheter ({currentQty})</span>
                  </LiquidGlassButton>
                </div>
              </div>
            </div>
          );
        })()}
      </LiquidModal>

      {/* 8. PETITE FENÊTRE DE CONFIRMATION ANIMÉE AVEC ONDULATION DE VERRE (TOAST) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 pointer-events-none max-w-sm w-[calc(100vw-2.5rem)]"
      >
        {toast && (
          <div
            key={toast.id}
            onPointerMove={pointerHandlers.onPointerMove}
            className="glass p-4 pointer-events-auto shadow-lg border border-white/90 reveal"
          >
            {/* Onde circulaire de verre qui se propage à l'apparition de la confirmation */}
            <span
              className="toast-ripple-ring absolute left-6 top-6 w-10 h-10 rounded-full border-2 border-blue-400/60 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700">
                    Ajouté au panier My PRINT
                  </p>
                  <p className="font-display text-sm font-semibold text-slate-950">
                    {toast.productName}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{toast.variantName}</p>
                  <p className="font-mono-tabular text-xs font-medium text-slate-900 mt-1">
                    +{toast.quantity} ex. · {formatFullAriary(toast.unitPrice)} / u.
                  </p>
                </div>
              </div>

              <LiquidGlassButton
                size="sm"
                variant="glass"
                onClick={() => {
                  setToast(null);
                  setIsCartModalOpen(true);
                }}
              >
                Voir
              </LiquidGlassButton>
            </div>
          </div>
        )}
      </div>

      {/* 8.5 MODALE DEMANDE DE FACTURE PROFORMA */}
      {/* 8.5 MODALE DEMANDE DE FACTURE PROFORMA */}
      <LiquidModal
        isOpen={isProformaModalOpen}
        onClose={() => {
          setIsProformaModalOpen(false);
          setProformaSuccessRef(null);
        }}
        titleId="proforma-modal-title"
        title="Demande de Facture Proforma"
        subtitle="Détaillez vos coordonnées et choisissez votre mode d'envoi"
      >
        {proformaSuccessRef ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950">
                Demande Proforma #{proformaSuccessRef} Transmise !
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Votre demande a été enregistrée. Vous pouvez imprimer le récapitulatif ou continuer vos achats.
              </p>
            </div>

            {/* Fiche résumé proforma */}
            <div className="p-4 rounded-2xl bg-white/70 border border-white text-left text-xs space-y-2">
              <div className="flex justify-between font-semibold border-b pb-2 text-slate-900">
                <span>Réf. Proforma : #{proformaSuccessRef}</span>
                <span className="font-bold text-blue-900">
                  Total : {formatFullAriary(grandTotalAmount)}
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {cart.map((it) => (
                  <div key={it.cartItemId} className="flex justify-between text-slate-700">
                    <span className="truncate pr-2">
                      {it.quantity}x {it.product.name}
                    </span>
                    <span className="font-mono-tabular font-medium">
                      {formatFullAriary(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-slate-300 text-xs font-bold text-slate-800 hover:bg-white transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimer / PDF</span>
              </button>

              <LiquidGlassButton
                variant="primary"
                onClick={() => {
                  setIsProformaModalOpen(false);
                  setProformaSuccessRef(null);
                  setCart([]);
                }}
              >
                <span>Fermer & Vider le panier</span>
              </LiquidGlassButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Aperçu du panier pour la proforma */}
            <div className="p-4 rounded-2xl bg-white/60 border border-white/90 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                <span>
                  Résumé ({cartSummary.totalLines} réf. · {cartSummary.totalPieces} ex.)
                </span>
                <span className="font-mono-tabular text-blue-900">
                  {formatFullAriary(grandTotalAmount)}
                </span>
              </div>
            </div>

            {/* Formulaire de coordonnées */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const contactEmail = formData.get('email') as string;
                const cc = formData.get('cc') as string;
                const bcc = formData.get('bcc') as string;
                const contactName = formData.get('name') as string;
                const contactPhone = formData.get('phone') as string;
                const sendMethod = (e.nativeEvent as any).submitter?.value;

                const ref = `PRO-${Math.floor(1000 + Math.random() * 9000)}`;
                const newOrderRecord: CustomerOrder = {
                  id: ref,
                  createdAt: new Date().toISOString(),
                  ...(orderClientNote.trim() ? { clientNote: orderClientNote.trim() } : {}),
                  contactEmail: contactEmail || 'client.myprint@gmail.com',
                  contactName: contactName || undefined,
                  contactPhone: contactPhone || undefined,
                  items: cart.map((item) => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    imageUrl: item.product.imageUrl,
                    variantName: item.variantName,
                    swatchHex: item.swatchHex,
                    printMethodName: item.printMethodName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    customBrandingText: item.customBrandingText,
                    pantoneReference: item.pantoneReference,
                  })),
                  totalPieces: cartSummary.totalPieces,
                  totalAmount: grandTotalAmount,
                  deliveryFee: isDeliveryActive ? currentDeliveryFee : 0,
                  isDeliveryRequested: isDeliveryActive,
                  status: 'proforma_demande',
                  paymentMethod: 'proforma',
                };

                saveNewOrder(newOrderRecord);

                const summaryLines = cart
                  .map(
                    (it) =>
                      `• ${it.quantity}x ${it.product.name} (${it.variantName}) — P.U: ${formatFullAriary(
                        it.unitPrice
                      )} = ${formatFullAriary(it.unitPrice * it.quantity)}`
                  )
                  .join('\n');

                const fullMessage = `Bonjour My PRINT,\nJe souhaite demander une Facture Proforma (Réf: #${ref}).\n\nClient : ${
                  contactName || 'Client My PRINT'
                }\nEmail : ${contactEmail || 'Non renseigné'}\nTéléphone : ${
                  contactPhone || 'Non renseigné'
                }\nArticles sélectionnés :\n${summaryLines}\n\nTOTAL GENERAL : ${formatFullAriary(grandTotalAmount)}`;

                if (sendMethod === 'auto') {
                  notifyNewOrder(newOrderRecord, {
                    type: 'proforma',
                    cc: cc ? cc.split(',').map(s => s.trim()) : undefined,
                    bcc: bcc ? bcc.split(',').map(s => s.trim()) : undefined
                  });
                  setProformaSuccessRef(ref);
                } else if (sendMethod === 'email') {
                  const mailtoUrl = `mailto:client.myprint@gmail.com?cc=${encodeURIComponent(cc)}&bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(
                    `Demande de Facture Proforma #${ref} - My PRINT`
                  )}&body=${encodeURIComponent(fullMessage)}`;
                  window.open(mailtoUrl, '_blank');
                  setProformaSuccessRef(ref);
                } else if (sendMethod === 'whatsapp') {
                  const waUrl = `https://wa.me/261342113119?text=${encodeURIComponent(fullMessage)}`;
                  window.open(waUrl, '_blank');
                  setProformaSuccessRef(ref);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">E-mail</label>
                  <input name="email" type="email" placeholder="votre@email.mg" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nom</label>
                  <input name="name" type="text" placeholder="Raison sociale" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Copie (CC) - Séparer par virgule</label>
                  <input name="cc" type="text" placeholder="chef@boite.mg, compta@boite.mg" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Copie Cachée (BCC)</label>
                  <input name="bcc" type="text" placeholder="archive@boite.mg" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Téléphone</label>
                <input name="phone" type="tel" placeholder="034 00 000 00" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center">Choisir le mode d'envoi</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    value="auto"
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-md cursor-pointer"
                  >
                    Envoi Automatique
                  </button>
                  <button
                    type="submit"
                    value="email"
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-all shadow-md cursor-pointer"
                  >
                    Redirection Mail
                  </button>
                  <button
                    type="submit"
                    value="whatsapp"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </LiquidModal>

      {/* 8.6 MODALE CHOIX DU MODE DE PAIEMENT (MVOLA & LIVRAISON) */}
      <LiquidModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setMvolaStep('idle');
          setPaymentSuccessOrder(null);
        }}
        titleId="payment-modal-title"
        title="Choix du Mode de Paiement"
        subtitle="Règlement direct par Mobile Money (MVola) ou Paiement à la réception"
      >
        {paymentSuccessOrder ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950">
                {paymentSuccessOrder.paymentMethod === 'mvola'
                  ? 'Paiement MVola Confirmé avec Succès !'
                  : 'Commande Enregistrée — Paiement à la Livraison'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Dossier <strong className="text-slate-900">#{paymentSuccessOrder.id}</strong> validé pour un montant total de{' '}
                <strong className="font-mono-tabular text-slate-950">{formatFullAriary(paymentSuccessOrder.totalAmount)}</strong> ({paymentSuccessOrder.totalPieces} pièces).
              </p>
            </div>

            {paymentSuccessOrder.paymentTxRef && (
              <div className="inline-block px-4 py-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-xs font-mono-tabular font-bold text-emerald-950">
                Réf Transaction MVola : {paymentSuccessOrder.paymentTxRef}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-white/70 border border-white text-left text-xs space-y-2">
              <div className="flex justify-between font-semibold border-b pb-2 text-slate-900">
                <span>Mode : {paymentSuccessOrder.paymentMethod === 'mvola' ? 'Mobile Money MVola (Actif)' : 'Paiement à la réception'}</span>
                <span>Statut : Validé</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {paymentSuccessOrder.paymentMethod === 'mvola'
                  ? 'Votre règlement a été reçu directement via l’API MVola. Notre équipe atelier lance la préparation de votre BAT 3D sous 4 heures.'
                  : `Colis expédié à l’adresse : ${paymentSuccessOrder.deliveryAddress || 'Adresse enregistrée'}. Règlement en espèces à effectuer à la livraison.`}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <LiquidGlassButton
                variant="primary"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setMvolaStep('idle');
                  setPaymentSuccessOrder(null);
                  setCart([]);
                }}
              >
                <span>Retour à la boutique (Panier validé)</span>
              </LiquidGlassButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Sélecteur de Mode de Paiement */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const config = getMVolaConfig();
                  if (!config.isMVolaEnabled) {
                    setPaymentOption('livraison');
                    setPaymentError('Service en cours de résolution — Le paiement MVola est actuellement désactivé. Votre commande a été basculée en Paiement à la réception.');
                  } else {
                    setPaymentOption('mvola');
                    setPaymentError(null);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                  paymentOption === 'mvola'
                    ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white/50 border-white/80 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getMVolaConfig().isMVolaEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}`}>
                    {getMVolaConfig().isMVolaEnabled ? 'Actif · API' : 'Désactivé'}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-950">Mobile Money MVola</span>
                  <span className="text-[11px] text-slate-600">
                    {getMVolaConfig().isMVolaEnabled ? 'Paiement instantané direct' : 'Service en cours de résolution'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentOption('livraison');
                  setPaymentError(null);
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                  paymentOption === 'livraison'
                    ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-white/50 border-white/80 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Truck className="w-5 h-5 text-blue-700" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    À la réception
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-950">Payer à la livraison</span>
                  <span className="text-[11px] text-slate-600">Règlement en espèces</span>
                </div>
              </button>
            </div>

            {/* Bannière d'information / erreur de paiement */}
            {paymentError && (
              <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                paymentError.includes('Service en cours de résolution')
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-red-50/90 border-red-200 text-red-700'
              }`}>
                <span>{paymentError}</span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  {paymentError.includes('Service en cours de résolution') && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentOption('livraison');
                        setPaymentError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-colors text-[11px] shadow-sm cursor-pointer"
                    >
                      Retour sur Paiement à la livraison
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentError(null)}
                    className={`p-1 rounded-lg cursor-pointer ${
                      paymentError.includes('Service en cours de résolution')
                        ? 'hover:bg-emerald-700 text-white'
                        : 'hover:bg-red-100 text-red-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* VUE 1 : FORMULAIRE MVOLA */}
            {paymentOption === 'mvola' && (
              <div className="p-4 rounded-2xl bg-emerald-950/5 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                      <span>Passerelle Intégrée MVola Madagascar</span>
                      {!getMVolaConfig().isSandbox ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-600 text-white font-bold tracking-normal">
                          ● PRODUCTION DIRECT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-600 text-white font-bold tracking-normal">
                          ● TEST SANDBOX
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-slate-950">
                    {formatFullAriary(grandTotalAmount)}
                  </span>
                </div>

                {mvolaStep === 'idle' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="mvola-phone-input" className="block text-xs font-bold text-slate-800 mb-1">
                        Numéro de Téléphone MVola (Ex: 034 XX XXX XX) *
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="mvola-phone-input"
                          type="tel"
                          required
                          value={mvolaPhone}
                          onChange={(e) => {
                            setMvolaPhone(e.target.value);
                            if (paymentError) setPaymentError(null);
                          }}
                          placeholder="ex: 034 12 345 67"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-sm font-mono-tabular font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          autoFocus
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      En cliquant sur « Lancer le paiement MVola », une notification PUSH de confirmation avec votre code secret sera immédiatement envoyée sur votre mobile.
                    </p>

                    <LiquidGlassButton
                      variant="primary"
                      onClick={async () => {
                        const config = getMVolaConfig();
                        if (!config.isMVolaEnabled) {
                          setPaymentOption('livraison');
                          setPaymentError('Service en cours de résolution — Le paiement MVola est actuellement désactivé. Votre commande a été basculée en Paiement à la réception.');
                          return;
                        }
                        const cleaned = mvolaPhone.replace(/\s+/g, '');
                        if (!cleaned || cleaned.length < 8) {
                          setPaymentError('Veuillez saisir un numéro de téléphone MVola valide (ex: 034 12 345 67).');
                          return;
                        }
                        setPaymentError(null);
                        const orderRef = `MP-MV-${Math.floor(1000 + Math.random() * 9000)}`;
                        const res = await executeMVolaMerchantPay({
                          customerPhone: cleaned,
                          amount: grandTotalAmount,
                          description: `Commande My PRINT ${orderRef}`,
                          orderRef,
                        });
                        if (res.success) {
                          setMvolaTxnRef(res.transactionRef || res.serverCorrelationId || '');
                          setMvolaStep('push_sent');
                        } else {
                          setPaymentError(res.message || 'Erreur lors de la communication avec l’API MVola.');
                        }
                      }}
                      className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md py-3"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Lancer le paiement MVola ({formatFullAriary(grandTotalAmount)})</span>
                    </LiquidGlassButton>
                  </div>
                )}

                {mvolaStep === 'push_sent' && (
                  <div className="p-4 rounded-xl bg-white/90 border border-emerald-400 space-y-4 text-center">
                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-800 w-12 h-12 flex items-center justify-center mx-auto animate-bounce">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-950">Demande PUSH MVola Envoyée</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Consultez votre téléphone <strong className="text-slate-900">{mvolaPhone}</strong> et saisissez votre code secret MVola pour valider le débit de <strong className="font-mono-tabular">{formatFullAriary(grandTotalAmount)}</strong>.
                      </p>
                    </div>

                    {!getMVolaConfig().isSandbox ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-medium">
                        Réseau Telma MVola en Direct : Une fois votre code PIN tapé sur votre téléphone, cliquez ci-dessous pour finaliser la commande.
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium">
                        Simulateur d'API Sandbox : Cliquez ci-dessous pour confirmer la validation client de test.
                      </div>
                    )}

                    <LiquidGlassButton
                      variant="primary"
                      onClick={() => {
                        const txnId = `MVOLA-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
                        const orderRef = `MP-MV-${Math.floor(1000 + Math.random() * 9000)}`;
                        const newOrderRecord: CustomerOrder = {
                          id: orderRef,
                          createdAt: new Date().toISOString(),
                          ...(orderClientNote.trim() ? { clientNote: orderClientNote.trim() } : {}),
                          contactPhone: mvolaPhone,
                          paymentMethod: 'mvola',
                          paymentTxRef: txnId,
                          items: cart.map((item) => ({
                            productId: item.product.id,
                            productName: item.product.name,
                            imageUrl: item.product.imageUrl,
                            variantName: item.variantName,
                            swatchHex: item.swatchHex,
                            printMethodName: item.printMethodName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            customBrandingText: item.customBrandingText,
                            pantoneReference: item.pantoneReference,
                          })),
                          totalPieces: cartSummary.totalPieces,
                          totalAmount: grandTotalAmount,
                          deliveryFee: isDeliveryActive ? currentDeliveryFee : 0,
                          isDeliveryRequested: isDeliveryActive,
                          status: 'paye_mvola',
                        };
                        saveNewOrder(newOrderRecord);
                        setMvolaTxnRef(txnId);
                        setPaymentSuccessOrder(newOrderRecord);
                      }}
                      className="w-full justify-center font-bold bg-emerald-600 text-white"
                    >
                      <Check className="w-4 h-4" />
                      <span>Valider la saisie du Code PIN MVola</span>
                    </LiquidGlassButton>
                  </div>
                )}
              </div>
            )}

            {/* VUE 2 : FORMULAIRE PAIEMENT À LA LIVRAISON */}
            {paymentOption === 'livraison' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const phone = formData.get('phone') as string;
                  const address = formData.get('address') as string;
                  const cc = formData.get('cc') as string;
                  const bcc = formData.get('bcc') as string;
                  const sendMethod = (e.nativeEvent as any).submitter?.value;

                  setPaymentError(null);
                  if (!phone.trim()) {
                    setPaymentError('Veuillez indiquer un numéro de téléphone.');
                    return;
                  }
                  if (!address.trim()) {
                    setPaymentError('Veuillez indiquer une adresse de livraison.');
                    return;
                  }

                  const orderRef = `MP-LIV-${Math.floor(1000 + Math.random() * 9000)}`;
                  const newOrderRecord: CustomerOrder = {
                    id: orderRef,
                    createdAt: new Date().toISOString(),
                    ...(orderClientNote.trim() ? { clientNote: orderClientNote.trim() } : {}),
                    contactName: name.trim() || undefined,
                    contactPhone: phone.trim(),
                    deliveryAddress: address.trim(),
                    paymentMethod: 'livraison_espece',
                    items: cart.map((item) => ({
                      productId: item.product.id,
                      productName: item.product.name,
                      imageUrl: item.product.imageUrl,
                      variantName: item.variantName,
                      swatchHex: item.swatchHex,
                      printMethodName: item.printMethodName,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      customBrandingText: item.customBrandingText,
                      pantoneReference: item.pantoneReference,
                    })),
                    totalPieces: cartSummary.totalPieces,
                    totalAmount: grandTotalAmount,
                    deliveryFee: isDeliveryActive ? currentDeliveryFee : 0,
                    isDeliveryRequested: isDeliveryActive,
                    status: 'a_livrer_paiement_reception',
                  };

                  saveNewOrder(newOrderRecord);

                  if (sendMethod === 'auto') {
                    notifyNewOrder(newOrderRecord, {
                      cc: cc ? cc.split(',').map(s => s.trim()) : undefined,
                      bcc: bcc ? bcc.split(',').map(s => s.trim()) : undefined
                    });
                    setPaymentSuccessOrder(newOrderRecord);
                  } else if (sendMethod === 'email') {
                    const summaryLines = cart.map(it => `• ${it.quantity}x ${it.product.name}`).join('\n');
                    const fullMessage = `Bonjour My PRINT,\nCommande à la livraison (#${orderRef}).\nClient: ${name}\nTél: ${phone}\nAdresse: ${address}\nArticles:\n${summaryLines}\nTOTAL: ${formatFullAriary(grandTotalAmount)}`;
                    const mailtoUrl = `mailto:client.myprint@gmail.com?cc=${encodeURIComponent(cc)}&bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(`Commande #${orderRef} - My PRINT`)}&body=${encodeURIComponent(fullMessage)}`;
                    window.open(mailtoUrl, '_blank');
                    setPaymentSuccessOrder(newOrderRecord);
                  }
                }}
                className="p-4 rounded-2xl bg-blue-950/5 border border-blue-500/30 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nom</label>
                    <input name="name" type="text" placeholder="Nom complet" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Téléphone *</label>
                    <input name="phone" type="tel" required placeholder="034 00 000 00" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Adresse de livraison *</label>
                  <textarea name="address" required rows={2} placeholder="Ville, quartier, repères..." className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Copie (CC)</label>
                    <input name="cc" type="text" placeholder="compta@..." className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Copie Cachée (BCC)</label>
                    <input name="bcc" type="text" placeholder="archive@..." className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center">Finaliser ma commande</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      value="auto"
                      className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-md cursor-pointer"
                    >
                      Envoi Automatique
                    </button>
                    <button
                      type="submit"
                      value="email"
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-all shadow-md cursor-pointer"
                    >
                      Redirection Mail
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </LiquidModal>

      {/* 8.5. Fenêtre modale de Partage Social d'un Produit */}
      <LiquidModal
        isOpen={sharingProduct !== null}
        onClose={() => setSharingProduct(null)}
        titleId="share-modal-title"
        title={sharingProduct ? `Partager ${sharingProduct.name}` : ''}
        subtitle="Partagez cet objet personnalisé sur vos réseaux sociaux ou vos messageries"
      >
        {sharingProduct && (() => {
          const shareUrl = `${window.location.origin}${window.location.pathname}?product=${sharingProduct.id}`;
          const shareText = `Découvrez ${sharingProduct.name} chez My PRINT Madagascar ! ${formatFullAriary(sharingProduct.sellingPrice || sharingProduct.basePrice)}`;

          return (
            <div className="space-y-5 text-slate-900">
              {/* Aperçu produit */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-2xs">
                <img
                  src={sharingProduct.imageUrl || undefined}
                  alt={sharingProduct.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-xs sm:text-sm font-bold text-[#00375e] truncate">
                    {sharingProduct.name}
                  </h4>
                  <p className="text-xs font-mono-tabular font-extrabold text-[#ff9d00] mt-0.5" style={{ color: '#ff9d00' }}>
                    {formatFullAriary(sharingProduct.sellingPrice || sharingProduct.basePrice)}
                  </p>
                </div>
              </div>

              {/* Options de partage sur les réseaux sociaux */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 transition-all font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-900 border border-blue-600/30 transition-all font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-5 h-5 text-blue-600" />
                  <span>Facebook</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-900 border border-sky-600/30 transition-all font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <span>LinkedIn</span>
                </a>

                {/* Copier le lien */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setIsShareCopied(true);
                    setTimeout(() => setIsShareCopied(false), 2500);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-500/30 transition-all font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isShareCopied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-[#ff9d00]" style={{ color: '#ff9d00' }} />
                  )}
                  <span>{isShareCopied ? 'Lien copié !' : 'Copier le lien'}</span>
                </button>
              </div>

              {/* Champ Lien de partage */}
              <div className="relative pt-1">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setIsShareCopied(true);
                    setTimeout(() => setIsShareCopied(false), 2500);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs btn-acheter"
                >
                  {isShareCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          );
        })()}
      </LiquidModal>

      {/* 9. Fenêtre modale sécurisée d'accès aux Paramètres Admin (clé 6 chiffres) */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setIsAdminLoggedIn(true);
        }}
      />
    </div>
  );
}
