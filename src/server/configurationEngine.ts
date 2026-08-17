/**
 * OptiCraft Eyewear - Lens & Frame Dynamic Configuration Engine
 * Server-authoritative calculation and validation matrix
 */

import { db } from './db.js';
import { ProductConfiguration, Prescription } from '../types.js';

export interface ConfigurationInput {
  productId: string;
  lensTypeId: string;
  materialId?: string;
  coatingIds?: string[];
  prescription?: Prescription;
  prescriptionMode?: 'manual' | 'upload' | 'both' | 'none';
}

export function buildAndValidateConfiguration(input: ConfigurationInput): {
  success: boolean;
  configuration?: ProductConfiguration;
  error?: string;
} {
  const { productId, lensTypeId, materialId, coatingIds = [], prescription, prescriptionMode = 'none' } = input;

  // 1. Validate Product
  const product = db.products.get(productId);
  if (!product || !product.active) {
    return { success: false, error: 'Product frame not found or unavailable' };
  }

  // 2. Validate Lens Type
  const lensType = db.lensTypes.get(lensTypeId);
  if (!lensType || !lensType.active) {
    return { success: false, error: 'Selected lens type is invalid or inactive' };
  }

  if (!product.allowedLensTypeIds.includes(lensTypeId)) {
    return { success: false, error: `Lens type "${lensType.name}" is not compatible with frame "${product.name}"` };
  }

  // 3. Validate Material (if applicable)
  let materialName: string | undefined;
  let materialPrice = 0;
  if (materialId) {
    const material = db.lensMaterials.get(materialId);
    if (!material || !material.active) {
      return { success: false, error: 'Selected lens material is invalid' };
    }
    if (!material.compatibilityLensTypeIds.includes(lensTypeId)) {
      return { success: false, error: `Material "${material.name}" is incompatible with "${lensType.name}"` };
    }
    materialName = material.name;
    materialPrice = material.additionalPrice;
  }

  // 4. Validate Coatings
  let coatingsTotalPrice = 0;
  const coatingNames: string[] = [];
  for (const cId of coatingIds) {
    const coating = db.coatings.get(cId);
    if (!coating || !coating.active) {
      return { success: false, error: `Coating ID ${cId} is invalid or inactive` };
    }
    if (materialId && !coating.compatibilityMaterialIds.includes(materialId)) {
      return { success: false, error: `Coating "${coating.name}" is not compatible with selected material` };
    }
    coatingsTotalPrice += coating.additionalPrice;
    coatingNames.push(coating.name);
  }

  // 5. Prescription Requirement Check
  if (lensType.requiresPrescription) {
    if (prescriptionMode === 'none' && !prescription) {
      return { success: false, error: `Prescription is required for ${lensType.name} lenses` };
    }
  }

  // 6. Dynamic Server-Side Price Calculation Formula:
  // Frame Price + Lens Base Price + Material Price + Coating Price
  const framePrice = product.price;
  const lensTypeBasePrice = lensType.basePrice;
  const calculatedTotalPrice = Math.round(framePrice + lensTypeBasePrice + materialPrice + coatingsTotalPrice);

  const configuration: ProductConfiguration = {
    productId: product.id,
    productName: product.name,
    frameSku: product.sku,
    framePrice: product.price,
    frameColor: product.frame.color,
    frameSize: product.frame.size,
    frameImage: product.images[0] || '',
    lensTypeId: lensType.id,
    lensTypeName: lensType.name,
    lensTypeBasePrice: lensType.basePrice,
    requiresPrescription: lensType.requiresPrescription,
    materialId,
    materialName,
    materialPrice,
    coatingIds,
    coatingNames,
    coatingsTotalPrice,
    prescription,
    prescriptionMode,
    calculatedTotalPrice,
  };

  return { success: true, configuration };
}
