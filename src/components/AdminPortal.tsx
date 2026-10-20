import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Package,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  ArrowLeft,
  KeyRound,
  Trash2,
  ExternalLink,
  Printer,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  AlertCircle,
  Eye,
  Info,
  RefreshCw,
  Palette,
  Check,
  Zap,
  Sparkles,
  FileText,
  Plus,
  Award,
  Edit3,
  Image,
  Upload,
  Maximize2,
  Minimize2,
  Layout,
  Monitor,
  SlidersHorizontal,
  Copy,
  X,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Share2,
  Calendar,
  Tags,
  Folder,
} from 'lucide-react';
import { CustomerOrder, OrderStatus } from '../types/order';
import {
  getStoredOrders,
  updateOrderStatus,
  deleteStoredOrder,
  deleteAllStoredOrders,
  getAdminPin,
  setAdminPin,
  verifyAdminPin,
  subscribeToOrders,
  syncOrdersFromFirestore,
  fetchAdminPinFromFirestore,
  getSiteTheme,
  saveSiteTheme,
  fetchSiteThemeFromFirestore,
  getSiteContent,
  saveSiteContent,
  fetchSiteContentFromFirestore,
  subscribeToSiteContent,
  getStoredProducts,
  saveStoredProducts,
  fetchProductsFromFirestore,
  subscribeToProducts,
  getStoredCategories,
  saveStoredCategories,
  fetchCategoriesFromFirestore,
  subscribeToCategories,
  getCompanyProfile,
  saveCompanyProfile,
  fetchCompanyProfileFromFirestore,
  subscribeToCompanyProfile,
  CompanyProfile,
} from '../services/adminStorage';
import {
  THEME_PRESETS,
  EVENT_PRESET_BACKGROUNDS,
  SiteThemeConfig,
  DEFAULT_THEME_CONFIG,
  generateThemeFromCustomHex,
} from '../types/theme';
import {
  SiteContentConfig,
  FinishSimulatorItem,
  GuaranteeCardItem,
  DeliveryTier,
  EventSlide,
  DEFAULT_DELIVERY_TIERS,
  DEFAULT_EVENT_SLIDES,
  DEFAULT_SITE_CONTENT,
} from '../types/siteContent';
import {
  formatFullAriary,
  formatCompactAriary,
  Product,
  ProductVariant,
  PrintMethod,
  CategoryId,
  CategoryItem,
  PRODUCTS,
  CATEGORIES,
  DEFAULT_CATEGORIES,
} from '../data/products';
import { LiquidGlassButton } from './LiquidGlassButton';
import { LiquidGlassInput, LiquidGlassTooltip } from './liquid';
import { AppLogo } from './AppLogo';
import { JsonProductImportModal } from './JsonProductImportModal';

const PREDEFINED_BASE_COLORS = [
  { name: 'Noir', hex: '#000000', finish: 'Mat' },
  { name: 'Blanc', hex: '#FFFFFF', finish: 'Mat' },
  { name: 'Rouge', hex: '#DC2626', finish: 'Satiné' },
  { name: 'Vert', hex: '#16A34A', finish: 'Satiné' },
  { name: 'Bleu', hex: '#2563EB', finish: 'Satiné' },
  { name: 'Jaune', hex: '#EAB308', finish: 'Brillant' },
  { name: 'Marron', hex: '#78350F', finish: 'Mat' },
];

import {
  getMVolaConfig,
  saveMVolaConfig,
  fetchMVolaConfigFromFirestore,
  subscribeToMVolaConfig,
  MVolaConfig,
} from '../services/mvolaService';

import { uploadImageToFirebaseStorage, deleteImageFromFirebaseStorage } from '../firebase';

interface AdminPortalProps {
  onBackToStore: () => void;
}

type AdminPage = 'orders' | 'products' | 'customization' | 'security' | 'company' | 'mvola';

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToStore }) => {
  const [activePage, setActivePage] = useState<AdminPage>('orders');
  const [customizationTab, setCustomizationTab] = useState<'theme' | 'content' | 'events'>('theme');
  const [productSubTab, setProductSubTab] = useState<'products' | 'categories'>('products');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [companySaveSuccess, setCompanySaveSuccess] = useState<string | null>(null);

  // Configuration API MVola Sandbox
  const [mvolaConfig, setMvolaConfig] = useState<MVolaConfig>(getMVolaConfig());
  const [mvolaSaveSuccess, setMvolaSaveSuccess] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'en_cours' | 'expedie' | 'all' | OrderStatus>('en_cours');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isOrderSearchExpanded, setIsOrderSearchExpanded] = useState<boolean>(false);

  const getOrderClientName = (order: CustomerOrder) => {
    if (order.companyName && order.companyName.trim()) return order.companyName.trim();
    if (order.contactName && order.contactName.trim()) return order.contactName.trim();
    if (order.contactEmail && order.contactEmail.trim()) return order.contactEmail.split('@')[0];
    return `Client #${order.id.slice(-4)}`;
  };

  // État suppression totale des commandes
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllPin, setDeleteAllPin] = useState('');
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  const confirmDeleteAllOrders = async () => {
    if (!verifyAdminPin(deleteAllPin)) {
      setDeleteAllError('Code PIN administrateur incorrect.');
      return;
    }
    const updated = await deleteAllStoredOrders();
    setOrders(updated);
    setIsDeleteAllModalOpen(false);
    setDeleteAllPin('');
    setDeleteAllError(null);
  };

  // État du Thème & Fond de couleur du site
  const [siteTheme, setSiteTheme] = useState<SiteThemeConfig>(getSiteTheme());
  const [customHexInput, setCustomHexInput] = useState<string>(
    siteTheme.customColor || siteTheme.baseColor
  );
  const [themeSaveSuccess, setThemeSaveSuccess] = useState<string | null>(null);
  const [customBgUrlInput, setCustomBgUrlInput] = useState<string>('');

  // État de la personnalisation des textes & contenus du site
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(getSiteContent());
  const [contentSaveSuccess, setContentSaveSuccess] = useState<string | null>(null);
  const [contentSubTab, setContentSubTab] = useState<'all' | 'hero' | 'image' | 'simulators' | 'guarantees' | 'delivery'>('all');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingLabel, setUploadingLabel] = useState<string>('Téléversement dans Firebase Storage...');
  const [expandedSlideDetails, setExpandedSlideDetails] = useState<Record<string, boolean>>({});

  // État de la gestion des produits du catalogue
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [productSaveSuccess, setProductSaveSuccess] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | CategoryId>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [editProductTab, setEditProductTab] = useState<'general' | 'specs' | 'variants'>('general');
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState<boolean>(false);
  const [colorManagingProduct, setColorManagingProduct] = useState<Product | null>(null);
  const [categoryChangingProduct, setCategoryChangingProduct] = useState<Product | null>(null);
  const [customColorHexInput, setCustomColorHexInput] = useState<string>('#DC2626');

  const handleQuickChangeProductCategory = (targetProduct: Product, newCategory: CategoryItem) => {
    const updatedProduct: Product = {
      ...targetProduct,
      category: newCategory.id,
      categoryLabel: newCategory.label,
    };

    const updatedList = products.map((p) => (p.id === targetProduct.id ? updatedProduct : p));
    setProducts(updatedList);
    saveStoredProducts(updatedList);
    setProductSaveSuccess(
      `La catégorie du produit "${targetProduct.name}" a été modifiée en "${newCategory.label}".`
    );
    setTimeout(() => setProductSaveSuccess(null), 3500);
    setCategoryChangingProduct(null);
  };

  const handleAddColorToProduct = (hex: string, name?: string) => {
    if (!colorManagingProduct) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'Couleur',
      swatchHex: cleanHex,
      finishLabel: 'Satiné',
    };
    const updatedVariants = [...(colorManagingProduct.variants || []), newVariant];
    setColorManagingProduct({ ...colorManagingProduct, variants: updatedVariants });
  };

  const handleRemoveColorFromProduct = (variantId: string) => {
    if (!colorManagingProduct) return;
    const updatedVariants = (colorManagingProduct.variants || []).filter((v) => v.id !== variantId);
    setColorManagingProduct({ ...colorManagingProduct, variants: updatedVariants });
  };

  const handleSaveProductColors = () => {
    if (!colorManagingProduct) return;
    const updatedProducts = products.map((p) =>
      p.id === colorManagingProduct.id ? colorManagingProduct : p
    );
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
    setProductSaveSuccess(`Les couleurs du produit "${colorManagingProduct.name}" ont été enregistrées avec succès !`);
    setTimeout(() => setProductSaveSuccess(null), 3500);
    setColorManagingProduct(null);
  };

  const handleJsonImportSuccess = (
    updatedProducts: Product[],
    updatedCategories: CategoryItem[],
    stats: { added: number; updated: number; categoriesCreated: number }
  ) => {
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
    setCategories(updatedCategories);
    saveStoredCategories(updatedCategories);

    setProductSaveSuccess(
      `Importation réussie ! ${stats.added} produit(s) ajouté(s), ${stats.updated} produit(s) mis à jour, et ${stats.categoriesCreated} nouvelle(s) catégorie(s) créée(s) dans Firestore.`
    );
    setTimeout(() => setProductSaveSuccess(null), 5000);
  };

  // État de la gestion des catégories
  const [categories, setCategories] = useState<CategoryItem[]>(getStoredCategories());
  const [categorySaveSuccess, setCategorySaveSuccess] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

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

  const handleSaveCategory = (cat: CategoryItem) => {
    let updated: CategoryItem[];
    const exists = categories.some((c) => c.id === cat.id);
    if (exists) {
      updated = categories.map((c) => (c.id === cat.id ? cat : c));
    } else {
      updated = [...categories, cat];
    }
    setCategories(updated);
    saveStoredCategories(updated);
    setCategorySaveSuccess(`La catégorie "${cat.label}" a été enregistrée !`);
    setTimeout(() => setCategorySaveSuccess(null), 3000);
    setEditingCategory(null);
  };

  const handleCreateNewCategory = () => {
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      label: 'Nouvelle Catégorie',
      subtitle: 'Description de la catégorie',
      iconName: 'Folder',
    };
    setEditingCategory(newCat);
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    const updated = categories.filter((c) => c.id !== deletingCategory.id);
    setCategories(updated);
    saveStoredCategories(updated);
    setCategorySaveSuccess(`La catégorie "${deletingCategory.label}" a été supprimée.`);
    setTimeout(() => setCategorySaveSuccess(null), 3000);
    setDeletingCategory(null);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setCategories(updated);
    saveStoredCategories(updated);
    setCategorySaveSuccess(`Ordre des catégories mis à jour : "${moved.label}" est maintenant en position #${targetIndex + 1}.`);
    setTimeout(() => setCategorySaveSuccess(null), 3000);
  };

  const handleSetCategoryPosition = (currentIndex: number, newPosition: number) => {
    const targetIndex = newPosition - 1;
    if (targetIndex < 0 || targetIndex >= categories.length || targetIndex === currentIndex) return;
    const updated = [...categories];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setCategories(updated);
    saveStoredCategories(updated);
    setCategorySaveSuccess(`Catégorie "${moved.label}" déplacée en position #${newPosition}.`);
    setTimeout(() => setCategorySaveSuccess(null), 3000);
  };

  const PRESET_HERO_IMAGES = [
    {
      id: 'luxury-print-kit',
      label: 'Coffret Studio Haute Définition',
      url: '/src/assets/images/hero_luxury_print_kit_1792003115399.jpg',
    },
    {
      id: 'kit-signature',
      label: 'Welcome Kit Signature',
      url: '/src/assets/images/hero_custom_goodies_kit_1791981759014.jpg',
    },
    {
      id: 'linen-notebook',
      label: 'Carnet Lin & Papeterie',
      url: '/src/assets/images/product_linen_notebook_1791981763268.jpg',
    },
    {
      id: 'totebag-bio',
      label: 'Tote Bag Coton Bio',
      url: '/src/assets/images/product_organic_totebag_1791981762796.jpg',
    },
    {
      id: 'water-bottle',
      label: 'Gourde Isotherme Inox',
      url: '/src/assets/images/product_stainless_waterbottle_1791981762310.jpg',
    },
  ];

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("L'image choisie est trop volumineuse (maximum 20 Mo).");
      return;
    }
    const oldUrl = siteContent.heroImage;
    setUploadingLabel('Téléversement Image Principale (Hero)...');
    setUploadProgress(0);
    try {
      const url = await uploadImageToFirebaseStorage(file, 'hero_images', (p) => setUploadProgress(p));
      if (oldUrl) {
        await deleteImageFromFirebaseStorage(oldUrl);
      }
      setSiteContent((prev) => ({ ...prev, heroImage: url }));
    } catch (err) {
      console.error('Erreur téléversement image hero', err);
      alert('Erreur lors du téléversement de l’image.');
    } finally {
      setUploadProgress(null);
    }
  };

  // Formulaire de modification du code PIN
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialiser avec le cache local pour affichage instantané
    setOrders(getStoredOrders());
    setSiteTheme(getSiteTheme());
    setSiteContent(getSiteContent());
    setProducts(getStoredProducts());
    setCompanyProfile(getCompanyProfile());
    setMvolaConfig(getMVolaConfig());

    // 2. Synchroniser avec la base Firestore
    syncOrdersFromFirestore().then((remoteOrders) => {
      setOrders(remoteOrders);
    });
    fetchAdminPinFromFirestore();
    fetchSiteThemeFromFirestore().then((remoteTheme) => {
      setSiteTheme(remoteTheme);
      setCustomHexInput(remoteTheme.customColor || remoteTheme.baseColor);
    });
    fetchSiteContentFromFirestore().then((remoteContent) => {
      setSiteContent(remoteContent);
    });
    fetchProductsFromFirestore().then((remoteProducts) => {
      setProducts(remoteProducts);
    });
    fetchCompanyProfileFromFirestore().then((remoteCompany) => {
      setCompanyProfile(remoteCompany);
    });
    fetchMVolaConfigFromFirestore().then((remoteMVola) => {
      setMvolaConfig(remoteMVola);
    });

    // 3. Écouter les mises à jour en direct depuis Firestore
    const unsubscribe = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    const unsubContent = subscribeToSiteContent((liveContent) => {
      setSiteContent(liveContent);
    });
    const unsubProducts = subscribeToProducts((liveProducts) => {
      setProducts(liveProducts);
    });
    const unsubCompany = subscribeToCompanyProfile((liveCompany) => {
      setCompanyProfile(liveCompany);
    });
    const unsubMVola = subscribeToMVolaConfig((liveMVola) => {
      setMvolaConfig(liveMVola);
    });

    return () => {
      unsubscribe();
      unsubContent();
      unsubProducts();
      unsubCompany();
      unsubMVola();
    };
  }, []);

  const handleSaveMVolaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveMVolaConfig(mvolaConfig);
    const modeLabel = !mvolaConfig.isSandbox ? 'Production (Go Live - En direct)' : 'Sandbox (Test)';
    setMvolaSaveSuccess(`La configuration MVola en mode ${modeLabel} a été enregistrée avec succès !`);
    setTimeout(() => setMvolaSaveSuccess(null), 4000);
  };

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("L'image choisie est trop volumineuse (maximum 15 Mo).");
      return;
    }
    const oldUrl = companyProfile.logoUrl;
    setUploadingLabel('Téléversement Logo Société...');
    setUploadProgress(0);
    try {
      const url = await uploadImageToFirebaseStorage(file, 'company_logos', (p) => setUploadProgress(p));
      if (oldUrl) {
        await deleteImageFromFirebaseStorage(oldUrl);
      }
      setCompanyProfile((prev) => ({ ...prev, logoUrl: url }));
    } catch (err) {
      console.error('Erreur téléversement logo société', err);
      alert('Erreur lors du téléversement du logo.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanyProfile(companyProfile);
    setCompanySaveSuccess('Les identifiants et le logo de la société ont été enregistrés avec succès !');
    setTimeout(() => setCompanySaveSuccess(null), 4000);
  };

  const handleSaveSiteContent = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteContent(siteContent);
    setContentSaveSuccess('Les textes, simulateurs et cartes d’engagement ont été enregistrés et publiés dans Firestore !');
    setTimeout(() => setContentSaveSuccess(null), 4000);
  };

  const handleAddSimulatorItem = () => {
    const newItem: FinishSimulatorItem = {
      id: `sim-${Date.now()}`,
      label: 'Nouvelle Finition',
      description: 'Description détaillée de la finition d’impression...',
    };
    setSiteContent((prev) => ({
      ...prev,
      heroFinishSimulators: [...prev.heroFinishSimulators, newItem],
    }));
  };

  const handleRemoveSimulatorItem = (id: string) => {
    setSiteContent((prev) => ({
      ...prev,
      heroFinishSimulators: prev.heroFinishSimulators.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateSimulatorItem = (id: string, patch: Partial<FinishSimulatorItem>) => {
    setSiteContent((prev) => ({
      ...prev,
      heroFinishSimulators: prev.heroFinishSimulators.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleAddGuaranteeCard = () => {
    const newCard: GuaranteeCardItem = {
      id: `card-${Date.now()}`,
      iconName: 'Sparkles',
      title: 'Nouvel Engagement My PRINT',
      detail: 'Description claire et concise de l’engagement ou de la garantie.',
    };
    setSiteContent((prev) => ({
      ...prev,
      guaranteeCards: [...prev.guaranteeCards, newCard],
    }));
  };

  const handleRemoveGuaranteeCard = (id: string) => {
    setSiteContent((prev) => ({
      ...prev,
      guaranteeCards: prev.guaranteeCards.filter((card) => card.id !== id),
    }));
  };

  const handleUpdateGuaranteeCard = (id: string, patch: Partial<GuaranteeCardItem>) => {
    setSiteContent((prev) => ({
      ...prev,
      guaranteeCards: prev.guaranteeCards.map((card) =>
        card.id === id ? { ...card, ...patch } : card
      ),
    }));
  };

  const handleAddDeliveryTier = () => {
    const currentTiers = siteContent.deliveryTiers || DEFAULT_DELIVERY_TIERS;
    const lastTier = currentTiers[currentTiers.length - 1];
    const newMin = lastTier ? lastTier.maxAmount : 0;
    const newTier: DeliveryTier = {
      id: `tier-${Date.now()}`,
      minAmount: newMin,
      maxAmount: newMin + 500000,
      fee: (lastTier ? lastTier.fee : 5000) + 5000,
    };
    setSiteContent((prev) => ({
      ...prev,
      deliveryTiers: [...(prev.deliveryTiers || DEFAULT_DELIVERY_TIERS), newTier],
    }));
  };

  const handleRemoveDeliveryTier = (id: string) => {
    setSiteContent((prev) => ({
      ...prev,
      deliveryTiers: (prev.deliveryTiers || DEFAULT_DELIVERY_TIERS).filter((t) => t.id !== id),
    }));
  };

  const handleUpdateDeliveryTier = (id: string, patch: Partial<DeliveryTier>) => {
    setSiteContent((prev) => ({
      ...prev,
      deliveryTiers: (prev.deliveryTiers || DEFAULT_DELIVERY_TIERS).map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    }));
  };

  // --- GESTION DE LA SECTION ÉVÉNEMENT & IMAGES ÉVÉNEMENTIELLES (Carrousel 4s) ---
  const handleAddEventSlide = () => {
    const newSlide: EventSlide = {
      id: `evt-${Date.now()}`,
      shortTitle: 'Nouvel Événement 2026',
      description: 'Description courte de l’événement promotionnel à afficher sur le carrousel 4s.',
      imageUrl: '/src/assets/images/hero_custom_goodies_kit_1791981759014.jpg',
      buttonText: 'Acheter',
      active: true,
    };
    const updated = {
      ...siteContent,
      eventSlides: [...(siteContent.eventSlides || DEFAULT_EVENT_SLIDES), newSlide],
    };
    setSiteContent(updated);
    saveSiteContent(updated);
    setContentSaveSuccess('Nouvel événement ajouté et publié en direct !');
    setTimeout(() => setContentSaveSuccess(null), 3000);
  };

  const handleRemoveEventSlide = (id: string) => {
    const updated = {
      ...siteContent,
      eventSlides: (siteContent.eventSlides || DEFAULT_EVENT_SLIDES).filter((s) => s.id !== id),
    };
    setSiteContent(updated);
    saveSiteContent(updated);
    setContentSaveSuccess('Événement supprimé et mis à jour.');
    setTimeout(() => setContentSaveSuccess(null), 3000);
  };

  const handleUpdateEventSlide = (id: string, patch: Partial<EventSlide>) => {
    const updatedSlides = (siteContent.eventSlides || DEFAULT_EVENT_SLIDES).map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    const updated = {
      ...siteContent,
      eventSlides: updatedSlides,
    };
    setSiteContent(updated);
    saveSiteContent(updated);
  };

  const handleEventImageFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("L'image événementielle choisie est trop volumineuse (maximum 20 Mo).");
      return;
    }
    const currentSlide = (siteContent.eventSlides || DEFAULT_EVENT_SLIDES).find(s => s.id === id);
    const oldUrl = currentSlide?.imageUrl;

    setUploadingLabel('Téléversement Image Événementielle...');
    setUploadProgress(0);
    try {
      const url = await uploadImageToFirebaseStorage(file, 'event_slides', (p) => setUploadProgress(p));
      if (oldUrl) {
        await deleteImageFromFirebaseStorage(oldUrl);
      }
      const updatedSlides = (siteContent.eventSlides || DEFAULT_EVENT_SLIDES).map((s) =>
        s.id === id ? { ...s, imageUrl: url } : s
      );
      const updated = {
        ...siteContent,
        eventSlides: updatedSlides,
      };
      setSiteContent(updated);
      saveSiteContent(updated);
      setContentSaveSuccess('Image publiée en direct !');
      setTimeout(() => setContentSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur téléversement image événement', err);
      alert('Erreur lors du téléversement de l’image événementielle.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleProductImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("La photo choisie est trop volumineuse (maximum 20 Mo).");
      return;
    }
    const oldUrl = editingProduct.imageUrl;

    setUploadingLabel('Téléversement Photo Produit...');
    setUploadProgress(0);
    try {
      const url = await uploadImageToFirebaseStorage(file, 'products', (p) => setUploadProgress(p));
      if (oldUrl && oldUrl.includes('firebasestorage.googleapis.com')) {
        await deleteImageFromFirebaseStorage(oldUrl).catch(() => {});
      }
      setEditingProduct({
        ...editingProduct,
        imageUrl: url,
      });
    } catch (err) {
      console.error('Erreur téléversement photo produit', err);
      alert('Erreur lors du téléversement de la photo produit.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSelectPresetTheme = (preset: (typeof THEME_PRESETS)[0]) => {
    const newTheme: SiteThemeConfig = {
      mode: 'preset',
      presetId: preset.id,
      customColor: preset.baseColor,
      baseColor: preset.baseColor,
      gradientFrom: preset.gradientFrom,
      gradientVia: preset.gradientVia,
      gradientTo: preset.gradientTo,
      accentOrb1: preset.accentOrb1,
      accentOrb2: preset.accentOrb2,
      accentOrb3: preset.accentOrb3,
    };
    setSiteTheme(newTheme);
    setCustomHexInput(preset.baseColor);
    saveSiteTheme(newTheme);
    setThemeSaveSuccess(`Thème « ${preset.name} » appliqué et enregistré dans Firestore.`);
    setTimeout(() => setThemeSaveSuccess(null), 3500);
  };

  const handleApplyCustomColor = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) return;
    const newTheme = generateThemeFromCustomHex(cleanHex);
    setSiteTheme(newTheme);
    saveSiteTheme(newTheme);
    setThemeSaveSuccess(`Couleur de fond ${cleanHex.toUpperCase()} appliquée et enregistrée dans Firestore.`);
    setTimeout(() => setThemeSaveSuccess(null), 3500);
  };

  const handleResetDefaultTheme = () => {
    setSiteTheme(DEFAULT_THEME_CONFIG);
    setCustomHexInput(DEFAULT_THEME_CONFIG.customColor);
    saveSiteTheme(DEFAULT_THEME_CONFIG);
    setThemeSaveSuccess('Thème minéral standard rétabli avec succès.');
    setTimeout(() => setThemeSaveSuccess(null), 3500);
  };

  const handleSelectBgImage = (
    url: string,
    defaultFilters?: { blur: number; opacity: number; brightness: number; contrast: number; saturate: number }
  ) => {
    const updatedTheme: SiteThemeConfig = {
      ...siteTheme,
      bgImageUrl: url,
      bgBlur: defaultFilters?.blur ?? siteTheme.bgBlur ?? 0,
      bgOpacity: defaultFilters?.opacity ?? siteTheme.bgOpacity ?? 80,
      bgBrightness: defaultFilters?.brightness ?? siteTheme.bgBrightness ?? 100,
      bgContrast: defaultFilters?.contrast ?? siteTheme.bgContrast ?? 100,
      bgSaturate: defaultFilters?.saturate ?? siteTheme.bgSaturate ?? 100,
    };
    setSiteTheme(updatedTheme);
    saveSiteTheme(updatedTheme);
    setThemeSaveSuccess('Image de fond et filtres enregistrés dans Firestore !');
    setTimeout(() => setThemeSaveSuccess(null), 3500);
  };

  const handleUpdateBgFilter = (field: keyof SiteThemeConfig, value: number) => {
    const updatedTheme: SiteThemeConfig = {
      ...siteTheme,
      [field]: value,
    };
    setSiteTheme(updatedTheme);
    saveSiteTheme(updatedTheme);
  };

  const handleClearBgImage = () => {
    const updatedTheme: SiteThemeConfig = {
      ...siteTheme,
      bgImageUrl: undefined,
    };
    setSiteTheme(updatedTheme);
    saveSiteTheme(updatedTheme);
    setThemeSaveSuccess('Image de fond retirée.');
    setTimeout(() => setThemeSaveSuccess(null), 3000);
  };

  const handleApplyCustomBgUrl = () => {
    const url = customBgUrlInput.trim();
    if (!url) return;
    handleSelectBgImage(url);
    setCustomBgUrlInput('');
  };

  const handleApplyFilterPreset = (preset: {
    blur: number;
    opacity: number;
    brightness: number;
    contrast: number;
    saturate: number;
  }) => {
    const updatedTheme: SiteThemeConfig = {
      ...siteTheme,
      bgBlur: preset.blur,
      bgOpacity: preset.opacity,
      bgBrightness: preset.brightness,
      bgContrast: preset.contrast,
      bgSaturate: preset.saturate,
    };
    setSiteTheme(updatedTheme);
    saveSiteTheme(updatedTheme);
    setThemeSaveSuccess('Préréglage de filtres appliqué et synchronisé !');
    setTimeout(() => setThemeSaveSuccess(null), 3000);
  };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("L'image de fond choisie est trop volumineuse (maximum 20 Mo).");
      return;
    }
    const oldUrl = siteTheme.bgImageUrl;
    setUploadingLabel('Téléversement Image de Fond...');
    setUploadProgress(0);
    try {
      const url = await uploadImageToFirebaseStorage(file, 'bg_images', (p) => setUploadProgress(p));
      if (oldUrl) {
        await deleteImageFromFirebaseStorage(oldUrl);
      }
      handleSelectBgImage(url);
    } catch (err) {
      console.error('Erreur téléversement image fond', err);
      alert('Erreur lors du téléversement de l’image de fond.');
    } finally {
      setUploadProgress(null);
    }
  };

  // Filtrage et recherche
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      let matchesStatus = true;
      if (statusFilter === 'expedie') {
        matchesStatus = order.status === 'expedie';
      } else if (statusFilter === 'en_cours') {
        matchesStatus = order.status !== 'expedie';
      } else if (statusFilter !== 'all') {
        matchesStatus = order.status === statusFilter;
      }

      const clientName = getOrderClientName(order).toLowerCase();
      const matchesQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        clientName.includes(q) ||
        (order.clientNote && order.clientNote.toLowerCase().includes(q)) ||
        order.items.some(
          (it) =>
            it.productName.toLowerCase().includes(q) ||
            it.customBrandingText.toLowerCase().includes(q)
        );
      return matchesStatus && matchesQuery;
    });
  }, [orders, searchQuery, statusFilter]);

  // Statistiques clés
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalPieces = orders.reduce((acc, o) => acc + o.totalPieces, 0);
    const newCount = orders.filter((o) => o.status === 'nouveau').length;
    const batCount = orders.filter((o) => o.status === 'bat_en_cours').length;
    return {
      totalOrders: orders.length,
      totalRevenue,
      totalPieces,
      newCount,
      batCount,
    };
  }, [orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setOrders(updated);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(`Supprimer définitivement la commande #${orderId} ?`)) {
      const updated = deleteStoredOrder(orderId);
      setOrders(updated);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(null);

    const actualPin = getAdminPin();
    if (currentPinInput !== actualPin) {
      setPinChangeError("L'actuelle clé à 6 chiffres est erronée.");
      return;
    }

    if (!/^\d{6}$/.test(newPinInput)) {
      setPinChangeError('La nouvelle clé doit comporter exactement 6 chiffres numériques.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinChangeError('Les deux nouveaux codes ne correspondent pas.');
      return;
    }

    const success = setAdminPin(newPinInput);
    if (success) {
      setPinChangeSuccess('Votre nouvelle clé de sécurité à 6 chiffres a été enregistrée avec succès.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      setPinChangeError("Échec de l'enregistrement de la nouvelle clé.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'nouveau':
        return {
          label: 'Nouveau dossier',
          colorClass: 'bg-emerald-500/15 text-emerald-900 border-emerald-300',
          icon: AlertCircle,
        };
      case 'proforma_demande':
        return {
          label: 'Proforma demandée',
          colorClass: 'bg-indigo-500/15 text-indigo-900 border-indigo-300',
          icon: FileText,
        };
      case 'paye_mvola':
        return {
          label: 'Payé via MVola',
          colorClass: 'bg-emerald-600/20 text-emerald-950 border-emerald-400 font-bold',
          icon: CheckCircle2,
        };
      case 'a_livrer_paiement_reception':
        return {
          label: 'Paiement à la réception',
          colorClass: 'bg-amber-600/20 text-amber-950 border-amber-400 font-bold',
          icon: Truck,
        };
      case 'bat_en_cours':
        return {
          label: 'BAT en préparation',
          colorClass: 'bg-amber-500/15 text-amber-900 border-amber-300',
          icon: Clock,
        };
      case 'en_production':
        return {
          label: 'En atelier d’impression',
          colorClass: 'bg-blue-500/15 text-blue-900 border-blue-300',
          icon: Layers,
        };
      case 'expedie':
        return {
          label: 'Expédié / Livré',
          colorClass: 'bg-purple-500/15 text-purple-900 border-purple-300',
          icon: Truck,
        };
      default:
        return {
          label: 'Dossier',
          colorClass: 'bg-slate-500/15 text-slate-900 border-slate-300',
          icon: FileText,
        };
    }
  };

  // Handlers pour la Gestion des Produits
  const handleSaveProduct = (p: Product) => {
    const finalPrice = Number(p.sellingPrice) || Number(p.basePrice) || 0;
    const catObj = categories.find((c) => c.id === p.category);
    const enrichedProduct: Product = {
      ...p,
      sellingPrice: finalPrice,
      basePrice: finalPrice,
      categoryLabel: catObj ? catObj.label : (p.categoryLabel || 'Général'),
      technicalDetail: p.technicalDetail || p.shortDescription || '',
      shortDescription: p.technicalDetail || p.shortDescription || '',
      fullDescription: p.technicalDetail || p.fullDescription || '',
      minOrderQty: p.minOrderQty || 1,
      quantityStep: p.quantityStep || 1,
      leadTimeDays: p.leadTimeDays || 3,
      specs: p.specs || {
        material: '',
        dimensions: '',
        certification: '',
        printArea: '',
      },
      variants: p.variants && p.variants.length > 0 ? p.variants : [
        { id: 'v-1', name: 'Standard', swatchHex: '#2563EB', finishLabel: 'Standard' },
      ],
      printMethods: p.printMethods && p.printMethods.length > 0 ? p.printMethods : [
        { id: 'm-1', name: 'Impression Haute Précision', detail: 'Haute Résolution', unitSurcharge: 0 },
      ],
    };

    let updated: Product[];
    const exists = products.some((item) => item.id === enrichedProduct.id);
    if (exists) {
      updated = products.map((item) => (item.id === enrichedProduct.id ? enrichedProduct : item));
    } else {
      updated = [enrichedProduct, ...products];
    }
    setProducts(updated);
    saveStoredProducts(updated);
    setProductSaveSuccess(`Le produit "${enrichedProduct.name}" a été enregistré dans le catalogue !`);
    setTimeout(() => setProductSaveSuccess(null), 4000);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setDeletingProduct(target);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    const target = deletingProduct;
    if (target.imageUrl && target.imageUrl.includes('firebasestorage.googleapis.com')) {
      await deleteImageFromFirebaseStorage(target.imageUrl).catch(() => {});
    }
    const updated = products.filter((p) => p.id !== target.id);
    setProducts(updated);
    saveStoredProducts(updated);
    if (editingProduct?.id === target.id) {
      setEditingProduct(null);
    }
    setProductSaveSuccess(`Le produit "${target.name}" a été définitivement supprimé.`);
    setTimeout(() => setProductSaveSuccess(null), 3000);
    setDeletingProduct(null);
  };

  const handleDuplicateProduct = (p: Product) => {
    const cloned: Product = {
      ...p,
      id: `${p.id}-copie-${Date.now().toString().slice(-4)}`,
      name: `${p.name} (Copie)`,
    };
    const updated = [cloned, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    setEditingProduct(cloned);
  };

  const handleCreateNewProduct = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: 'Nouveau Produit My PRINT',
      imageUrl: '',
      technicalDetail: 'Matière premium, dimensions standard, surface de marquage optimisée et finitions soignées.',
      sellingPrice: 5000,
      category: 'stationery',
      categoryLabel: 'Papeterie & Édition',
      basePrice: 5000,
      shortDescription: 'Matière premium, dimensions standard, surface de marquage optimisée et finitions soignées.',
      fullDescription: 'Matière premium, dimensions standard, surface de marquage optimisée et finitions soignées.',
      minOrderQty: 1,
      quantityStep: 1,
      leadTimeDays: 3,
      tag: 'Nouveauté',
      specs: {
        material: '',
        dimensions: '',
        certification: '',
        printArea: '',
      },
      variants: [
        { id: `v-1`, name: 'Standard Satiné', swatchHex: '#2563EB', finishLabel: 'Satiné' },
      ],
      printMethods: [
        { id: `m-1`, name: 'Impression Directe HD', detail: 'Haute Précision', unitSurcharge: 0 },
      ],
    };
    setEditingProduct(newProduct);
  };

  const handleResetProductsToDefault = () => {
    if (confirm('Voulez-vous réinitialiser le catalogue produit aux valeurs par défaut ?')) {
      setProducts(PRODUCTS);
      saveStoredProducts(PRODUCTS);
      setProductSaveSuccess('Catalogue réinitialisé.');
      setTimeout(() => setProductSaveSuccess(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-slate-900 selection:bg-blue-600/15">
      {uploadProgress !== null && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate">{uploadingLabel} ({uploadProgress}%)</span>
          </div>
          <div className="w-36 sm:w-64 bg-blue-900/50 rounded-full h-2.5 overflow-hidden shrink-0 border border-white/20">
            <div 
              className="bg-white h-full transition-all duration-200 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 1. Barre supérieure fixe d'administration */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-900/10 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {companyProfile.logoUrl ? (
            <img
              src={companyProfile.logoUrl || undefined}
              alt={companyProfile.name}
              className="h-8 max-w-[150px] object-contain shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white p-1 flex items-center justify-center shrink-0">
              <AppLogo className="w-full h-full text-white" />
            </div>
          )}
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-950 shrink-0">
            {companyProfile.name || 'My PRINT'}
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-600 text-white shadow-xs truncate">
            <span className="hidden sm:inline">Espace Paramètres & Gestion</span>
            <span className="inline sm:hidden">Paramètres</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LiquidGlassButton size="sm" variant="glass" onClick={onBackToStore}>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Retour au site client</span>
            <span className="inline sm:hidden">Retour site</span>
          </LiquidGlassButton>
        </div>
      </header>

      {/* 2. Conteneur principal avec menu gauche (système de menu gauche bouton) */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* MENU COMPACT MOBILE / SIDEBAR DESKTOP */}
        <aside className="lg:col-span-3">
          <div className="glass p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl lg:sticky lg:top-20 space-y-2">
            <div className="hidden lg:block px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Menu de gestion
            </div>

            {/* Grille responsive sur mobile / Vertical sur Desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5 sm:gap-2">
              {/* Bouton 1 : Liste des commandes dans le site */}
              <button
                type="button"
                onClick={() => setActivePage('orders')}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activePage === 'orders'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/60 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="truncate">Commandes</span>
                </div>
                <span
                  className={`font-mono-tabular text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                    activePage === 'orders'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-900/10 text-slate-800'
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              {/* Bouton 2 : Produits du catalogue */}
              <button
                type="button"
                onClick={() => setActivePage('products')}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activePage === 'products'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/60 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  <span className="truncate">Produits</span>
                </div>
                <span
                  className={`font-mono-tabular text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                    activePage === 'products'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-900/10 text-slate-800'
                  }`}
                >
                  {products.length}
                </span>
              </button>



              {/* Bouton 3 : Section Sécurité (code à 6 chiffres) */}
              <button
                type="button"
                onClick={() => setActivePage('security')}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activePage === 'security'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/60 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Sécurité</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60 hidden sm:block shrink-0" />
              </button>

              {/* Bouton 4 : Personnalisation Site (Thème & Fond + Textes & Cartes) */}
              <button
                type="button"
                onClick={() => setActivePage('customization')}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activePage === 'customization'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/60 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Palette className="w-4 h-4 shrink-0" />
                  <span className="truncate">Personnalisation Site</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60 hidden sm:block shrink-0" />
              </button>

              {/* Bouton 5 : Configuration API & Clé Sandbox MVola */}
              <button
                type="button"
                onClick={() => setActivePage('mvola')}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activePage === 'mvola'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/60 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Clé Sandbox MVola</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60 hidden sm:block shrink-0" />
              </button>
            </div>

            {/* Section en bas du menu : Clic sur "Session Administrateur" ouvre la page Identifiants Société */}
            <button
              type="button"
              onClick={() => setActivePage('company')}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer mt-4 space-y-1.5 ${
                activePage === 'company'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30'
                  : 'bg-white/50 hover:bg-white/80 border-white/90 text-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-semibold">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className={`w-4 h-4 shrink-0 ${activePage === 'company' ? 'text-white' : 'text-emerald-600'}`} />
                  <span className={`text-xs sm:text-sm truncate ${activePage === 'company' ? 'text-white' : 'text-slate-950'}`}>
                    Session Administrateur
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${activePage === 'company' ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <p className={`text-[11px] leading-relaxed ${activePage === 'company' ? 'text-blue-100' : 'text-slate-500'}`}>
                Identifiants société (Nom, Adresse, Tél, WhatsApp, Email, Facebook, Logo)
              </p>
            </button>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL DE LA PAGE SÉLECTIONNÉE */}
        <section className="lg:col-span-9">
          {activePage === 'orders' && (
            <div className="space-y-6">
              {/* Entête de page Commandes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                    Liste des Commandes du Site
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Consultation des devis grossiste et récapitulatifs validés par les clients.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <LiquidGlassButton
                    size="sm"
                    variant="glass"
                    onClick={() => setOrders(getStoredOrders())}
                    title="Actualiser la liste"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualiser</span>
                  </LiquidGlassButton>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteAllPin('');
                      setDeleteAllError(null);
                      setIsDeleteAllModalOpen(true);
                    }}
                    title="Supprimer toutes les commandes"
                    className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barre de Recherche (Icône sans texte) et Filtres par statut */}
              <div className="glass p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Icône (sans texte) de recherche en survol / clic */}
                <div className="relative flex items-center">
                  {!isOrderSearchExpanded && !searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setIsOrderSearchExpanded(true)}
                      onMouseEnter={() => setIsOrderSearchExpanded(true)}
                      title="Rechercher client, commande ou produit..."
                      className="w-10 h-10 rounded-full glass border border-white/90 bg-white/70 hover:bg-white text-slate-700 hover:text-blue-600 flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    >
                      <Search className="w-4 h-4 text-slate-700 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ) : (
                    <div
                      onMouseLeave={() => {
                        if (!searchQuery) setIsOrderSearchExpanded(false);
                      }}
                      className="relative flex items-center w-56 sm:w-72 md:w-80 h-10 rounded-full glass border border-white/90 bg-white/85 shadow-md px-3 gap-2 transition-all duration-300 ease-out"
                    >
                      <Search className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher client, commande, produit..."
                        autoFocus
                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsOrderSearchExpanded(false);
                        }}
                        aria-label="Fermer la recherche"
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtres de statut : Deux boutons simples ("En cours" et "Livré") */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('en_cours')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      statusFilter === 'en_cours'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    <span>En cours</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        statusFilter === 'en_cours'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/90 text-slate-800'
                      }`}
                    >
                      {orders.filter((o) => o.status !== 'expedie').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('expedie')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      statusFilter === 'expedie'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    <span>Livré</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        statusFilter === 'expedie'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/90 text-slate-800'
                      }`}
                    >
                      {orders.filter((o) => o.status === 'expedie').length}
                    </span>
                  </button>
                </div>
              </div>

              {/* LISTE DES COMMANDES SIMPLIFIÉE */}
              {filteredOrders.length === 0 ? (
                <div className="glass p-12 text-center rounded-3xl">
                  <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-display text-base font-semibold text-slate-900">
                    Aucune commande trouvée
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {searchQuery
                      ? 'Modifiez votre recherche pour afficher des résultats.'
                      : 'Les commandes validées depuis le panier client apparaîtront ici automatiquement.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    const isExpanded = selectedOrder?.id === order.id;
                    const orderDate = new Date(order.createdAt);
                    const isValidDate = !isNaN(orderDate.getTime());
                    const dateFormatted = isValidDate
                      ? orderDate.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '19/10/2026';
                    const timeFormatted = isValidDate
                      ? orderDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '12:00';
                    const clientName = getOrderClientName(order);

                    return (
                      <div key={order.id} className="space-y-2">
                        {/* Ligne simplifiée compacte : Nom client AU-DESSUS de Date/Heure (à gauche) & Total à l'extrême droite (à gauche du bouton action) */}
                        <div
                          onClick={() => setSelectedOrder(isExpanded ? null : order)}
                          className={`glass p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 sm:gap-6 border border-white/90 hover:border-blue-500/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                            isExpanded ? 'ring-2 ring-blue-600/30 border-blue-600/50 bg-white/90' : ''
                          }`}
                        >
                          {/* Partie Gauche : Nom Client AU-DESSUS de Date & Heure */}
                          <div className="flex-1 min-w-0">
                            {/* Nom du client au-dessus de Date & Heure */}
                            <div className="min-w-0 flex-1 space-y-1">
                              {/* Ligne 1 (Haut) : Nom du Client + ID */}
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-slate-950 text-sm sm:text-base tracking-tight truncate">
                                  {clientName}
                                </h3>
                                <span className="text-[10px] sm:text-xs text-slate-400 font-mono bg-slate-100/80 px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                                  #{order.id}
                                </span>
                              </div>

                              {/* Ligne 2 (Bas) : Date et Heure sous le nom client */}
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <span className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 font-mono-tabular text-[11px] text-slate-700 shadow-2xs">
                                  {dateFormatted}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 font-mono-tabular text-[11px] text-slate-700 shadow-2xs">
                                  {timeFormatted}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Extrême droite : Total montant à gauche du bouton d'action */}
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto text-right">
                            {/* Total montant */}
                            <div className="text-right">
                              <span className="font-mono-tabular font-extrabold text-[#00375e] text-base sm:text-lg">
                                {formatFullAriary(order.totalAmount)}
                              </span>
                            </div>

                            {/* Bouton d'action / Chevron */}
                            <div className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-100/60 transition-colors shrink-0">
                              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Détails de la commande (Affichés au clic de l'élément de la commande) */}
                        {isExpanded && (
                          <div className="glass p-4 sm:p-5 rounded-2xl border border-blue-500/20 bg-white/80 space-y-4 animate-fade-in text-xs shadow-md">
                            {/* Header détails & statut */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/10">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.colorClass}`}>
                                  <badge.icon className="w-3.5 h-3.5" />
                                  <span>{badge.label}</span>
                                </span>
                                {order.contactPhone && (
                                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    Tél: {order.contactPhone}
                                  </span>
                                )}
                                {order.contactEmail && (
                                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {order.contactEmail}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 cursor-pointer focus:outline-none"
                                >
                                  <option value="nouveau">Statut: Nouveau dossier</option>
                                  <option value="proforma_demande">Statut: Proforma demandée</option>
                                  <option value="paye_mvola">Statut: Payé via MVola</option>
                                  <option value="a_livrer_paiement_reception">Statut: Paiement à la réception</option>
                                  <option value="bat_en_cours">Statut: BAT en préparation</option>
                                  <option value="en_production">Statut: En atelier d’impression</option>
                                  <option value="expedie">Statut: Expédié / Livré</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOrder(order.id);
                                  }}
                                  title="Supprimer la commande"
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Consigne client / Adresse */}
                            {order.clientNote && (
                              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800">
                                <strong>Consigne client :</strong> {order.clientNote}
                              </div>
                            )}
                            {order.deliveryAddress && (
                              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950">
                                <strong>Adresse de livraison :</strong> {order.deliveryAddress}
                              </div>
                            )}

                            {/* Liste des articles */}
                            <div className="space-y-2">
                              <span className="font-bold text-slate-800 block text-xs">Articles de la commande :</span>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img
                                      src={item.imageUrl || undefined}
                                      alt={item.productName}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          '/src/assets/images/product_linen_notebook_1791981763268.jpg';
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-slate-900 text-xs truncate">{item.productName}</h4>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/15" style={{ backgroundColor: item.swatchHex }} />
                                        <span>{item.variantName}</span>
                                        <span>·</span>
                                        <span>{item.printMethodName}</span>
                                      </div>
                                      {item.customBrandingText && (
                                        <p className="text-[11px] text-blue-900 font-medium truncate">
                                          Marquage: {item.customBrandingText} {item.pantoneReference ? `(${item.pantoneReference})` : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono-tabular font-bold text-slate-950 text-xs block">
                                      {formatFullAriary(item.unitPrice * item.quantity)}
                                    </span>
                                    <span className="font-mono-tabular text-[10px] text-slate-500 block">
                                      {item.quantity} ex. × {formatFullAriary(item.unitPrice)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Impression BAT */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-900/10">
                              <span className="text-slate-500 text-[11px]">Volume total : {order.totalPieces} pièces</span>
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimer Fiche BAT</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAGE : GESTION DU CATALOGUE DE PRODUITS & CATEGORIES */}
          {activePage === 'products' && (
            <div className="space-y-6">
              {/* Entête de page Produits */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                    <SlidersHorizontal className="w-6 h-6 text-blue-600" />
                    <span>Gestion du Catalogue & Catégories</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Gérez les articles du catalogue, leurs prix, variantes et organisez les catégories de goodies.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {productSubTab === 'products' ? (
                    <>
                      <LiquidGlassButton
                        size="sm"
                        variant="glass"
                        onClick={() => setIsJsonImportModalOpen(true)}
                        title="Importer la liste de produits depuis un fichier JSON"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Importer JSON</span>
                      </LiquidGlassButton>

                      <LiquidGlassButton
                        size="sm"
                        variant="glass"
                        onClick={handleResetProductsToDefault}
                        title="Réinitialiser le catalogue par défaut"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Réinitialiser</span>
                      </LiquidGlassButton>

                      <LiquidGlassButton
                        size="md"
                        variant="primary"
                        onClick={handleCreateNewProduct}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un Produit</span>
                      </LiquidGlassButton>
                    </>
                  ) : (
                    <LiquidGlassButton
                      size="md"
                      variant="primary"
                      onClick={handleCreateNewCategory}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une Catégorie</span>
                    </LiquidGlassButton>
                  )}
                </div>
              </div>

              {/* Sous-onglets Produits & Catégories */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 border border-white/90 shadow-2xs max-w-md">
                <button
                  type="button"
                  onClick={() => setProductSubTab('products')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    productSubTab === 'products'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Articles ({products.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductSubTab('categories')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    productSubTab === 'categories'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Catégories ({categories.length})</span>
                </button>
              </div>

              {productSubTab === 'categories' ? (
                /* SECTION GESTION DES CATÉGORIES ET DE LEUR ORDRE */
                <div className="space-y-6">
                  {/* Bannière explicative d'organisation de l'ordre des catégories */}
                  <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
                    <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-950 text-xs mb-0.5">
                        Ordre d'affichage des catégories dans le Menu et l'Accueil
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Cet ordre détermine l'apparition exacte de vos catégories dans la barre de navigation supérieure du menu et dans la liste de filtres de la page d'accueil. Utilisez les boutons <strong>Monter</strong> et <strong>Descendre</strong> ou le sélecteur de rang pour réordonner vos catégories en direct.
                      </p>
                    </div>
                  </div>

                  {categorySaveSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{categorySaveSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat, index) => (
                      <div
                        key={cat.id}
                        className="glass p-5 rounded-3xl flex flex-col justify-between border border-white/90 hover:border-blue-500/30 transition-all shadow-sm"
                      >
                        <div className="flex items-start gap-3.5 mb-3">
                          {/* Badge de Rang / Ordre */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900 text-white shrink-0 min-w-[3.25rem] text-center border border-slate-800 shadow-2xs">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              RANG
                            </span>
                            <span className="font-mono-tabular text-base font-black text-white leading-tight mt-0.5">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-mono font-bold">
                                ID: {cat.id}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-slate-950 text-sm leading-snug">
                              {cat.label}
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {cat.subtitle || 'Aucune description'}
                            </p>
                          </div>
                        </div>

                        {/* Actions de réorganisation de l'ordre & Édition */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-900/10 flex-wrap">
                          {/* Boutons d'ordonnancement (Monter / Descendre) */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-0.5">
                              Ordre :
                            </span>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveCategory(index, 'up')}
                              title="Déplacer vers le haut / Réduire le rang"
                              className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs flex items-center gap-1 cursor-pointer font-bold text-xs"
                            >
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                              <span>Monter</span>
                            </button>

                            <button
                              type="button"
                              disabled={index === categories.length - 1}
                              onClick={() => handleMoveCategory(index, 'down')}
                              title="Déplacer vers le bas / Augmenter le rang"
                              className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs flex items-center gap-1 cursor-pointer font-bold text-xs"
                            >
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                              <span>Descendre</span>
                            </button>

                            {/* Sélecteur direct de position */}
                            <select
                              value={index + 1}
                              onChange={(e) => handleSetCategoryPosition(index, Number(e.target.value))}
                              aria-label={`Position pour ${cat.label}`}
                              className="px-2 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono font-bold text-slate-800 cursor-pointer focus:outline-none"
                            >
                              {categories.map((_, idx) => (
                                <option key={idx} value={idx + 1}>
                                  Pos #{idx + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Boutons Modifier & Supprimer */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(cat)}
                              title="Modifier la catégorie"
                              className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(cat)}
                              title="Supprimer la catégorie"
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MODAL D'ÉDITION DE CATÉGORIE */}
                  {editingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto">
                      <div className="glass w-full max-w-md flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                              <Tags className="w-4 h-4" />
                            </div>
                            <h2 className="font-display text-base font-bold text-slate-950">
                              {categories.some((c) => c.id === editingCategory.id) ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Identifiant (ID unique) *</label>
                            <input
                              type="text"
                              value={editingCategory.id}
                              onChange={(e) => setEditingCategory({ ...editingCategory, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-semibold"
                              placeholder="ex: drinkware"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Nom de la catégorie *</label>
                            <input
                              type="text"
                              value={editingCategory.label}
                              onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                              placeholder="ex: Drinkware & Céramique"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Sous-titre / Description</label>
                            <textarea
                              rows={2}
                              value={editingCategory.subtitle}
                              onChange={(e) => setEditingCategory({ ...editingCategory, subtitle: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                              placeholder="Description succincte..."
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Icône (Nom)</label>
                            <select
                              value={editingCategory.iconName || 'Folder'}
                              onChange={(e) => setEditingCategory({ ...editingCategory, iconName: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                            >
                              <option value="Folder">Dossier (Folder)</option>
                              <option value="Tag">Étiquette (Tag)</option>
                              <option value="Coffee">Tasse / Café (Coffee)</option>
                              <option value="BookOpen">Livre / Papeterie (BookOpen)</option>
                              <option value="Shirt">Textile (Shirt)</option>
                              <option value="Package">Colis / Coffret (Package)</option>
                              <option value="Sparkles">Étoiles (Sparkles)</option>
                              <option value="Crown">Couronne (Crown)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-900/10">
                          <LiquidGlassButton
                            size="sm"
                            variant="glass"
                            onClick={() => setEditingCategory(null)}
                          >
                            <span>Annuler</span>
                          </LiquidGlassButton>
                          <LiquidGlassButton
                            size="sm"
                            variant="primary"
                            onClick={() => handleSaveCategory(editingCategory)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Enregistrer</span>
                          </LiquidGlassButton>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL DE CONFIRMATION DE SUPPRESSION DE CATÉGORIE */}
                  {deletingCategory && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
                      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl border border-red-500/20 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-slate-950">
                            Supprimer la catégorie "{deletingCategory.label}" ?
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Cette action est irréfutable. Voulez-vous vraiment supprimer cette catégorie ?
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(null)}
                            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={confirmDeleteCategory}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Oui, Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* SECTION CATALOGUE PRODUITS */
                <div className="space-y-6">
                  {productSaveSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{productSaveSuccess}</span>
                    </div>
                  )}

              {/* Barre de Recherche et Filtres par Catégorie */}
              <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-80">
                  <LiquidGlassInput
                    type="search"
                    placeholder="Rechercher par nom, matière, tag..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    clearable
                    prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
                    sizeVariant="sm"
                  />
                </div>

                {/* Filtres par catégorie */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'Toutes les catégories', subtitle: '' },
                    ...categories,
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        productCategoryFilter === cat.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white/45 text-slate-700 hover:bg-white/75'
                      }`}
                    >
                      {cat.id === 'all' ? 'Toutes les catégories' : cat.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* GRILLE DES PRODUITS */}
              {(() => {
                const filtered = products.filter((p) => {
                  const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
                  const query = productSearch.toLowerCase().trim();
                  const matchesQuery =
                    !query ||
                    p.name.toLowerCase().includes(query) ||
                    (p.technicalDetail && p.technicalDetail.toLowerCase().includes(query)) ||
                    (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
                    p.categoryLabel.toLowerCase().includes(query) ||
                    (p.tag && p.tag.toLowerCase().includes(query));
                  return matchesCat && matchesQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="glass p-12 text-center rounded-3xl">
                      <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="font-display text-base font-semibold text-slate-900">
                        Aucun produit trouvé dans cette sélection
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Modifiez vos critères de recherche ou cliquez sur "Ajouter un Produit".
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        className="glass p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 border border-white/90 hover:border-blue-500/30 transition-all shadow-2xs hover:shadow-xs"
                      >
                        {/* Affichage simplifié : Photo & Nom seulement */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs">
                            <img
                              src={p.imageUrl || undefined}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/src/assets/images/product_linen_notebook_1791981763268.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display font-bold text-slate-950 text-xs sm:text-sm truncate">
                              {p.name}
                            </h3>
                            {/* Ronds de couleur sans texte en aperçu */}
                            {p.variants && p.variants.length > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {p.variants.slice(0, 6).map((v, idx) => (
                                  <span
                                    key={v.id || idx}
                                    className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs ring-1 ring-slate-300"
                                    style={{ backgroundColor: v.swatchHex }}
                                    title={v.name || v.swatchHex}
                                  />
                                ))}
                                {p.variants.length > 6 && (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    +{p.variants.length - 6}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Catégorie du produit à l'extrême droite (Cliquable pour ouvrir la boîte de dialogue des catégories) */}
                        <div className="hidden sm:flex items-center shrink-0 mr-1 sm:mr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryChangingProduct(p);
                            }}
                            title="Cliquer pour changer la catégorie de ce produit"
                            className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 text-xs font-semibold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 group"
                          >
                            <span>{p.categoryLabel || 'Général'}</span>
                            <ChevronDown className="w-3 h-3 text-blue-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
                          </button>
                        </div>

                        {/* Boutons d'action compacts */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Bouton Gestion des Couleurs (icône Palette sans texte) */}
                          <button
                            type="button"
                            onClick={() => setColorManagingProduct(p)}
                            title="Gérer les couleurs du produit"
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Palette className="w-4 h-4 text-amber-600" />
                          </button>

                          {/* Bouton Dupliquer */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(p)}
                            title="Dupliquer le produit"
                            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Copy className="w-4 h-4 text-slate-600" />
                          </button>

                          {/* Bouton Modifier */}
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            title="Modifier le produit"
                            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Bouton Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Supprimer le produit"
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

              {/* MODAL / DIALOGUE D'ÉDITION DE PRODUIT (COMPACT & ONGLETS) */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto">
                  <div className="glass w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80">
                    {/* Header compact */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="font-display text-base font-bold text-slate-950 leading-tight">
                            {products.some((item) => item.id === editingProduct.id)
                              ? 'Modifier le Produit'
                              : 'Créer un Nouveau Produit'}
                          </h2>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {editingProduct.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {products.some((item) => item.id === editingProduct.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(editingProduct.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Formulaire simplifié à 5 éléments : Photo, Nom, Catégorie, Prix de vente, Détail technique */}
                    <div className="overflow-y-auto flex-1 pr-1 py-3 space-y-3.5 text-xs">
                      {/* 1. Photo */}
                      <div className="p-3.5 rounded-2xl bg-white/70 border border-white/90 space-y-2">
                        <label className="block font-bold text-slate-800 text-xs">
                          1. Photo du produit
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-inner">
                            {editingProduct.imageUrl ? (
                              <img
                                src={editingProduct.imageUrl}
                                alt={editingProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    '/src/assets/images/product_linen_notebook_1791981763268.jpg';
                                }}
                              />
                            ) : (
                              <Image className="w-7 h-7 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition-all shadow-xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{editingProduct.imageUrl ? 'Remplacer la photo' : 'Téléverser photo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProductImageFileUpload}
                              />
                            </label>
                            <input
                              type="text"
                              value={editingProduct.imageUrl}
                              onChange={(e) =>
                                setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 font-mono"
                              placeholder="Ou lien URL de l'image..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Nom & 3. Catégorie & 4. Prix de vente */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/70 border border-white/90">
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-800 mb-1 text-xs">
                            2. Nom du produit *
                          </label>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, name: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Tasse Grès Céramique & Écrin Embossé"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1 text-xs">
                            3. Catégorie *
                          </label>
                          <select
                            value={editingProduct.category}
                            onChange={(e) => {
                              const cat = e.target.value;
                              const catObj = categories.find((c) => c.id === cat);
                              setEditingProduct({
                                ...editingProduct,
                                category: cat,
                                categoryLabel: catObj ? catObj.label : 'Général',
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1 text-xs">
                            4. Prix de vente (Ar) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={editingProduct.sellingPrice ?? editingProduct.basePrice ?? 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditingProduct({
                                ...editingProduct,
                                sellingPrice: val,
                                basePrice: val,
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono-tabular font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 6800"
                            required
                          />
                        </div>
                      </div>

                      {/* 5. Détail technique */}
                      <div className="p-3.5 rounded-2xl bg-white/70 border border-white/90 space-y-1">
                        <label className="block font-bold text-slate-800 text-xs">
                          5. Détail technique *
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Précisez les matières, dimensions, surface de marquage et finitions.
                        </p>
                        <textarea
                          rows={3}
                          value={editingProduct.technicalDetail || editingProduct.shortDescription || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              technicalDetail: e.target.value,
                              shortDescription: e.target.value,
                              fullDescription: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                          placeholder="Ex: Grès minéral tourné cuit grand feu (310 ml). Coffret tiroir Fedrigoni avec gaufrage en creux."
                          required
                        />
                      </div>
                    </div>

                    {/* Footer compact */}
                    <div className="pt-3 border-t border-slate-900/10 flex items-center justify-between gap-2 shrink-0 mt-2">
                      <div>
                        {products.some((item) => item.id === editingProduct.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(editingProduct.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer le produit</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <LiquidGlassButton
                          size="sm"
                          variant="glass"
                          onClick={() => setEditingProduct(null)}
                        >
                          <span>Annuler</span>
                        </LiquidGlassButton>
                        <LiquidGlassButton
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveProduct(editingProduct)}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Enregistrer</span>
                        </LiquidGlassButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOÎTE DE DIALOGUE / MODAL D'AVERTISSEMENT POUR SUPPRESSION */}
              {deletingProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
                  <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl border border-red-500/20 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-base font-bold text-slate-950">
                        Avertissement de Suppression
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Voulez-vous vraiment supprimer le produit{' '}
                        <strong className="text-slate-900 font-bold">« {deletingProduct.name} »</strong> (Réf: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">{deletingProduct.id}</code>) ?
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-left flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-800 leading-tight">
                        <strong>Action irréversible :</strong> Ce produit sera définitivement supprimé de votre catalogue d'impression et ne sera plus disponible pour les commandes.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(null)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={confirmDeleteProduct}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Oui, Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BOÎTE DE DIALOGUE / MODAL DE GESTION DES COULEURS DU PRODUIT */}
              {colorManagingProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in overflow-y-auto">
                  <div className="glass w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80 space-y-4">
                    {/* Header compact */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-900/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          <img
                            src={colorManagingProduct.imageUrl || undefined}
                            alt={colorManagingProduct.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/src/assets/images/product_linen_notebook_1791981763268.jpg';
                            }}
                          />
                        </div>
                        <div>
                          <h2 className="font-display text-base font-bold text-slate-950 leading-tight">
                            Gestion des Couleurs
                          </h2>
                          <p className="text-xs text-slate-600 truncate max-w-[200px] font-medium">
                            {colorManagingProduct.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setColorManagingProduct(null)}
                        className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Palette de ronds de couleur sans texte */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Palette des couleurs ({(colorManagingProduct.variants || []).length})
                      </label>

                      {(colorManagingProduct.variants || []).length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-100/70 text-center text-xs text-slate-500 font-medium">
                          Aucune couleur associée. Choisissez une couleur ci-dessous.
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-white/70 border border-white/90 flex flex-wrap items-center gap-3">
                          {(colorManagingProduct.variants || []).map((v, idx) => (
                            <div key={v.id || idx} className="relative group/swatch flex flex-col items-center">
                              {/* Rond de couleur sans texte */}
                              <div
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white shadow-md ring-2 ring-slate-200/90 transition-transform group-hover/swatch:scale-110 cursor-pointer"
                                style={{ backgroundColor: v.swatchHex }}
                                title={v.name || v.swatchHex}
                              />
                              {/* Bouton suppression de couleur */}
                              <button
                                type="button"
                                onClick={() => handleRemoveColorFromProduct(v.id)}
                                title="Supprimer cette couleur"
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover/swatch:opacity-100 hover:scale-110 transition-all shadow-md cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Formulaire d'ajout de couleur */}
                    <div className="space-y-2 pt-2 border-t border-slate-900/10">
                      <label className="block text-xs font-bold text-slate-800">
                        Ajouter une couleur
                      </label>

                      {/* Palette rapide de ronds sans texte */}
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        {[
                          { name: 'Noir', hex: '#000000' },
                          { name: 'Blanc', hex: '#FFFFFF' },
                          { name: 'Rouge', hex: '#DC2626' },
                          { name: 'Bleu', hex: '#2563EB' },
                          { name: 'Vert', hex: '#16A34A' },
                          { name: 'Jaune', hex: '#EAB308' },
                          { name: 'Orange', hex: '#FF9D00' },
                          { name: 'Violet', hex: '#9333EA' },
                          { name: 'Rose', hex: '#EC4899' },
                          { name: 'Marron', hex: '#78350F' },
                          { name: 'Gris', hex: '#6B7280' },
                        ].map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => handleAddColorToProduct(preset.hex, preset.name)}
                            title={`Ajouter ${preset.name} (${preset.hex})`}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-2xs ring-1 ring-slate-300 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                            style={{ backgroundColor: preset.hex }}
                          />
                        ))}
                      </div>

                      {/* Choisir une couleur personnalisée */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColorHexInput}
                          onChange={(e) => setCustomColorHexInput(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer shrink-0"
                          title="Sélectionner une couleur"
                        />
                        <input
                          type="text"
                          value={customColorHexInput}
                          onChange={(e) => setCustomColorHexInput(e.target.value)}
                          placeholder="#FF9D00"
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono w-28 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddColorToProduct(customColorHexInput)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer / Enregistrer */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-900/10">
                      <button
                        type="button"
                        onClick={() => setColorManagingProduct(null)}
                        className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProductColors}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BOÎTE DE DIALOGUE / MODAL DE CHANGEMENT RAPIDE DE CATÉGORIE */}
              {categoryChangingProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in overflow-y-auto">
                  <div className="glass w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-900/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-display text-base font-bold text-slate-950 leading-tight">
                            Changer la Catégorie
                          </h2>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                            {categoryChangingProduct.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCategoryChangingProduct(null)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                      {categories.map((cat) => {
                        const isCurrent = categoryChangingProduct.category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleQuickChangeProductCategory(categoryChangingProduct, cat)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border group ${
                              isCurrent
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                                : 'bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:border-blue-200 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <span className={`p-1.5 rounded-lg ${isCurrent ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                                <Folder className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                              </span>
                              <div>
                                <p className="text-xs font-bold leading-tight">{cat.label}</p>
                                <p className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>{cat.subtitle}</p>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCategoryChangingProduct(null)}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* PAGE : PERSONNALISATION DU SITE (THÈME & FOND ET TEXTES & CARTES) */}
          {activePage === 'customization' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900/10">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                    Personnalisation du Site
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Gérez les couleurs, l'image de fond et tous les textes & cartes d'engagement.
                  </p>
                </div>
              </div>

              {/* Sous-onglets de Personnalisation Site */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 border border-white/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCustomizationTab('theme')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    customizationTab === 'theme'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Thème & Fond</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizationTab('content')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    customizationTab === 'content'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Textes & Cartes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizationTab('events')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    customizationTab === 'events'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Sections Événements</span>
                </button>
              </div>

              {customizationTab === 'content' && (
                <form onSubmit={handleSaveSiteContent} className="space-y-8">
                  {/* Entête de la section Contenus */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-900/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-600/15 border border-blue-600/30 text-blue-800 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg sm:text-xl font-bold text-slate-950 truncate">
                          Textes & Cartes du Site
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                          Modifiez les titres, le simulateur de finitions et gérez les cartes d'engagement affichées sur le site.
                        </p>
                      </div>
                    </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                  <LiquidGlassButton
                    size="sm"
                    variant="glass"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Réinitialiser tous les textes aux contenus standard My PRINT ?')) {
                        setSiteContent(DEFAULT_SITE_CONTENT);
                        saveSiteContent(DEFAULT_SITE_CONTENT);
                        setContentSaveSuccess('Textes réinitialisés au contenu standard.');
                        setTimeout(() => setContentSaveSuccess(null), 3000);
                      }
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </LiquidGlassButton>

                  <LiquidGlassButton variant="primary" size="md" type="submit">
                    <Check className="w-4 h-4" />
                    <span>Enregistrer dans Firestore</span>
                  </LiquidGlassButton>
                </div>
              </div>

              {contentSaveSuccess && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{contentSaveSuccess}</span>
                </div>
              )}

              {/* BARRE DE BOUTONS D'ACCÈS RAPIDE AUX DIFFÉRENTES CARTES ET SECTIONS */}
              <div className="glass p-2.5 sm:p-3.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-white/70 border border-white">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1.5 shrink-0">
                    Accès rapide :
                  </span>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('all')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Toutes les cartes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('hero')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'hero'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Titre & Description</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('image')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'image'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Image & Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('simulators')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'simulators'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Finitions ({siteContent.heroFinishSimulators.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('guarantees')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'guarantees'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Garanties ({siteContent.guaranteeCards.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentSubTab('delivery')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      contentSubTab === 'delivery'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Grille de livraison ({(siteContent.deliveryTiers || DEFAULT_DELIVERY_TIERS).length})</span>
                  </button>
                </div>

                {/* Boutons d'action rapide d'ajout */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-900/10 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('guarantees');
                      handleAddGuaranteeCard();
                    }}
                    className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-[0.98] shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Carte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('simulators');
                      handleAddSimulatorItem();
                    }}
                    className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-[0.98] shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Finition</span>
                  </button>
                </div>
              </div>

              {/* 1. TEXTES PRINCIPAUX DU HERO (GRAND TITRE & DESCRIPTION) */}
              {(contentSubTab === 'all' || contentSubTab === 'hero') && (
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-700" />
                    <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                      1. Textes Principaux de la Bannière (Hero)
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="hero-heading-input"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Grand Titre de Page (Heading principal)
                      </label>
                      <textarea
                        id="hero-heading-input"
                        rows={2}
                        value={siteContent.heroHeading}
                        onChange={(e) =>
                          setSiteContent((prev) => ({ ...prev, heroHeading: e.target.value }))
                        }
                        placeholder="La matière minérale sublimée par votre empreinte..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white/90 text-sm font-display font-semibold text-slate-950 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="hero-desc-input"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Description Principale
                      </label>
                      <textarea
                        id="hero-desc-input"
                        rows={3}
                        value={siteContent.heroDescription}
                        onChange={(e) =>
                          setSiteContent((prev) => ({ ...prev, heroDescription: e.target.value }))
                        }
                        placeholder="Concevez chez My PRINT vos objets d’édition..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white/90 text-xs sm:text-sm text-slate-900 focus:bg-white leading-relaxed"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="hero-tagline-input"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Slogan / Badge Supérieur
                      </label>
                      <input
                        id="hero-tagline-input"
                        type="text"
                        value={siteContent.heroTagline}
                        onChange={(e) =>
                          setSiteContent((prev) => ({ ...prev, heroTagline: e.target.value }))
                        }
                        placeholder="My PRINT · Imprimerie de Goodies Personnalisés..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white/90 text-xs text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. IMAGE D'ACCUEIL & MODE D'AFFICHAGE HERO */}
              {(contentSubTab === 'all' || contentSubTab === 'image') && (
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-6 bg-white/80 border border-white">
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-900/10">
                    <div className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-700" />
                      <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                        Image & Disposition de la Bannière d'Accueil
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {siteContent.heroImageMode === 'full' ? 'Pleine Écran Active' : 'Mode Petit Format Active'}
                    </span>
                  </div>

                  {/* Choix du mode d'affichage (Pleine écran vs Petit format) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Mode d'Affichage de l'Image d'Accueil
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Option 1 : Image Pleine Écran */}
                      <button
                        type="button"
                        onClick={() => setSiteContent((prev) => ({ ...prev, heroImageMode: 'full' }))}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                          siteContent.heroImageMode === 'full'
                            ? 'bg-blue-600/10 border-blue-600 ring-2 ring-blue-600/30 text-slate-950 shadow-sm'
                            : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${siteContent.heroImageMode === 'full' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          <Maximize2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display text-sm font-bold text-slate-950">Image Pleine Écran</span>
                            {siteContent.heroImageMode === 'full' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">Actif</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            L'image occupe tout le fond de la bannière. Le texte est disposé par-dessus un calque en verre liquide protecteur.
                          </p>
                        </div>
                      </button>

                      {/* Option 2 : Mode Petit Format (Côté à côté) */}
                      <button
                        type="button"
                        onClick={() => setSiteContent((prev) => ({ ...prev, heroImageMode: 'split' }))}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                          siteContent.heroImageMode !== 'full'
                            ? 'bg-blue-600/10 border-blue-600 ring-2 ring-blue-600/30 text-slate-950 shadow-sm'
                            : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${siteContent.heroImageMode !== 'full' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          <Layout className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display text-sm font-bold text-slate-950">Format Petit / Côté à Côté</span>
                            {siteContent.heroImageMode !== 'full' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">Actif</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            L'image est encadrée dans une carte visuelle dédiée sur la droite, à côté de la colonne de texte.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Téléversement & URL d'image */}
                  <div className="space-y-4 pt-2 border-t border-slate-900/10">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Changer l'Image d'Accueil
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      {/* Bouton de Téléversement de fichier */}
                      <div className="relative">
                        <input
                          type="file"
                          id="hero-file-upload"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="hero-file-upload"
                          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-dashed border-blue-600/40 bg-blue-50/50 hover:bg-blue-50/80 transition-all cursor-pointer text-blue-900 font-semibold text-xs text-center"
                        >
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Téléverser une image (depuis votre appareil)</span>
                        </label>
                      </div>

                      {/* URL externe ou base64 */}
                      <div>
                        <input
                          type="text"
                          value={siteContent.heroImage || ''}
                          onChange={(e) => setSiteContent((prev) => ({ ...prev, heroImage: e.target.value }))}
                          placeholder="Ou collez un lien URL d'image externe (https://...)"
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600/30"
                        />
                      </div>
                    </div>

                    {/* Sélection rapide parmi les visuels studio My PRINT */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        Visuels prédéfinis de l'atelier My PRINT :
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PRESET_HERO_IMAGES.map((preset) => {
                          const isSelected = (siteContent.heroImage || DEFAULT_SITE_CONTENT.heroImage) === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setSiteContent((prev) => ({ ...prev, heroImage: preset.url }))}
                              className={`relative rounded-xl overflow-hidden border text-left p-1.5 transition-all cursor-pointer group ${
                                isSelected
                                  ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50'
                                  : 'border-slate-200 hover:border-slate-400 bg-white'
                              }`}
                            >
                              <div className="aspect-video w-full rounded-lg overflow-hidden mb-1.5 bg-slate-100 relative">
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <p className="text-[11px] font-semibold text-slate-900 truncate px-1">{preset.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aperçu direct & Réinitialisation */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-200">
                          <img
                            src={siteContent.heroImage || DEFAULT_SITE_CONTENT.heroImage}
                            alt="Aperçu image accueil"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Aperçu de l'image sélectionnée</p>
                          <p className="text-[11px] text-slate-500">
                            Format : {siteContent.heroImageMode === 'full' ? 'Pleine Écran (Background)' : 'Petit Format (Côté à côté)'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSiteContent((prev) => ({
                          ...prev,
                          heroImage: DEFAULT_SITE_CONTENT.heroImage,
                          heroImageMode: DEFAULT_SITE_CONTENT.heroImageMode,
                        }))}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rétablir l'image initiale</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. GESTION DU SIMULATEUR DE FINITIONS (BOUTONS & DESCRIPTIONS) */}
              {(contentSubTab === 'all' || contentSubTab === 'simulators') && (
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                        2. Simulateur de Finitions (Hero)
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Configurez les boutons interactifs de finitions d'impression affichés dans la bannière.
                      </p>
                    </div>

                    <LiquidGlassButton
                      size="sm"
                      variant="glass"
                      type="button"
                      onClick={handleAddSimulatorItem}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une finition</span>
                    </LiquidGlassButton>
                  </div>

                  <div className="space-y-3">
                    {siteContent.heroFinishSimulators.map((sim, index) => (
                      <div
                        key={sim.id}
                        className="p-4 rounded-2xl bg-white/55 border border-white/85 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-blue-900 font-mono-tabular">
                            Finition #{index + 1}
                          </span>

                          {siteContent.heroFinishSimulators.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSimulatorItem(sim.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Supprimer cette finition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Intitulé du bouton
                            </label>
                            <input
                              type="text"
                              value={sim.label}
                              onChange={(e) =>
                                handleUpdateSimulatorItem(sim.id, { label: e.target.value })
                              }
                              placeholder="Ex: Laser 360°"
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium"
                              required
                            />
                          </div>

                          <div className="sm:col-span-8">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Description de la finition au survol / clic
                            </label>
                            <input
                              type="text"
                              value={sim.description}
                              onChange={(e) =>
                                handleUpdateSimulatorItem(sim.id, { description: e.target.value })
                              }
                              placeholder="Ex: Gravure Laser 360° — Creusement micrométrique..."
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. GESTION DES CARTES D'ENGAGEMENTS & GARANTIES (L'AJOUT DE NOUVELLE CARTE PERMIS) */}
              {(contentSubTab === 'all' || contentSubTab === 'guarantees') && (
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                        3. Cartes d'Engagements & Garanties
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Gérez les cartes affichées sous le Hero (ex: BAT Numérique en 4h). Vous pouvez modifier, ajouter de nouvelles cartes ou en supprimer.
                      </p>
                    </div>

                    <LiquidGlassButton
                      size="sm"
                      variant="primary"
                      type="button"
                      onClick={handleAddGuaranteeCard}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une carte</span>
                    </LiquidGlassButton>
                  </div>

                  {/* Badges de saut rapide vers chaque carte spécifique */}
                  {siteContent.guaranteeCards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-white/40 border border-white/80">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                        Cartes existantes :
                      </span>
                      {siteContent.guaranteeCards.map((card, idx) => (
                        <a
                          key={card.id}
                          href={`#card-${card.id}`}
                          className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[11px] font-semibold text-slate-800 border border-white/90 shadow-2xs transition-all flex items-center gap-1"
                        >
                          <span className="text-blue-700 font-mono-tabular">#{idx + 1}</span>
                          <span className="truncate max-w-[140px]">{card.title || 'Sans titre'}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {siteContent.guaranteeCards.map((card, index) => (
                      <div
                        id={`card-${card.id}`}
                        key={card.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white/60 border border-white/90 space-y-2.5 sm:space-y-3 relative transition-all hover:bg-white/80 hover:shadow-xs"
                      >
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[11px] sm:text-xs font-bold text-blue-900 font-mono-tabular bg-blue-600/10 px-2 py-0.5 rounded-md shrink-0">
                              #{index + 1}
                            </span>
                            <select
                              value={card.iconName}
                              onChange={(e) =>
                                handleUpdateGuaranteeCard(card.id, {
                                  iconName: e.target.value as GuaranteeCardItem['iconName'],
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900 cursor-pointer min-w-0 max-w-full truncate"
                            >
                              <option value="Layers">Layers (Calques / BAT)</option>
                              <option value="ShieldCheck">ShieldCheck (Sécurité)</option>
                              <option value="Clock">Clock (Délais)</option>
                              <option value="Sparkles">Sparkles (Tarifs)</option>
                              <option value="Truck">Truck (Livraison)</option>
                              <option value="Package">Package (Écrins)</option>
                              <option value="Award">Award (Qualité)</option>
                            </select>
                          </div>

                          {siteContent.guaranteeCards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGuaranteeCard(card.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-auto"
                              title="Supprimer cette carte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Titre de la carte
                          </label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              handleUpdateGuaranteeCard(card.id, { title: e.target.value })
                            }
                            placeholder="Ex: BAT Numérique en 4h"
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-950"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Détail / Explication
                          </label>
                          <textarea
                            rows={2}
                            value={card.detail}
                            onChange={(e) =>
                              handleUpdateGuaranteeCard(card.id, { detail: e.target.value })
                            }
                            placeholder="Ex: Vérification vectorielle et simulation 3D..."
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. GESTION DE LA GRILLE DES FRAIS DE LIVRAISON VARIABLE (AUTOMATIQUE) */}
              {(contentSubTab === 'all' || contentSubTab === 'delivery') && (
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>4. Grille des Frais de Livraison Variable</span>
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Configurez les paliers de montant total de commande et leurs frais de livraison associés.
                        Ces frais s'appliquent automatiquement lorsque le client active l'interrupteur « Se faire livrer » dans son panier.
                      </p>
                    </div>

                    <LiquidGlassButton
                      size="sm"
                      variant="primary"
                      type="button"
                      onClick={handleAddDeliveryTier}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un palier</span>
                    </LiquidGlassButton>
                  </div>

                  <div className="space-y-3">
                    {(siteContent.deliveryTiers || DEFAULT_DELIVERY_TIERS).map((tier, index) => (
                      <div
                        key={tier.id}
                        className="p-4 rounded-2xl bg-white/60 border border-white/90 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-blue-900 font-mono-tabular">
                            Palier #{index + 1} : {formatFullAriary(tier.minAmount)} à {tier.maxAmount >= 99999999 ? 'Plus' : formatFullAriary(tier.maxAmount)}
                          </span>

                          {(siteContent.deliveryTiers || DEFAULT_DELIVERY_TIERS).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliveryTier(tier.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Supprimer ce palier de livraison"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Montant Min (Ar)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={tier.minAmount}
                              onChange={(e) =>
                                handleUpdateDeliveryTier(tier.id, { minAmount: Number(e.target.value) })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono-tabular font-bold text-slate-900"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Montant Max (Ar)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={tier.maxAmount}
                              onChange={(e) =>
                                handleUpdateDeliveryTier(tier.id, { maxAmount: Number(e.target.value) })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono-tabular font-bold text-slate-900"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Frais de Livraison (Ar)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={tier.fee}
                              onChange={(e) =>
                                handleUpdateDeliveryTier(tier.id, { fee: Number(e.target.value) })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono-tabular font-bold text-blue-900"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton de soumission principal */}
              <div className="flex justify-end pt-2">
                <LiquidGlassButton variant="primary" size="lg" type="submit" className="w-full sm:w-auto">
                  <Check className="w-4 h-4" />
                  <span>Enregistrer tous les textes & cartes dans Firestore</span>
                </LiquidGlassButton>
              </div>
            </form>
          )}

          {/* SUB-SECTION : SECTION ÉVÉNEMENT & IMAGES ÉVÉNEMENTIELLES (Carrousel 4s) */}
          {customizationTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-600/15 border border-purple-600/30 text-purple-800">
                    <Calendar className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                      Section Événement & Carrousel 4s
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Téléversez des images événementielles, définissez leur nom court et leur description. Elles s'afficheront dans le défilement de 4 secondes avec texte blanc et dégradé noir.
                    </p>
                  </div>
                </div>

                <LiquidGlassButton
                  variant="primary"
                  size="md"
                  onClick={handleAddEventSlide}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une image événementielle</span>
                </LiquidGlassButton>
              </div>

              {contentSaveSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{contentSaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveSiteContent} className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {(siteContent.eventSlides || DEFAULT_EVENT_SLIDES).map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="glass p-3 rounded-2xl border border-white/90 space-y-2.5 shadow-2xs transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedSlideDetails(prev => ({ ...prev, [slide.id]: !prev[slide.id] }))}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              expandedSlideDetails[slide.id] ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            title="Paramètres avancés (Titre & Description)"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateEventSlide(slide.id, { active: !slide.active })}
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-colors ${
                              slide.active !== false
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {slide.active !== false ? '● Actif' : '○ Masqué'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveEventSlide(slide.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Supprimer cette diapositive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
                          <img
                            src={slide.imageUrl || undefined}
                            alt={slide.shortTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[10px] font-bold truncate drop-shadow">
                            {slide.shortTitle || `Slide ${idx + 1}`}
                          </div>
                        </div>

                        <label className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-white/80 hover:bg-white border border-slate-300 text-[11px] font-semibold text-purple-900 cursor-pointer transition-all shadow-2xs">
                          <Upload className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{slide.imageUrl ? 'Remplacer la photo' : 'Téléverser photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEventImageFileUpload(slide.id, e)}
                          />
                        </label>
                      </div>

                      {expandedSlideDetails[slide.id] && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60 animate-fadeIn">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                              Titre court *
                            </label>
                            <input
                              type="text"
                              value={slide.shortTitle}
                              onChange={(e) => handleUpdateEventSlide(slide.id, { shortTitle: e.target.value })}
                              placeholder="Titre de l'événement"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-950 focus:ring-1 focus:ring-purple-600/30"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                              Description *
                            </label>
                            <textarea
                              rows={2}
                              value={slide.description}
                              onChange={(e) => handleUpdateEventSlide(slide.id, { description: e.target.value })}
                              placeholder="Description courte..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-900 focus:ring-1 focus:ring-purple-600/30 resize-none"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-900/10">
                  <LiquidGlassButton
                    type="submit"
                    variant="primary"
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les sections événements</span>
                  </LiquidGlassButton>
                </div>
              </form>
            </div>
          )}

          {/* SUB-SECTION : GESTION DU THÈME & FOND DE COULEUR */}
          {customizationTab === 'theme' && (
            <div className="space-y-8">
              {/* Entête de la section Thème */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-600/30 text-blue-800">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                      Thème & Fond de Couleur du Site
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Personnalisez l'ambiance visuelle du site My PRINT avec des couleurs prédéfinies ou un sélecteur libre.
                    </p>
                  </div>
                </div>

                <LiquidGlassButton size="sm" variant="glass" onClick={handleResetDefaultTheme}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rétablir le thème standard</span>
                </LiquidGlassButton>
              </div>

              {themeSaveSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{themeSaveSuccess}</span>
                </div>
              )}

              {/* 1. PALETTES MINÉRALES PRÉDÉFINIES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                      1. Palettes et Couleurs Prédéfinies
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Harmonies douces spécialement calibrées pour sublimer la translucidité Liquid Glass.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular text-slate-500">
                    {THEME_PRESETS.length} harmonies
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const isActive =
                      siteTheme.mode === 'preset' && siteTheme.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPresetTheme(preset)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'bg-white/85 border-blue-600 ring-2 ring-blue-600/25 shadow-md scale-[1.02]'
                            : 'bg-white/45 border-white/80 hover:bg-white/70 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-6 h-6 rounded-full border border-black/15 shadow-xs shrink-0"
                                style={{ backgroundColor: preset.baseColor }}
                              />
                              <span className="font-display text-sm font-semibold text-slate-950">
                                {preset.name}
                              </span>
                            </div>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">
                                <Check className="w-3 h-3" />
                                <span>Actif</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {preset.subtitle}
                          </p>
                        </div>

                        {/* Échantillon visuel de réfraction */}
                        <div
                          className="h-10 rounded-2xl p-2 flex items-center justify-between overflow-hidden border border-black/5"
                          style={{
                            background: `linear-gradient(135deg, ${preset.gradientFrom} 0%, ${preset.gradientVia} 50%, ${preset.gradientTo} 100%)`,
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full blur-[1px] opacity-80"
                              style={{ backgroundColor: preset.accentOrb1 }}
                            />
                            <span
                              className="w-4 h-4 rounded-full blur-[1px] opacity-80"
                              style={{ backgroundColor: preset.accentOrb2 }}
                            />
                            <span
                              className="w-4 h-4 rounded-full blur-[1px] opacity-80"
                              style={{ backgroundColor: preset.accentOrb3 }}
                            />
                          </div>
                          <span className="font-mono-tabular text-[11px] font-medium text-slate-700 bg-white/60 px-2 py-0.5 rounded-md">
                            {preset.baseColor}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SÉLECTEUR AVANCÉ DE COULEUR (SUR MESURE) */}
              <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                      2. Sélecteur Avancé de Couleur (Sur-Mesure)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600">
                    Définissez précisément n'importe quelle nuance hexadécimale. Le moteur graphique recalcule instantanément le fond et la réfraction.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Pipette & saisie Hexadécimale */}
                  <div className="md:col-span-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Pipette interactive & Code HEX
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Input couleur interactif natif */}
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xs shrink-0 cursor-pointer">
                          <input
                            type="color"
                            value={
                              /^#[0-9A-Fa-f]{6}$/.test(customHexInput)
                                ? customHexInput
                                : siteTheme.baseColor
                            }
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setCustomHexInput(val);
                              handleApplyCustomColor(val);
                            }}
                            className="absolute -inset-4 w-20 h-20 cursor-pointer"
                            aria-label="Choisir la couleur de fond via la palette"
                          />
                        </div>

                        {/* Champ texte direct HEX */}
                        <div className="flex-1">
                          <input
                            type="text"
                            maxLength={7}
                            value={customHexInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomHexInput(val);
                              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                handleApplyCustomColor(val);
                              }
                            }}
                            placeholder="#F4F2ED"
                            className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white/90 text-sm font-mono-tabular font-semibold tracking-wider text-slate-950 focus:bg-white"
                          />
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Format standard : 6 caractères (ex : #EFE8DC, #E9F1F7)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nuances minérales rapides à portée de clic */}
                    <div>
                      <span className="block text-xs font-medium text-slate-600 mb-2">
                        Nuances minérales recommandées :
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { name: 'Ivoire Naturel', hex: '#F4F2ED' },
                          { name: 'Sable Lin', hex: '#EFE8DC' },
                          { name: 'Azur Glacier', hex: '#EBF1F7' },
                          { name: 'Céladon Doux', hex: '#EBF0E9' },
                          { name: 'Craie Pure', hex: '#ECEEF2' },
                          { name: 'Rosée Quartz', hex: '#F7EFF1' },
                          { name: 'Blanc Céramique', hex: '#F9F8F6' },
                          { name: 'Fumée Minérale', hex: '#E6E8EB' },
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => {
                              setCustomHexInput(swatch.hex);
                              handleApplyCustomColor(swatch.hex);
                            }}
                            title={`${swatch.name} (${swatch.hex})`}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono-tabular flex items-center gap-1.5 border transition-all cursor-pointer ${
                              siteTheme.baseColor.toUpperCase() === swatch.hex.toUpperCase()
                                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                                : 'bg-white/60 text-slate-700 border-white/80 hover:bg-white'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <span>{swatch.hex}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Aperçu en Direct du rendu Liquid Glass */}
                  <div className="md:col-span-6">
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Aperçu en direct du rendu Liquid Glass
                    </span>
                    <div
                      className="p-5 rounded-3xl border border-white shadow-inner relative overflow-hidden transition-colors duration-300"
                      style={{ backgroundColor: siteTheme.baseColor }}
                    >
                      {/* Halos de réfraction simulés */}
                      <div
                        className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-[25px] opacity-70 pointer-events-none"
                        style={{ backgroundColor: siteTheme.accentOrb1 }}
                      />
                      <div
                        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[25px] opacity-70 pointer-events-none"
                        style={{ backgroundColor: siteTheme.accentOrb2 }}
                      />

                      {/* Carte Liquid Glass de démonstration */}
                      <div className="glass p-4 rounded-2xl relative z-10 border border-white/85">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                            My PRINT · Démonstration
                          </span>
                          <span className="font-mono-tabular text-xs font-bold text-slate-950">
                            1,6K Ar
                          </span>
                        </div>
                        <p className="font-display text-sm font-semibold text-slate-950 mb-1">
                          Roller Architectural Gravé
                        </p>
                        <p className="text-xs text-slate-600 leading-snug mb-3">
                          La transparence et la lisibilité sont préservées sur cette teinte.
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900/10">
                          <span className="text-[11px] font-medium text-slate-500">
                            Fond : {siteTheme.baseColor}
                          </span>
                          <LiquidGlassButton size="sm" variant="primary">
                            <span>Bouton test</span>
                          </LiquidGlassButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PERSONNALISATION D'IMAGE DE FOND DE L'ACCUEIL & FILTRES CSS DYNAMIQUES */}
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Image className="w-5 h-5 text-blue-700" />
                        <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950">
                          3. Image de Fond du Site & Filtres d'Effets Visuels
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600">
                        Choix parmi les thèmes d'événements pré-définis (Fête Nationale Malgache 26 Juin, Noël, Nouvel An, Pâques...) ou téléversement d'image personnelle / URL directe, avec ajustement par glissement et saisie numérique.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {siteTheme.bgImageUrl && (
                        <LiquidGlassButton
                          size="sm"
                          variant="glass"
                          type="button"
                          onClick={handleClearBgImage}
                          className="!text-red-700 hover:!text-red-900 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Retirer l'image de fond</span>
                        </LiquidGlassButton>
                      )}
                    </div>
                  </div>

                  {/* APERÇU LIVE EN TEMPS RÉEL DU RENDU VISUEL ET DE LA TRANSPARENCE DU VERRE */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 min-h-[190px] flex items-center justify-center p-4">
                    {siteTheme.bgImageUrl ? (
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={siteTheme.bgImageUrl}
                          alt="Aperçu image de fond"
                          className="w-full h-full object-cover transition-all duration-200 select-none pointer-events-none"
                          style={{
                            filter: `blur(${siteTheme.bgBlur ?? 0}px) brightness(${siteTheme.bgBrightness ?? 100}%) contrast(${siteTheme.bgContrast ?? 100}%) saturate(${siteTheme.bgSaturate ?? 100}%)`,
                            opacity: (siteTheme.bgOpacity ?? 80) / 100,
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs"
                        style={{
                          background: `linear-gradient(to bottom, ${siteTheme.gradientFrom} 0%, ${siteTheme.gradientVia} 50%, ${siteTheme.gradientTo} 100%)`,
                        }}
                      >
                        <span>Fond standard sans image (dégradé uni actif)</span>
                      </div>
                    )}

                    {/* Carte échantillon Liquid Glass superposée pour tester la transparence et la lisibilité */}
                    <div className="relative z-10 glass backdrop-blur-xl bg-white/70 border border-white/90 p-4 sm:p-5 rounded-2xl shadow-xl max-w-md w-full text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-900">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Aperçu en Direct · Réfraction du Verre Liquide</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        Ce bloc teste la lisibilité du texte et la transparence du verre au-dessus de l'image de fond configurée.
                      </p>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 text-[10px] font-mono font-semibold">
                          Flou: {siteTheme.bgBlur ?? 0}px
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 text-[10px] font-mono font-semibold">
                          Opacité: {siteTheme.bgOpacity ?? 80}%
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 text-[10px] font-mono font-semibold">
                          Luminosité: {siteTheme.bgBrightness ?? 100}%
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 text-[10px] font-mono font-semibold">
                          Contraste: {siteTheme.bgContrast ?? 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* A. THÈMES ÉVÉNEMENTIELS PRÉDÉFINIS (AVEC CLIP-ARTS ABSTRAITS) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Images événementielles pré-définies (Clip-arts abstraits) :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {EVENT_PRESET_BACKGROUNDS.map((event) => {
                        const isSelected = siteTheme.bgImageUrl === event.imageUrl;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => handleSelectBgImage(event.imageUrl, event.defaultFilters)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 overflow-hidden relative ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                                : 'bg-white/60 hover:bg-white border-slate-200'
                            }`}
                          >
                            <div className="h-20 w-full rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200/80">
                              <img
                                src={event.imageUrl || undefined}
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                              <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${event.badgeColor}`}>
                                {event.eventLabel}
                              </span>
                              {isSelected && (
                                <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" /> Actif
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="block font-bold text-xs text-slate-950 truncate">
                                {event.name}
                              </span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">
                                {event.subtitle}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* B. TÉLÉVERSEMENT OU URL D'IMAGE PERSONNALISÉE */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/70 border border-slate-200/90 space-y-4">
                    <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Ou Utiliser une image personnalisée :
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1 : Téléversement de fichier */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                          1. Téléverser depuis votre appareil :
                        </span>
                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white/80 cursor-pointer text-xs font-semibold text-blue-900 transition-all shadow-2xs">
                          <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Parcourir une image (JPG, PNG, WEBP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBgFileUpload}
                          />
                        </label>
                      </div>

                      {/* Option 2 : URL d'image externe */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                          2. Ou coller un lien URL d'image directe :
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={customBgUrlInput}
                            onChange={(e) => setCustomBgUrlInput(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                          />
                          <LiquidGlassButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleApplyCustomBgUrl}
                            disabled={!customBgUrlInput.trim()}
                          >
                            <span>Appliquer</span>
                          </LiquidGlassButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* C. PRÉRÉGLAGES RAPIDES DE FILTRES EN 1 CLIC */}
                  <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Préréglages d'Effets Visuels en 1 clic :</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyFilterPreset({
                            blur: 1,
                            opacity: 75,
                            brightness: 100,
                            contrast: 105,
                            saturate: 105,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:text-blue-800 shadow-2xs transition-all cursor-pointer"
                      >
                        ⚖️ Équilibré (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyFilterPreset({
                            blur: 2,
                            opacity: 50,
                            brightness: 105,
                            contrast: 95,
                            saturate: 100,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:text-blue-800 shadow-2xs transition-all cursor-pointer"
                      >
                        🌸 Subtil & Doux
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyFilterPreset({
                            blur: 0,
                            opacity: 90,
                            brightness: 100,
                            contrast: 110,
                            saturate: 120,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:text-blue-800 shadow-2xs transition-all cursor-pointer"
                      >
                        ✨ Vibrant & Net
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyFilterPreset({
                            blur: 7,
                            opacity: 70,
                            brightness: 95,
                            contrast: 100,
                            saturate: 110,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:text-blue-800 shadow-2xs transition-all cursor-pointer"
                      >
                        🌫️ Flou Artistique
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyFilterPreset({
                            blur: 0,
                            opacity: 80,
                            brightness: 100,
                            contrast: 100,
                            saturate: 100,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
                      >
                        ↺ Réinitialiser par défaut
                      </button>
                    </div>
                  </div>

                  {/* D. RÉGLAGE FIN DES 5 FILTRES CSS (GLISSÉ SLIDER + SAISIE NUMÉRIQUE CHIFFRE) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Paramètres Fins des Filtres d'Image (Glissé + Saisie Chiffre)
                        </span>
                      </div>
                      {siteTheme.bgImageUrl && (
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          Image de fond active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {/* 1. Flou (Blur) */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300">Flou (Blur) :</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={siteTheme.bgBlur ?? 0}
                              onChange={(e) =>
                                handleUpdateBgFilter('bgBlur', Math.min(30, Math.max(0, Number(e.target.value))))
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-right font-mono font-bold text-blue-300 text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-400 text-[10px]">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          step={1}
                          value={siteTheme.bgBlur ?? 0}
                          onChange={(e) => handleUpdateBgFilter('bgBlur', Number(e.target.value))}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 2. Opacité / Transparence (Opacity) */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300">Transparence / Opacité :</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={siteTheme.bgOpacity ?? 80}
                              onChange={(e) =>
                                handleUpdateBgFilter('bgOpacity', Math.min(100, Math.max(0, Number(e.target.value))))
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-right font-mono font-bold text-blue-300 text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-400 text-[10px]">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={siteTheme.bgOpacity ?? 80}
                          onChange={(e) => handleUpdateBgFilter('bgOpacity', Number(e.target.value))}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 3. Luminosité (Brightness) */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300">Luminosité :</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={siteTheme.bgBrightness ?? 100}
                              onChange={(e) =>
                                handleUpdateBgFilter('bgBrightness', Math.min(200, Math.max(0, Number(e.target.value))))
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-right font-mono font-bold text-blue-300 text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-400 text-[10px]">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          step={1}
                          value={siteTheme.bgBrightness ?? 100}
                          onChange={(e) => handleUpdateBgFilter('bgBrightness', Number(e.target.value))}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 4. Contraste (Contrast) */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300">Contraste :</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={siteTheme.bgContrast ?? 100}
                              onChange={(e) =>
                                handleUpdateBgFilter('bgContrast', Math.min(200, Math.max(0, Number(e.target.value))))
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-right font-mono font-bold text-blue-300 text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-400 text-[10px]">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          step={1}
                          value={siteTheme.bgContrast ?? 100}
                          onChange={(e) => handleUpdateBgFilter('bgContrast', Number(e.target.value))}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 5. Saturation */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300">Saturation :</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={siteTheme.bgSaturate ?? 100}
                              onChange={(e) =>
                                handleUpdateBgFilter('bgSaturate', Math.min(200, Math.max(0, Number(e.target.value))))
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-right font-mono font-bold text-blue-300 text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-400 text-[10px]">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          step={1}
                          value={siteTheme.bgSaturate ?? 100}
                          onChange={(e) => handleUpdateBgFilter('bgSaturate', Number(e.target.value))}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-600">
                    Mode actuel :{' '}
                    <strong className="text-slate-900">
                      {siteTheme.mode === 'preset'
                        ? `Prédéfini (${
                            THEME_PRESETS.find((p) => p.id === siteTheme.presetId)?.name ||
                            siteTheme.presetId
                          })`
                        : `Personnalisé (${siteTheme.baseColor})`}
                    </strong>
                  </span>

                  <LiquidGlassButton
                    variant="primary"
                    size="md"
                    onClick={() => handleApplyCustomColor(customHexInput)}
                  >
                    <Check className="w-4 h-4" />
                    <span>Appliquer et synchroniser dans Firestore</span>
                  </LiquidGlassButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activePage === 'security' && (
            <div className="glass p-6 sm:p-10 rounded-3xl max-w-xl">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-900/10 mb-6">
                <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-600/30 text-blue-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    Paramétrer la Clé d'Accès
                  </h2>
                  <p className="text-xs text-slate-600">
                    Modifiez le code PIN à 6 chiffres qui protège l'accès à l'administration.
                  </p>
                </div>
              </div>

              {pinChangeSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-900 text-xs font-medium mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              {pinChangeError && (
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-300 text-red-900 text-xs font-medium mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <form onSubmit={handleSaveNewPin} className="space-y-4">
                <div>
                  <label
                    htmlFor="current-pin"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Clé d'accès actuelle (6 chiffres)
                  </label>
                  <input
                    id="current-pin"
                    type="password"
                    maxLength={6}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-white/90 text-sm font-mono-tabular tracking-widest text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-pin"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Nouvelle clé de sécurité (6 chiffres numériques)
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-white/90 text-sm font-mono-tabular tracking-widest text-slate-900 focus:bg-white"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    La clé doit être composée d'exactement 6 chiffres.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="confirm-pin"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Confirmez la nouvelle clé (6 chiffres)
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-white/90 text-sm font-mono-tabular tracking-widest text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <LiquidGlassButton
                    size="sm"
                    type="button"
                    onClick={() => {
                      setCurrentPinInput('');
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setPinChangeError(null);
                      setPinChangeSuccess(null);
                    }}
                  >
                    <span>Réinitialiser</span>
                  </LiquidGlassButton>

                  <LiquidGlassButton variant="primary" size="md" type="submit">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enregistrer la nouvelle clé</span>
                  </LiquidGlassButton>
                </div>
              </form>
            </div>
          )}

          {/* PAGE : SESSION ADMINISTRATEUR / IDENTIFIANTS & LOGO SOCIÉTÉ */}
          {activePage === 'company' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-800">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                      Session Administrateur — Identifiants de la Société
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Configurez le nom officiel, les coordonnées et téléversez l'icône / logo de votre entreprise.
                    </p>
                  </div>
                </div>
              </div>

              {companySaveSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{companySaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
                {/* 1. TÉLÉVERSEMENT DU LOGO DE LA SOCIÉTÉ */}
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>Icône / Logo de la Société</span>
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Ce logo ou cette icône s'affichera dans le menu en haut du site et dans les en-têtes.
                      </p>
                    </div>

                    {companyProfile.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setCompanyProfile((prev) => ({ ...prev, logoUrl: '' }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Retirer le logo</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                    {/* Aperçu en direct */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/70 border border-white/90 shadow-2xs space-y-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Aperçu dans le menu en haut
                      </span>
                      <div className="p-3.5 rounded-2xl bg-slate-950 text-white flex items-center justify-center min-w-[140px] min-h-[50px]">
                        {companyProfile.logoUrl ? (
                          <img
                            src={companyProfile.logoUrl}
                            alt={companyProfile.name}
                            className="h-9 max-w-[160px] object-contain"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/20 p-1 flex items-center justify-center">
                              <AppLogo className="w-full h-full text-white" />
                            </div>
                            <span className="text-xs text-slate-400 font-mono">(Icône par défaut)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone de fichier */}
                    <div className="md:col-span-7">
                      <label className="block p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/40 hover:bg-white/80 transition-all cursor-pointer text-center">
                        <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-slate-900 block">
                          Téléverser un nouveau logo ou icône
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          PNG, SVG, JPG, WEBP (Dimensions recommandées : 200x200 px ou vectoriel)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCompanyLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. COORDONNÉES ET IDENTIFIANTS DE LA SOCIÉTÉ */}
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-4">
                  <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Identifiants & Coordonnées</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom de la société / Enseigne
                      </label>
                      <input
                        type="text"
                        value={companyProfile.name}
                        onChange={(e) =>
                          setCompanyProfile((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Ex: Atelier Prisme Impression"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro de téléphone principal
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={companyProfile.phone}
                          onChange={(e) =>
                            setCompanyProfile((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="Ex: +261 34 00 000 00"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro WhatsApp direct
                      </label>
                      <div className="relative">
                        <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={companyProfile.whatsapp}
                          onChange={(e) =>
                            setCompanyProfile((prev) => ({ ...prev, whatsapp: e.target.value }))
                          }
                          placeholder="Ex: +261 34 00 000 00"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adresse Email professionnelle
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={companyProfile.email}
                          onChange={(e) =>
                            setCompanyProfile((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="Ex: contact@monimprimerie.mg"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adresse physique de la société
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={companyProfile.address}
                          onChange={(e) =>
                            setCompanyProfile((prev) => ({ ...prev, address: e.target.value }))
                          }
                          placeholder="Ex: Tour Redland, Ankorondrano, Antananarivo, Madagascar"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lien Page Facebook / Réseau Social
                      </label>
                      <div className="relative">
                        <Share2 className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={companyProfile.facebook}
                          onChange={(e) =>
                            setCompanyProfile((prev) => ({ ...prev, facebook: e.target.value }))
                          }
                          placeholder="Ex: https://facebook.com/monimprimerie"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <LiquidGlassButton variant="primary" size="lg" type="submit">
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les identifiants & le logo</span>
                  </LiquidGlassButton>
                </div>
              </form>
            </div>
          )}

          {/* PAGE : CONFIGURATION API MVOLA & CLÉ SANDBOX */}
          {activePage === 'mvola' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-800">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                      Configuration API MVola Merchant Pay & Clé Sandbox
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Intégrez votre Consumer Key, Consumer Secret et votre numéro marchand MVola (Spécification OpenAPI 3.0.1 v1.0.0).
                    </p>
                  </div>
                </div>
              </div>

              {mvolaSaveSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{mvolaSaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveMVolaConfig} className="space-y-6">
                <div className="glass p-6 sm:p-8 rounded-3xl space-y-4 bg-emerald-50/50 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-display text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>Activer le paiement en ligne MVola</span>
                      </span>
                      <p className="text-xs text-slate-600 max-w-xl">
                        Si désactivé (recommandé pour le lancement en attendant votre compte marchand), les clients seront automatiquement redirigés vers le Paiement à la réception avec la mention « Service en cours de résolution ».
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={mvolaConfig.isMVolaEnabled}
                      onClick={() => setMvolaConfig((prev) => ({ ...prev, isMVolaEnabled: !prev.isMVolaEnabled }))}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mvolaConfig.isMVolaEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          mvolaConfig.isMVolaEnabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 2. Interrupteur Mode Sandbox vs Mode Production (Go Live) */}
                <div
                  className={`glass p-6 sm:p-8 rounded-3xl border transition-all space-y-4 ${
                    !mvolaConfig.isSandbox
                      ? 'border-emerald-500/40 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-display text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${!mvolaConfig.isSandbox ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span>Mode Production (Go Live)</span>
                        </span>
                        {!mvolaConfig.isSandbox ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            PRODUCTION (EN DIRECT)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            SANDBOX (TEST)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 max-w-xl">
                        {!mvolaConfig.isSandbox ? (
                          <span className="text-emerald-950 font-medium">
                            <strong>Mode Réel actif :</strong> L'environnement Sandbox est désactivé. Les transactions sont exécutées en direct sur le réseau Telma MVola (<code className="font-mono text-[11px] bg-emerald-100 px-1 py-0.5 rounded">api.mvola.mg</code>) et les clients reçoivent un véritable message PUSH USSD sur leur mobile pour saisir leur code secret MVola.
                          </span>
                        ) : (
                          <span className="text-amber-950 font-medium">
                            <strong>Mode Sandbox (Test) actif :</strong> L'environnement de test (<code className="font-mono text-[11px] bg-amber-100 px-1 py-0.5 rounded">pre-api.mvola.mg</code>) est utilisé pour simuler les transactions sans prélever d'argent réel. Aucun push réel n'est envoyé aux clients.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-700">
                        {!mvolaConfig.isSandbox ? 'Go Live (Actif)' : 'Sandbox (Actif)'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!mvolaConfig.isSandbox}
                        onClick={() => {
                          const willBeProd = mvolaConfig.isSandbox; // passing from sandbox to prod
                          setMvolaConfig((prev) => ({
                            ...prev,
                            isSandbox: !willBeProd,
                            environmentUrl: willBeProd
                              ? 'https://api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/'
                              : 'https://pre-api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/',
                          }));
                        }}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !mvolaConfig.isSandbox ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        title={!mvolaConfig.isSandbox ? 'Désactiver le mode Production et revenir en Sandbox' : 'Activer le mode Production (Go Live)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            !mvolaConfig.isSandbox ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 sm:p-8 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
                    <h2 className="font-display text-sm sm:text-base font-semibold text-slate-950 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                      <span>Paramètres d'Authentification OAuth2 &amp; Merchant Pay ({!mvolaConfig.isSandbox ? 'Production' : 'Sandbox'})</span>
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      OpenAPI 3.0.1 v1.0.0
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clé Consumer Key ({!mvolaConfig.isSandbox ? 'Clé de Production' : 'Clé Sandbox'}) *
                      </label>
                      <input
                        type="text"
                        value={mvolaConfig.consumerKey}
                        onChange={(e) => setMvolaConfig((prev) => ({ ...prev, consumerKey: e.target.value }))}
                        placeholder={!mvolaConfig.isSandbox ? 'Votre Consumer Key de Production fournie par Telma' : 'Ex: 8x9Y... (votre Consumer Key fournie par MVola Developer Portal)'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clé Consumer Secret ({!mvolaConfig.isSandbox ? 'Secret de Production' : 'Secret Sandbox'}) *
                      </label>
                      <input
                        type="password"
                        value={mvolaConfig.consumerSecret}
                        onChange={(e) => setMvolaConfig((prev) => ({ ...prev, consumerSecret: e.target.value }))}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro de Téléphone Marchand MVola *
                      </label>
                      <input
                        type="text"
                        value={mvolaConfig.merchantPhone}
                        onChange={(e) => setMvolaConfig((prev) => ({ ...prev, merchantPhone: e.target.value }))}
                        placeholder="Ex: 034 00 000 00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom Partenaire (Partner Name) *
                      </label>
                      <input
                        type="text"
                        value={mvolaConfig.partnerName}
                        onChange={(e) => setMvolaConfig((prev) => ({ ...prev, partnerName: e.target.value }))}
                        placeholder="Ex: My PRINT"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL de l'Environnement API MVola ({!mvolaConfig.isSandbox ? 'Production' : 'Sandbox'})
                      </label>
                      <input
                        type="url"
                        value={mvolaConfig.environmentUrl}
                        onChange={(e) => setMvolaConfig((prev) => ({ ...prev, environmentUrl: e.target.value }))}
                        placeholder={
                          !mvolaConfig.isSandbox
                            ? 'https://api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/'
                            : 'https://pre-api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        {!mvolaConfig.isSandbox ? (
                          <>
                            URL officielle Production : <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">https://api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/</code>
                          </>
                        ) : (
                          <>
                            URL Sandbox Test : <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">https://pre-api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/</code>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  !mvolaConfig.isSandbox
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${!mvolaConfig.isSandbox ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span>{!mvolaConfig.isSandbox ? 'Prêt pour les paiements réels en direct' : 'Mode Sandbox (Test) activé'}</span>
                  </p>
                  <p className="text-slate-600">
                    {!mvolaConfig.isSandbox
                      ? 'Les coordonnées saisies seront utilisées pour contacter en temps réel les serveurs officiels de MVola Telma. Les clients recevront une véritable invite USSD sur leur mobile.'
                      : 'Les coordonnées ci-dessus sont configurées pour le simulateur Sandbox. Aucun montant réel ne sera prélevé et les notifications push restent virtuelles.'}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <LiquidGlassButton variant="primary" size="lg" type="submit" className={!mvolaConfig.isSandbox ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}>
                    <Check className="w-4 h-4" />
                    <span>Enregistrer la Configuration MVola ({!mvolaConfig.isSandbox ? 'Production Go Live' : 'Sandbox Test'})</span>
                  </LiquidGlassButton>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* MODAL DE SUPPRESSION TOTALE DES COMMANDES (AVERTISSEMENT + CLÉ ADMIN) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl border border-red-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-950">
                Avertissement : Supprimer TOUTES les commandes ?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Cette action est irréversible et remettra le compteur des commandes à 0. Veuillez saisir votre code PIN administrateur pour confirmer.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-800">Code PIN Administrateur (6 chiffres)</label>
              <input
                type="password"
                maxLength={6}
                value={deleteAllPin}
                onChange={(e) => {
                  setDeleteAllPin(e.target.value);
                  setDeleteAllError(null);
                }}
                placeholder="• • • • • •"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {deleteAllError && (
                <p className="text-xs font-semibold text-red-600 text-center">{deleteAllError}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllOrders}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'importation JSON de produits */}
      <JsonProductImportModal
        isOpen={isJsonImportModalOpen}
        onClose={() => setIsJsonImportModalOpen(false)}
        existingProducts={products}
        existingCategories={categories}
        onImportSuccess={handleJsonImportSuccess}
      />
    </div>
  );
};
