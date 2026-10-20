import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CustomerOrder, OrderStatus } from '../types/order';
import { SiteThemeConfig, DEFAULT_THEME_CONFIG } from '../types/theme';
import { SiteContentConfig, DEFAULT_SITE_CONTENT } from '../types/siteContent';
import { Product, PRODUCTS, CategoryItem, DEFAULT_CATEGORIES, sanitizeProductColors } from '../data/products';

const PIN_STORAGE_KEY = 'my_print_admin_pin_key';
const ORDERS_STORAGE_KEY = 'my_print_site_orders_v1';
const THEME_STORAGE_KEY = 'my_print_site_theme_v1';
const CONTENT_STORAGE_KEY = 'my_print_site_content_v1';
const PRODUCTS_STORAGE_KEY = 'my_print_products_v1';
const CATEGORIES_STORAGE_KEY = 'my_print_categories_v1';
const DEFAULT_PIN = '123456';

/**
 * Nettoie récursivement les propriétés 'undefined' d'un objet
 * pour éviter les erreurs Firestore (Unsupported field value: undefined)
 */
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

// Commandes initiales de démonstration en Ariary
const INITIAL_DEMO_ORDERS: CustomerOrder[] = [
  {
    id: 'MP-2026-9041',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    clientNote: 'Livraison express Tour Redland · Référence dossier Kinetik Studio',
    contactEmail: 'contact@kinetik-design.mg',
    status: 'nouveau',
    totalPieces: 150,
    totalAmount: 432000,
    items: [
      {
        productId: 'stylo-roller-titane-usiné',
        productName: 'Roller Architectural Aluminium & Titane',
        imageUrl: '/src/assets/images/product_linen_notebook_1791981763268.jpg',
        variantName: 'Titane Brossé',
        swatchHex: '#94A3B8',
        printMethodName: 'Micro-Gravure Laser Fibre',
        quantity: 50,
        unitPrice: 1504,
        customBrandingText: 'KINETIK · ARCHITECTURE 2026',
        pantoneReference: 'Gravure Argent Mat',
      },
      {
        productId: 'totebag-architecte-450g',
        productName: 'Cabas Structuré Coton Bio 450 g/m²',
        imageUrl: '/src/assets/images/product_organic_totebag_1791981762796.jpg',
        variantName: 'Écru Non Blanchi',
        swatchHex: '#EFECE6',
        printMethodName: 'Sérigraphie Encres à l’Eau',
        quantity: 100,
        unitPrice: 2816,
        customBrandingText: 'KINETIK STUDIO · COLLECTIVE',
        pantoneReference: 'Pantone 426C (Noir Encre)',
      },
    ],
  },
  {
    id: 'MP-2026-8819',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    clientNote: 'Pack d’accueil nouveaux collaborateurs Q2 · Prévoir BAT haute définition',
    contactEmail: 'rh@bancal-invest.com',
    status: 'bat_en_cours',
    totalPieces: 45,
    totalAmount: 675000,
    items: [
      {
        productId: 'coffret-onboarding-signature',
        productName: 'Coffret Welcome Kit « My PRINT Signature »',
        imageUrl: '/src/assets/images/hero_custom_goodies_kit_1791981759014.jpg',
        variantName: 'Harmonie Pierre & Anthracite',
        swatchHex: '#E5E0D8',
        printMethodName: 'Pack Marquage Multi-Supports',
        quantity: 45,
        unitPrice: 15000,
        customBrandingText: 'BANCAL & ASSOCIÉS',
        pantoneReference: 'Foil Or Mat & Gravure Laser',
      },
    ],
  },
  {
    id: 'MP-2026-8104',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    clientNote: 'Cadeaux de fin d’année partenaires · Tranches argentées requises',
    contactEmail: 'direction@orion-group.org',
    status: 'en_production',
    totalPieces: 100,
    totalAmount: 396000,
    items: [
      {
        productId: 'carnet-lin-archive-a5',
        productName: 'Carnet Relié Toile de Lin « Archive » A5',
        imageUrl: '/src/assets/images/product_linen_notebook_1791981763268.jpg',
        variantName: 'Bleu Prisme Profond',
        swatchHex: '#1E3A8A',
        printMethodName: 'Marquage à Chaud Argent / Or Mat',
        quantity: 100,
        unitPrice: 3960,
        customBrandingText: 'ORION PARTNERS 2026',
        pantoneReference: 'Foil Argent 877C',
      },
    ],
  },
];

// --- GESTION DU CODE PIN ---

export function getAdminPin(): string {
  try {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved && /^\d{6}$/.test(saved)) {
      return saved;
    }
  } catch (err) {
    console.error('Erreur lecture PIN cache local', err);
  }
  return DEFAULT_PIN;
}

export async function fetchAdminPinFromFirestore(): Promise<string> {
  const path = 'settings/admin_pin';
  try {
    const snap = await getDoc(doc(db, 'settings', 'admin_pin'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && typeof data.value === 'string' && /^\d{6}$/.test(data.value)) {
        localStorage.setItem(PIN_STORAGE_KEY, data.value);
        return data.value;
      }
    }
  } catch (error) {
    console.warn('Impossible de charger le PIN depuis Firestore, utilisation du cache local.', error);
  }
  return getAdminPin();
}

export function setAdminPin(newPin: string): boolean {
  if (!/^\d{6}$/.test(newPin)) {
    return false;
  }
  try {
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    // Sauvegarde asynchrone dans Firestore
    setDoc(doc(db, 'settings', 'admin_pin'), {
      key: 'admin_pin',
      value: newPin,
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, 'settings/admin_pin');
    });
    return true;
  } catch (err) {
    console.error('Erreur sauvegarde PIN', err);
    return false;
  }
}

export function verifyAdminPin(enteredPin: string): boolean {
  const currentPin = getAdminPin();
  return enteredPin.trim() === currentPin;
}

// --- GESTION DES COMMANDES DANS FIRESTORE ---

export function getStoredOrders(): CustomerOrder[] {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture cache local commandes', err);
  }
  return [];
}

/**
 * Charge les commandes depuis Firestore sans amorçage fictif automatique
 */
export async function syncOrdersFromFirestore(): Promise<CustomerOrder[]> {
  const path = 'orders';
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const remoteOrders: CustomerOrder[] = [];
    snapshot.forEach((d) => {
      const item = d.data() as CustomerOrder;
      remoteOrders.push(item);
    });
    remoteOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(remoteOrders));
    return remoteOrders;
  } catch (error) {
    console.warn('Erreur lecture Firestore orders, retour aux données locales', error);
    return getStoredOrders();
  }
}

/**
 * Supprime toutes les commandes (base locale et Firestore)
 */
export async function deleteAllStoredOrders(): Promise<CustomerOrder[]> {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_orders_changed', { detail: [] }));
    }
  } catch (err) {
    console.error('Erreur suppression toutes commandes locales', err);
  }

  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'orders', d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'orders');
  }

  return [];
}

/**
 * Écoute en temps réel les commandes dans Firestore
 */
export function subscribeToOrders(onUpdate: (orders: CustomerOrder[]) => void): () => void {
  const path = 'orders';
  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const orders: CustomerOrder[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as CustomerOrder);
      });
      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (orders.length > 0) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        onUpdate(orders);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Envoie une notification par email au gérant lors d'une nouvelle commande ou proforma
 */
export async function notifyNewOrder(
  order: CustomerOrder, 
  options: { cc?: string | string[], bcc?: string | string[], type?: 'commande' | 'proforma' } = {}
): Promise<void> {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/orders/notify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        order, 
        cc: options.cc, 
        bcc: options.bcc, 
        type: options.type || 'commande' 
      }),
    });
    
    if (!response.ok) {
      console.warn('Notification email échec (status):', response.status);
      return;
    }

    const data = await response.json();
    if (!data.success) {
      console.warn('Notification email échec:', data.message);
    }
  } catch (err) {
    console.error('Erreur lors de la notification par email:', err);
  }
}

/**
 * Enregistre une nouvelle commande dans Firestore et le cache local
 */
export function saveNewOrder(newOrder: CustomerOrder): CustomerOrder[] {
  const sanitizedOrder = cleanUndefined(newOrder);
  const current = getStoredOrders();
  const updated = [sanitizedOrder, ...current];
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erreur écriture cache local', err);
  }

  // Écriture Firestore avec capture d'erreur standardisée
  setDoc(doc(db, 'orders', sanitizedOrder.id), sanitizedOrder).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, `orders/${sanitizedOrder.id}`);
  });

  // Déclencher la notification email (asynchrone, ne bloque pas le retour)
  notifyNewOrder(sanitizedOrder);

  return updated;
}

/**
 * Met à jour le statut d'une commande dans Firestore et le cache local
 */
export function updateOrderStatus(orderId: string, status: OrderStatus): CustomerOrder[] {
  const current = getStoredOrders();
  const updated = current.map((order) =>
    order.id === orderId ? { ...order, status } : order
  );
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erreur écriture statut cache local', err);
  }

  // Écriture Firestore
  updateDoc(doc(db, 'orders', orderId), { status }).catch((err) => {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
  });

  return updated;
}

/**
 * Supprime une commande dans Firestore et le cache local
 */
export function deleteStoredOrder(orderId: string): CustomerOrder[] {
  const current = getStoredOrders();
  const updated = current.filter((order) => order.id !== orderId);
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erreur suppression cache local', err);
  }

  // Suppression Firestore
  deleteDoc(doc(db, 'orders', orderId)).catch((err) => {
    handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
  });

  return updated;
}

// --- GESTION DU THÈME & FOND DE COULEUR DU SITE ---

export function getSiteTheme(): SiteThemeConfig {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.baseColor === 'string') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture thème local', err);
  }
  return DEFAULT_THEME_CONFIG;
}

export async function fetchSiteThemeFromFirestore(): Promise<SiteThemeConfig> {
  const path = 'settings/theme';
  try {
    const snap = await getDoc(doc(db, 'settings', 'theme'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (parsed && typeof parsed.baseColor === 'string') {
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
  } catch (error) {
    console.warn('Impossible de charger le thème depuis Firestore, utilisation du thème local', error);
  }
  return getSiteTheme();
}

export function saveSiteTheme(theme: SiteThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_theme_changed', { detail: theme }));
    }
  } catch (err) {
    console.error('Erreur écriture thème local', err);
  }

  // Écriture Firestore persistante
  setDoc(doc(db, 'settings', 'theme'), {
    key: 'theme',
    value: JSON.stringify(theme),
    updatedAt: new Date().toISOString(),
  }).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/theme');
  });
}

export function subscribeToSiteTheme(callback: (theme: SiteThemeConfig) => void): () => void {
  const path = 'settings/theme';
  return onSnapshot(
    doc(db, 'settings', 'theme'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (parsed && typeof parsed.baseColor === 'string') {
              localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(parsed));
              callback(parsed);
            }
          } catch (e) {
            console.error('Erreur parsing thème Firestore', e);
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// --- GESTION DES TEXTES & CONTENUS DU SITE ---

export function getSiteContent(): SiteContentConfig {
  try {
    const saved = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.heroHeading === 'string') {
        return { ...DEFAULT_SITE_CONTENT, ...parsed };
      }
    }
  } catch (err) {
    console.error('Erreur lecture contenu local', err);
  }
  return DEFAULT_SITE_CONTENT;
}

export async function fetchSiteContentFromFirestore(): Promise<SiteContentConfig> {
  const localContent = getSiteContent();
  try {
    const [contentSnap, eventSlidesSnap] = await Promise.all([
      getDoc(doc(db, 'settings', 'site_content')),
      getDoc(doc(db, 'settings', 'event_slides'))
    ]);

    let merged: SiteContentConfig = { ...localContent };

    if (contentSnap.exists()) {
      const data = contentSnap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (parsed && typeof parsed.heroHeading === 'string') {
          merged = { ...merged, ...parsed };
        }
      }
    }

    if (eventSlidesSnap.exists()) {
      const data = eventSlidesSnap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed)) {
          merged.eventSlides = parsed;
        }
      }
    }

    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Impossible de charger le contenu depuis Firestore, utilisation du cache local', error);
  }
  return localContent;
}

export function saveSiteContent(content: SiteContentConfig): void {
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_site_content_changed', { detail: content }));
    }
  } catch (err) {
    console.error('Erreur écriture contenu local', err);
  }

  const { eventSlides, ...mainContent } = content;

  // Écriture Firestore (sans les eventSlides volumineux pour éviter la limite de 1 Mo)
  setDoc(doc(db, 'settings', 'site_content'), {
    key: 'site_content',
    value: JSON.stringify(mainContent),
    updatedAt: new Date().toISOString(),
  }).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/site_content');
  });

  // Écriture Firestore séparée pour les eventSlides avec vérification de la limite de 1 Mo de Firestore
  if (eventSlides) {
    const slidesJson = JSON.stringify(eventSlides);
    if (slidesJson.length > 950000) {
      console.warn('Event slides payload exceeds Firestore 1MB limit. Storing optimized version in Firestore.');
      const optimizedSlides = eventSlides.map(slide => ({
        ...slide,
        imageUrl: slide.imageUrl && slide.imageUrl.startsWith('data:') ? '' : slide.imageUrl
      }));
      setDoc(doc(db, 'settings', 'event_slides'), {
        key: 'event_slides',
        value: JSON.stringify(optimizedSlides),
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('Firestore event_slides write skipped due to size limit:', err);
      });
    } else {
      setDoc(doc(db, 'settings', 'event_slides'), {
        key: 'event_slides',
        value: slidesJson,
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('Firestore event_slides write warning:', err);
      });
    }
  }
}

export function subscribeToSiteContent(callback: (content: SiteContentConfig) => void): () => void {
  const path = 'settings/site_content';
  let currentContent = getSiteContent();

  const unsub1 = onSnapshot(
    doc(db, 'settings', 'site_content'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (parsed && typeof parsed.heroHeading === 'string') {
              currentContent = { ...currentContent, ...parsed };
              localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(currentContent));
              callback(currentContent);
            }
          } catch (e) {
            console.error('Erreur parsing contenu site Firestore', e);
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  const unsub2 = onSnapshot(
    doc(db, 'settings', 'event_slides'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(parsed)) {
              currentContent = { ...currentContent, eventSlides: parsed };
              localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(currentContent));
              callback(currentContent);
            }
          } catch (e) {
            console.error('Erreur parsing event slides Firestore', e);
          }
        }
      }
    },
    (error) => {
      // ignore
    }
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// --- GESTION DU CATALOGUE DE PRODUITS ---

function sanitizeProductSpecs(p: Product): Product {
  const specs = p.specs ? { ...p.specs } : undefined;
  if (specs) {
    if (specs.material === 'Matière sélectionnée') specs.material = '';
    if (specs.dimensions === 'Dimensions standard') specs.dimensions = '';
    if (specs.certification === 'Norme My PRINT') specs.certification = '';
  }
  return {
    ...p,
    specs: specs || { material: '', dimensions: '', certification: '', printArea: '' },
  };
}

export function cleanStoredProductsList(products: Product[]): Product[] {
  return products.map((p) => sanitizeProductColors(sanitizeProductSpecs(p)));
}

export function getStoredProducts(): Product[] {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return cleanStoredProductsList(parsed);
      }
    }
  } catch (err) {
    console.error('Erreur lecture produits locaux', err);
  }
  return cleanStoredProductsList(PRODUCTS);
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const path = 'settings/products';
  try {
    const snap = await getDoc(doc(db, 'settings', 'products'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = cleanStoredProductsList(parsed);
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les produits depuis Firestore, utilisation du cache local', error);
  }
  return getStoredProducts();
}

export function saveStoredProducts(products: Product[]): void {
  const sanitized = cleanStoredProductsList(products);
  const cleaned = cleanUndefined(sanitized);
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cleaned));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_products_changed', { detail: cleaned }));
    }
  } catch (err) {
    console.error('Erreur écriture produits locaux', err);
  }

  // Écriture Firestore
  setDoc(doc(db, 'settings', 'products'), {
    key: 'products',
    value: JSON.stringify(cleaned),
    updatedAt: new Date().toISOString(),
  }).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/products');
  });
}

export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  const path = 'settings/products';
  return onSnapshot(
    doc(db, 'settings', 'products'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleaned = cleanStoredProductsList(parsed);
              localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cleaned));
              callback(cleaned);
            }
          } catch (e) {
            console.error('Erreur parsing produits Firestore', e);
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// --- GESTION DES CATÉGORIES ---

export function getStoredCategories(): CategoryItem[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erreur lecture catégories locales', e);
  }
  return DEFAULT_CATEGORIES;
}

export async function fetchCategoriesFromFirestore(): Promise<CategoryItem[]> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'categories'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les catégories depuis Firestore, utilisation du cache local', error);
  }
  return getStoredCategories();
}

export function saveStoredCategories(categories: CategoryItem[]): void {
  const cleaned = cleanUndefined(categories);
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cleaned));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_categories_changed', { detail: cleaned }));
    }
  } catch (err) {
    console.error('Erreur écriture catégories locales', err);
  }

  setDoc(doc(db, 'settings', 'categories'), {
    key: 'categories',
    value: JSON.stringify(cleaned),
    updatedAt: new Date().toISOString(),
  }).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/categories');
  });
}

export function subscribeToCategories(callback: (categories: CategoryItem[]) => void): () => void {
  const path = 'settings/categories';
  return onSnapshot(
    doc(db, 'settings', 'categories'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(parsed));
              callback(parsed);
            }
          } catch (e) {
            console.error('Erreur parsing catégories Firestore', e);
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// --- GESTION DES IDENTIFIANTS ET LOGO SOCIÉTÉ ---

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebook: string;
  logoUrl?: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'My PRINT',
  address: 'Tour Redland, Ankorondrano, Antananarivo, Madagascar',
  phone: '+261 34 00 000 00',
  whatsapp: '+261 34 00 000 00',
  email: 'contact@myprint.mg',
  facebook: 'https://facebook.com/myprint.mg',
  logoUrl: '',
};

const COMPANY_PROFILE_STORAGE_KEY = 'my_print_company_profile_v1';

export function getCompanyProfile(): CompanyProfile {
  try {
    const saved = localStorage.getItem(COMPANY_PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_COMPANY_PROFILE, ...parsed };
      }
    }
  } catch (err) {
    console.error('Erreur lecture profil société local', err);
  }
  return DEFAULT_COMPANY_PROFILE;
}

export async function fetchCompanyProfileFromFirestore(): Promise<CompanyProfile> {
  const path = 'settings/company_profile';
  try {
    const snap = await getDoc(doc(db, 'settings', 'company_profile'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (parsed && typeof parsed === 'object') {
          const profile = { ...DEFAULT_COMPANY_PROFILE, ...parsed };
          localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
          return profile;
        }
      }
    }
  } catch (error) {
    console.warn('Impossible de charger le profil société depuis Firestore', error);
  }
  return getCompanyProfile();
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myprint_company_profile_changed', { detail: profile }));
    }
  } catch (err) {
    console.error('Erreur écriture profil société local', err);
  }

  setDoc(doc(db, 'settings', 'company_profile'), {
    key: 'company_profile',
    value: JSON.stringify(profile),
    updatedAt: new Date().toISOString(),
  }).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/company_profile');
  });
}

export function subscribeToCompanyProfile(callback: (profile: CompanyProfile) => void): () => void {
  const path = 'settings/company_profile';
  return onSnapshot(
    doc(db, 'settings', 'company_profile'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (parsed && typeof parsed === 'object') {
              const profile = { ...DEFAULT_COMPANY_PROFILE, ...parsed };
              localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
              callback(profile);
            }
          } catch (e) {
            console.error('Erreur parsing profil société Firestore', e);
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

