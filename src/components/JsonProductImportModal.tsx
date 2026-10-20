import React, { useState } from 'react';
import { Product, CategoryItem, formatFullAriary, resolveSwatchHex } from '../data/products';
import { LiquidGlassButton } from './LiquidGlassButton';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  RefreshCw,
  Eye,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';

export interface ParsedJsonProduct {
  id: string;
  name: string;
  description: string;
  sellingPrice: number;
  imageUrl: string;
  rawCategory: string;
  categorySlug: string;
  categoryLabel: string;
  isNew: boolean;
  rawItem: any;
}

interface JsonProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  existingCategories: CategoryItem[];
  onImportSuccess: (
    updatedProducts: Product[],
    updatedCategories: CategoryItem[],
    stats: { added: number; updated: number; categoriesCreated: number }
  ) => void;
}

export function parseProductsFromJson(
  jsonArray: any[],
  existingProducts: Product[]
): ParsedJsonProduct[] {
  const existingMap = new Map(existingProducts.map((p) => [p.id, p]));

  return jsonArray.map((item, index) => {
    const id = item.id
      ? String(item.id).trim()
      : item.code
      ? String(item.code).trim()
      : `imported-${Date.now()}-${index}`;

    const name = item.name || item.nom || item.title || `Produit #${index + 1}`;

    // Photo de produit : mainImageUrl, imageUrl ou variation image
    const imageUrl =
      item.mainImageUrl ||
      item.imageUrl ||
      (Array.isArray(item.variationImageUrls) && item.variationImageUrls[0]) ||
      '';

    // Description
    const description =
      item.description ||
      item.technicalDetail ||
      item.shortDescription ||
      item.fullDescription ||
      '';

    // Prix de vente
    let priceNum = 0;
    if (typeof item.price === 'number' && !isNaN(item.price)) {
      priceNum = item.price;
    } else if (typeof item.promotionalPrice === 'number' && !isNaN(item.promotionalPrice)) {
      priceNum = item.promotionalPrice;
    } else if (item.price) {
      priceNum = Number(item.price) || 0;
    } else if (item.promotionalPrice) {
      priceNum = Number(item.promotionalPrice) || 0;
    }

    // Catégorie
    let rawCategory = '';
    if (typeof item.category === 'string' && item.category.trim()) {
      rawCategory = item.category.trim();
    } else if (
      Array.isArray(item.categories) &&
      item.categories.length > 0 &&
      typeof item.categories[0] === 'string'
    ) {
      rawCategory = item.categories[0].trim();
    } else {
      rawCategory = 'Général';
    }

    // Slug pour identifiant de catégorie
    const categorySlug =
      rawCategory
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'general';

    const isNew = !existingMap.has(id);

    return {
      id,
      name,
      description,
      sellingPrice: priceNum,
      imageUrl,
      rawCategory,
      categorySlug,
      categoryLabel: rawCategory,
      isNew,
      rawItem: item,
    };
  });
}

export const JsonProductImportModal: React.FC<JsonProductImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  existingCategories,
  onImportSuccess,
}) => {
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ParsedJsonProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [createMissingCategories, setCreateMissingCategories] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessRawJson = (jsonString: string) => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonString);
      const itemsArray = Array.isArray(parsed)
        ? parsed
        : parsed.products && Array.isArray(parsed.products)
        ? parsed.products
        : [parsed];

      if (itemsArray.length === 0) {
        setParseError('Le fichier JSON ne contient aucun objet produit valide.');
        setParsedProducts([]);
        return;
      }

      const parsedList = parseProductsFromJson(itemsArray, existingProducts);
      setParsedProducts(parsedList);
    } catch (err: any) {
      console.error('Erreur de lecture JSON:', err);
      setParseError(`Format JSON invalide : ${err.message || 'vérifiez la syntaxe du fichier'}`);
      setParsedProducts([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonInputText(content);
        handleProcessRawJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleTextPasteChange = (text: string) => {
    setJsonInputText(text);
    if (text.trim()) {
      handleProcessRawJson(text);
    } else {
      setParsedProducts([]);
      setParseError(null);
    }
  };

  const handleConfirmImport = () => {
    if (parsedProducts.length === 0) return;

    const existingMap = new Map(existingProducts.map((p) => [p.id, p]));
    const categoryMap = new Map(existingCategories.map((c) => [c.id, c]));

    let addedCount = 0;
    let updatedCount = 0;
    let categoriesCreatedCount = 0;

    // Traitement des catégories
    if (createMissingCategories) {
      parsedProducts.forEach((item) => {
        if (!categoryMap.has(item.categorySlug)) {
          categoryMap.set(item.categorySlug, {
            id: item.categorySlug,
            label: item.categoryLabel,
            subtitle: `Catégorie ${item.categoryLabel}`,
            iconName: 'Folder',
          });
          categoriesCreatedCount++;
        }
      });
    }

    const convertToFullProduct = (p: ParsedJsonProduct): Product => {
      const existing = existingMap.get(p.id);
      const minQty =
        typeof p.rawItem.minimumOrderQuantity === 'number'
          ? p.rawItem.minimumOrderQuantity
          : existing?.minOrderQty || 1;

      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl || existing?.imageUrl || '',
        technicalDetail: p.description || existing?.technicalDetail || '',
        sellingPrice: p.sellingPrice,
        category: p.categorySlug,
        categoryLabel: p.categoryLabel,
        basePrice: p.sellingPrice,
        shortDescription: p.description || existing?.shortDescription || '',
        fullDescription: p.description || existing?.fullDescription || '',
        minOrderQty: minQty,
        quantityStep: existing?.quantityStep || 1,
        leadTimeDays: existing?.leadTimeDays || 5,
        tag: p.rawItem.hasSpecialProductionMention
          ? 'Édition Spéciale'
          : existing?.tag || 'Catalogue',
        specs: {
          material:
            (p.rawItem.billOfMaterials && p.rawItem.billOfMaterials[0]?.materialName) ||
            existing?.specs?.material ||
            '',
          dimensions:
            p.rawItem.length && p.rawItem.width && p.rawItem.height
              ? `${p.rawItem.length} × ${p.rawItem.width} × ${p.rawItem.height} cm`
              : existing?.specs?.dimensions || '',
          certification: existing?.specs?.certification || '',
          printArea: existing?.specs?.printArea || '',
        },
        variants: (() => {
          const rawColors =
            (Array.isArray(p.rawItem.availableColors) && p.rawItem.availableColors) ||
            (Array.isArray(p.rawItem.colors) && p.rawItem.colors) ||
            (Array.isArray(p.rawItem.couleurs) && p.rawItem.couleurs) ||
            (Array.isArray(p.rawItem.variants) && p.rawItem.variants) ||
            (typeof p.rawItem.color === 'string' && [p.rawItem.color]) ||
            (typeof p.rawItem.couleur === 'string' && [p.rawItem.couleur]) ||
            [];

          if (rawColors.length > 0) {
            return rawColors.map((c: any, i: number) => {
              const colorName = typeof c === 'string' ? c : c.name || c.label || c.couleur || `Couleur ${i + 1}`;
              const providedHex = typeof c === 'object' ? (c.hex || c.swatchHex || c.codeHex) : undefined;
              const finalHex = resolveSwatchHex(providedHex || colorName, '#16A34A');
              return {
                id: `var-import-${i}-${Date.now()}`,
                name: colorName,
                swatchHex: finalHex,
                finishLabel: typeof c === 'object' && c.finish ? c.finish : 'Standard',
              };
            });
          }

          return (
            existing?.variants || [
              { id: 'v-1', name: 'Standard', swatchHex: '#2563EB', finishLabel: 'Standard' },
            ]
          );
        })(),
        printMethods: existing?.printMethods || [
          {
            id: 'm-1',
            name: 'Marquage / Impression',
            detail: 'Haute Précision',
            unitSurcharge: 0,
          },
        ],
      };
    };

    let updatedProductsList: Product[] = [];

    if (importMode === 'replace') {
      updatedProductsList = parsedProducts.map((p) => {
        if (existingMap.has(p.id)) {
          updatedCount++;
        } else {
          addedCount++;
        }
        return convertToFullProduct(p);
      });
    } else {
      // Mode Merge (Fusion)
      const workingMap = new Map(existingProducts.map((p) => [p.id, p]));

      parsedProducts.forEach((p) => {
        if (workingMap.has(p.id)) {
          updatedCount++;
        } else {
          addedCount++;
        }
        workingMap.set(p.id, convertToFullProduct(p));
      });

      updatedProductsList = Array.from(workingMap.values());
    }

    const updatedCategoriesList = Array.from(categoryMap.values());

    onImportSuccess(updatedProductsList, updatedCategoriesList, {
      added: addedCount,
      updated: updatedCount,
      categoriesCreated: categoriesCreatedCount,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="glass w-full max-w-4xl bg-white/95 rounded-3xl shadow-2xl border border-white/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête du Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-900/10 flex items-center justify-between gap-4 bg-white/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-950 truncate">
                Importation & Mise à Jour du Catalogue (Fichier JSON)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Prise en charge des éléments : Photo, Nom, Description, Prix de vente et Catégorie.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps principal scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Sélection de la méthode de fourniture du JSON */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Charger un Fichier .json</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Coller du Code JSON</span>
            </button>
          </div>

          {/* Onglet Téléversement de fichier */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block p-8 rounded-3xl border-2 border-dashed border-blue-600/30 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/80 transition-all cursor-pointer text-center">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-bold text-slate-900 block">
                  Sélectionnez un fichier JSON sur votre appareil
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Glissez-déposez ou cliquez pour parcourir (.json)
                </span>
                {fileName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-mono font-medium mt-3">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Fichier chargé : {fileName}</span>
                  </span>
                )}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Onglet Saisie directe du JSON */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Collez le tableau JSON des produits ci-dessous :
              </label>
              <textarea
                value={jsonInputText}
                onChange={(e) => handleTextPasteChange(e.target.value)}
                placeholder='[\n  {\n    "id": "prod-1",\n    "name": "USB en bois",\n    "description": "Excellente finition",\n    "price": 35000,\n    "mainImageUrl": "https://...",\n    "categories": ["USB"]\n  }\n]'
                rows={6}
                className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Message d'erreur s'il y en a un */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-300 text-red-950 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Prévisualisation des données extraites du JSON */}
          {parsedProducts.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-display text-sm font-bold text-slate-950">
                    Aperçu des éléments extraits ({parsedProducts.length} produits)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Nouveaux :{' '}
                    <strong className="text-emerald-700">
                      {parsedProducts.filter((p) => p.isNew).length}
                    </strong>{' '}
                    · Mises à jour :{' '}
                    <strong className="text-blue-700">
                      {parsedProducts.filter((p) => !p.isNew).length}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Tableau / Liste des produits détectés */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="p-3">Photo</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Prix de vente</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{prod.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {prod.id}</div>
                          <div className="text-[10px] text-slate-600 line-clamp-1 max-w-xs mt-0.5">
                            {prod.description || 'Sans description'}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-900">
                          {formatFullAriary(prod.sellingPrice)}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span>{prod.rawCategory}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          {prod.isNew ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Nouveau
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              Mise à jour
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Options de fusion / Remplacement */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Options d'importation
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                      importMode === 'merge'
                        ? 'bg-blue-600/10 border-blue-600 text-slate-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block font-bold">Fusionner & Mettre à jour (Recommandé)</span>
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        Met à jour les produits existants par ID et ajoute les nouveaux. Conserve les autres produits du catalogue.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                      importMode === 'replace'
                        ? 'bg-red-600/10 border-red-600 text-slate-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block font-bold text-red-700">Remplacer tout le catalogue</span>
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        Efface les produits actuels et ne conserve que les {parsedProducts.length} produits de ce fichier.
                      </span>
                    </div>
                  </label>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-medium pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createMissingCategories}
                    onChange={(e) => setCreateMissingCategories(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Créer automatiquement les nouvelles catégories absentes de la liste ({parsedProducts.map(p => p.rawCategory).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Pied du Modal avec Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-900/10 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <LiquidGlassButton
            variant="primary"
            size="md"
            type="button"
            disabled={parsedProducts.length === 0}
            onClick={handleConfirmImport}
          >
            <Check className="w-4 h-4" />
            <span>
              Importer et appliquer {parsedProducts.length > 0 ? `(${parsedProducts.length} produits)` : ''}
            </span>
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  );
};
