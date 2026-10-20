export type OrderStatus =
  | 'nouveau'
  | 'proforma_demande'
  | 'paye_mvola'
  | 'a_livrer_paiement_reception'
  | 'bat_en_cours'
  | 'en_production'
  | 'expedie';

export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl: string;
  variantName: string;
  swatchHex: string;
  printMethodName: string;
  quantity: number;
  unitPrice: number;
  customBrandingText: string;
  pantoneReference: string;
}

export interface CustomerOrder {
  id: string;
  createdAt: string;
  clientNote?: string;
  items: OrderItem[];
  totalPieces: number;
  totalAmount: number;
  deliveryFee?: number;
  isDeliveryRequested?: boolean;
  status: OrderStatus;
  contactEmail?: string;
  contactName?: string;
  companyName?: string;
  contactPhone?: string;
  paymentMethod?: 'mvola' | 'livraison_espece' | 'proforma' | 'proforma_email' | 'proforma_whatsapp';
  paymentTxRef?: string;
  deliveryAddress?: string;
}

