/**
 * OptiCraft Eyewear - Phased Lens & Frame Configuration Engine Modal
 * Complete Phase 3 Production Experience
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LensType, LensMaterial, Coating, Prescription, ProductConfiguration } from '../types';
import { PrescriptionForm } from './PrescriptionForm';
import {
  X,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Edit3,
  Truck,
  AlertCircle,
  ShoppingBag,
  Ruler,
} from 'lucide-react';

export const LensConfiguratorModal: React.FC = () => {
  const {
    selectedProduct,
    isConfiguratorOpen,
    closeConfigurator,
    lensTypes,
    materials,
    coatings,
    addToCart,
    editingCartItem,
    updateCartItemConfiguration,
  } = useApp();

  // Step state: 1 = Lens Type, 2 = Lens Material, 3 = Coatings, 4 = Prescription (if powered), 5 = Final Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration Choices
  const [selectedLensTypeId, setSelectedLensTypeId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [selectedCoatingIds, setSelectedCoatingIds] = useState<string[]>([]);
  const [prescription, setPrescription] = useState<Prescription | undefined>(undefined);
  const [prescriptionMode, setPrescriptionMode] = useState<'manual' | 'upload' | 'both' | 'none'>('none');

  // Server-side validation error message banner
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Pre-populate if editing an existing cart item
  useEffect(() => {
    if (editingCartItem) {
      setSelectedLensTypeId(editingCartItem.configuration.lensTypeId);
      if (editingCartItem.configuration.materialId) {
        setSelectedMaterialId(editingCartItem.configuration.materialId);
      }
      if (editingCartItem.configuration.coatingIds) {
        setSelectedCoatingIds(editingCartItem.configuration.coatingIds);
      }
      if (editingCartItem.configuration.prescription) {
        setPrescription(editingCartItem.configuration.prescription);
      }
      if (editingCartItem.configuration.prescriptionMode) {
        setPrescriptionMode(editingCartItem.configuration.prescriptionMode);
      }
    }
  }, [editingCartItem]);

  // Filter compatible choices dynamically based on frame & lens type selection
  const compatibleLensTypes = lensTypes.filter(
    (lt) => lt.active && (selectedProduct ? selectedProduct.allowedLensTypeIds.includes(lt.id) : false)
  );

  const selectedLensType = lensTypes.find((lt) => lt.id === selectedLensTypeId);

  const compatibleMaterials = materials.filter(
    (m) => m.active && selectedLensTypeId && m.compatibilityLensTypeIds.includes(selectedLensTypeId)
  );

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const compatibleCoatings = coatings.filter(
    (c) => c.active && (!selectedMaterialId || c.compatibilityMaterialIds.includes(selectedMaterialId))
  );

  // Auto-select initial defaults when frame opens
  useEffect(() => {
    if (compatibleLensTypes.length > 0 && !selectedLensTypeId) {
      const defaultLt = compatibleLensTypes[0];
      setSelectedLensTypeId(defaultLt.id);
    }
  }, [selectedProduct, compatibleLensTypes]);

  // Downstream Reset 1: Reset Material & Coatings when Lens Type changes
  useEffect(() => {
    setValidationError(null);
    if (compatibleMaterials.length > 0) {
      // Pick first compatible material
      setSelectedMaterialId(compatibleMaterials[0].id);
    } else {
      setSelectedMaterialId('');
    }
  }, [selectedLensTypeId]);

  // Downstream Reset 2: Filter coatings when Material changes
  useEffect(() => {
    setValidationError(null);
    // Retain currently selected coatings if still compatible with new material, else drop
    const validCoatingIds = selectedCoatingIds.filter((id) =>
      compatibleCoatings.some((c) => c.id === id)
    );
    if (validCoatingIds.length === 0) {
      // Default to ARC & Hard coat if available
      const defaults = compatibleCoatings
        .filter((c) => c.name.includes('Hard') || c.name.includes('Anti-Reflection') || c.isBlueCut)
        .map((c) => c.id);
      setSelectedCoatingIds(defaults);
    } else {
      setSelectedCoatingIds(validCoatingIds);
    }
  }, [selectedMaterialId]);

  if (!isConfiguratorOpen || !selectedProduct) return null;

  // Price Calculation Formula
  const framePrice = selectedProduct.price;
  const lensBasePrice = selectedLensType?.basePrice || 0;
  const materialPrice = selectedMaterial?.additionalPrice || 0;
  const coatingsPrice = selectedCoatingIds.reduce((total, id) => {
    const c = coatings.find((item) => item.id === id);
    return total + (c?.additionalPrice || 0);
  }, 0);

  const totalCalculatedPrice = Math.round(framePrice + lensBasePrice + materialPrice + coatingsPrice);

  const toggleCoating = (id: string) => {
    setSelectedCoatingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!selectedLensTypeId) {
        setValidationError('Please select a lens type to proceed.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedMaterialId) {
        setValidationError('Please select a lens material to proceed.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedLensType?.requiresPrescription) {
        setCurrentStep(4);
      } else {
        setCurrentStep(5);
      }
    } else if (currentStep === 4) {
      if (selectedLensType?.requiresPrescription) {
        if (prescriptionMode === 'none' || !prescription) {
          setValidationError('Please enter or upload a valid prescription before continuing.');
          return;
        }
      }
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (currentStep === 5 && !selectedLensType?.requiresPrescription) {
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    }
  };

  // Final Server-Side Validation and Add to Cart
  const handleAddToCart = async () => {
    setValidationError(null);
    setIsValidating(true);

    const configPayload = {
      productId: selectedProduct.id,
      lensTypeId: selectedLensType?.id || '',
      materialId: selectedMaterial?.id,
      coatingIds: selectedCoatingIds,
      prescription,
      prescriptionMode,
    };

    try {
      const res = await fetch('/api/configuration/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setValidationError(data.error || 'Configuration validation failed. Please check your selections.');
        setIsValidating(false);
        return;
      }

      const serverConfig: ProductConfiguration = data.configuration || {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        frameSku: selectedProduct.sku,
        framePrice: selectedProduct.price,
        frameColor: selectedProduct.frame.color,
        frameSize: selectedProduct.frame.size,
        frameImage: selectedProduct.images[0],
        lensTypeId: selectedLensType?.id || '',
        lensTypeName: selectedLensType?.name || '',
        lensTypeBasePrice: selectedLensType?.basePrice || 0,
        requiresPrescription: !!selectedLensType?.requiresPrescription,
        materialId: selectedMaterial?.id,
        materialName: selectedMaterial?.name,
        materialPrice: selectedMaterial?.additionalPrice || 0,
        coatingIds: selectedCoatingIds,
        coatingNames: selectedCoatingIds
          .map((id) => coatings.find((c) => c.id === id)?.name)
          .filter(Boolean) as string[],
        coatingsTotalPrice: coatingsPrice,
        prescription,
        prescriptionMode,
        calculatedTotalPrice: totalCalculatedPrice,
      };

      if (editingCartItem) {
        const success = await updateCartItemConfiguration(editingCartItem.id, serverConfig);
        if (success) {
          closeConfigurator();
        }
      } else {
        const success = await addToCart(serverConfig);
        if (success) {
          closeConfigurator();
        }
      }
    } catch (err) {
      // Fallback local validation if server offline
      if (selectedLensType?.requiresPrescription && !prescription) {
        setValidationError('Prescription is required for this lens option.');
        setIsValidating(false);
        return;
      }

      const fallbackConfig: ProductConfiguration = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        frameSku: selectedProduct.sku,
        framePrice: selectedProduct.price,
        frameColor: selectedProduct.frame.color,
        frameSize: selectedProduct.frame.size,
        frameImage: selectedProduct.images[0],
        lensTypeId: selectedLensType?.id || '',
        lensTypeName: selectedLensType?.name || '',
        lensTypeBasePrice: selectedLensType?.basePrice || 0,
        requiresPrescription: !!selectedLensType?.requiresPrescription,
        materialId: selectedMaterial?.id,
        materialName: selectedMaterial?.name,
        materialPrice: selectedMaterial?.additionalPrice || 0,
        coatingIds: selectedCoatingIds,
        coatingNames: selectedCoatingIds
          .map((id) => coatings.find((c) => c.id === id)?.name)
          .filter(Boolean) as string[],
        coatingsTotalPrice: coatingsPrice,
        prescription,
        prescriptionMode,
        calculatedTotalPrice: totalCalculatedPrice,
      };

      if (editingCartItem) {
        await updateCartItemConfiguration(editingCartItem.id, fallbackConfig);
      } else {
        await addToCart(fallbackConfig);
      }
      closeConfigurator();
    } finally {
      setIsValidating(false);
    }
  };

  const isProgressive = selectedLensType?.name.toLowerCase().includes('progressive');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-xs shrink-0">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-lg text-white">Custom Spectacles Engine</h3>
              <p className="text-[11px] sm:text-xs text-amber-400 font-medium line-clamp-1">
                Frame: {selectedProduct.name} ({selectedProduct.frame.color}) — SKU: {selectedProduct.sku}
              </p>
            </div>
          </div>
          <button
            onClick={closeConfigurator}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Dynamic Progress Step Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between text-xs font-bold text-slate-500 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors ${
              currentStep === 1 ? 'text-amber-600 font-extrabold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep >= 1 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span>Lens Type</span>
          </button>

          <span className="text-slate-300">→</span>

          <button
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors ${
              currentStep === 2 ? 'text-amber-600 font-extrabold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep >= 2 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span>Material</span>
          </button>

          <span className="text-slate-300">→</span>

          <button
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors ${
              currentStep === 3 ? 'text-amber-600 font-extrabold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep >= 3 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span>Coatings</span>
          </button>

          {selectedLensType?.requiresPrescription && (
            <>
              <span className="text-slate-300">→</span>
              <button
                onClick={() => setCurrentStep(4)}
                className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors ${
                  currentStep === 4 ? 'text-amber-600 font-extrabold' : ''
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep >= 4 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  4
                </span>
                <span>Prescription</span>
              </button>
            </>
          )}

          <span className="text-slate-300">→</span>

          <button
            onClick={() => setCurrentStep(5)}
            className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors ${
              currentStep === 5 ? 'text-amber-600 font-extrabold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 5 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
              }`}
            >
              5
            </span>
            <span>Review</span>
          </button>
        </div>

        {/* Modal Main Body Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-3">
          {/* Left / Center 2 Columns: Active Step Form */}
          <div className="lg:col-span-2 p-4 sm:p-6 overflow-y-auto space-y-6 min-h-0 lg:max-h-full">
            {validationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP 1: LENS TYPE */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">Step 1: Choose Your Lens Type</h4>
                  <p className="text-xs text-slate-500">
                    Select how you plan to use these spectacles. Compatible options are filtered automatically for frame "{selectedProduct.name}".
                  </p>
                </div>

                <div className="space-y-3">
                  {compatibleLensTypes.map((lt) => {
                    const isSelected = selectedLensTypeId === lt.id;
                    return (
                      <div
                        key={lt.id}
                        onClick={() => setSelectedLensTypeId(lt.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1 pr-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {lt.name}
                            {lt.requiresPrescription ? (
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                Power Rx Required
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                                Zero Power
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{lt.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {lt.basePrice === 0 ? 'FREE' : `+₹${lt.basePrice}`}
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-amber-600 ml-auto mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: LENS MATERIAL */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">Step 2: Choose Lens Material</h4>
                  <p className="text-xs text-slate-500">
                    Select material density. High index materials are thinner and lightweight for strong prescriptions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {compatibleMaterials.map((m) => {
                    const isSelected = selectedMaterialId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMaterialId(m.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                            <span className="text-[10px] font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                              Index {m.indexRating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>
                        </div>
                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {m.additionalPrice === 0 ? 'Included (₹0)' : `+₹${m.additionalPrice}`}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: LENS COATINGS */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">Step 3: Select Protective Coatings</h4>
                  <p className="text-xs text-slate-500">
                    Combine multiple protective coatings to reduce eye strain, digital screen glare, and scratch marks.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {compatibleCoatings.map((c) => {
                    const isSelected = selectedCoatingIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCoating(c.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-0.5 pr-4">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            {c.name}
                            {c.isBlueCut && (
                              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                                Blue Cut / Screen Safe
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {c.isBlueCut
                              ? 'Helps filter selected portions of blue-violet light from digital screens.'
                              : c.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900 text-xs">
                            {c.additionalPrice === 0 ? 'FREE' : `+₹${c.additionalPrice}`}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-amber-600 mt-1 w-4 h-4"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: PRESCRIPTION ENTRY */}
            {currentStep === 4 && selectedLensType?.requiresPrescription && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">Step 4: Enter Your Prescription</h4>
                  <p className="text-xs text-slate-500">
                    Input your optometrist prescription, pick a saved profile, or upload a prescription slip.
                  </p>
                </div>

                <PrescriptionForm
                  initialPrescription={prescription}
                  requiresPrescription={true}
                  isProgressiveLens={isProgressive}
                  onPrescriptionChange={(rx, mode) => {
                    setPrescription(rx);
                    setPrescriptionMode(mode);
                  }}
                />
              </div>
            )}

            {/* STEP 5: FINAL REVIEW STEP */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">Step 5: Review Your Glasses</h4>
                  <p className="text-xs text-slate-500">Confirm all custom selections before adding to your cart.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-contain bg-white rounded-xl border p-2"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-600 uppercase">{selectedProduct.brand}</div>
                      <h3 className="font-extrabold text-slate-900 text-base">{selectedProduct.name}</h3>
                      <div className="text-xs text-slate-500">Color: {selectedProduct.frame.color} | Size: {selectedProduct.frame.size}</div>
                    </div>
                  </div>

                  {/* Complete Breakdown Table */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Frame Price</span>
                      <span className="font-bold text-slate-900">₹{framePrice.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Lens Type ({selectedLensType?.name})</span>
                      <span className="font-bold text-slate-900">
                        {lensBasePrice === 0 ? 'FREE (₹0)' : `₹${lensBasePrice}`}
                      </span>
                    </div>

                    {selectedMaterial && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">
                          Material ({selectedMaterial.name} Index {selectedMaterial.indexRating})
                        </span>
                        <span className="font-bold text-slate-900">
                          {materialPrice === 0 ? 'Included (₹0)' : `₹${materialPrice}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">
                        Coatings ({selectedCoatingIds.length} Selected)
                      </span>
                      <span className="font-bold text-slate-900">₹{coatingsPrice}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> Delivery Fee
                      </span>
                      <span>FREE DELIVERY</span>
                    </div>

                    <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
                      <span>Grand Total</span>
                      <span className="text-amber-600">₹{totalCalculatedPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {selectedLensType?.requiresPrescription && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Prescription {prescriptionMode === 'upload' ? 'Slip Uploaded' : 'Details Added'}</span>
                      </div>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="text-emerald-700 underline text-[11px]"
                      >
                        Edit Rx
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Persistent Live Summary Card */}
          <div className="bg-slate-900 text-white p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between space-y-6 overflow-y-auto min-h-0 shrink-0 lg:shrink lg:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  YOUR GLASSES SUMMARY
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Live Quote</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Frame Item */}
                <div className="flex items-start justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <div className="font-bold text-white">{selectedProduct.name}</div>
                    <div className="text-[11px] text-slate-400">Frame ({selectedProduct.frame.color})</div>
                  </div>
                  <div className="font-bold text-amber-400">₹{framePrice}</div>
                </div>

                {/* Lens Type Item */}
                <div className="flex items-start justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <div className="font-bold text-white">{selectedLensType?.name || 'Not Selected'}</div>
                    <div className="text-[11px] text-slate-400">Lens Type</div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-amber-400 hover:underline text-[10px] flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Material Item */}
                <div className="flex items-start justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <div className="font-bold text-white">{selectedMaterial?.name || 'Standard'}</div>
                    <div className="text-[11px] text-slate-400">Material</div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-amber-400 hover:underline text-[10px] flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Coatings Summary */}
                <div className="flex items-start justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <div className="font-bold text-white">{selectedCoatingIds.length} Protective Coatings</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {selectedCoatingIds
                        .map((id) => coatings.find((c) => c.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-amber-400 hover:underline text-[10px] flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Prescription Summary */}
                {selectedLensType?.requiresPrescription && (
                  <div className="flex items-start justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <div>
                      <div className="font-bold text-white">
                        {prescription ? 'Prescription Added' : 'Prescription Required'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {prescriptionMode === 'upload' ? 'Uploaded Slip' : `PD: ${prescription?.pd || 63}mm`}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="text-amber-400 hover:underline text-[10px] flex items-center gap-0.5"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Free Delivery Promise */}
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Truck className="w-4 h-4 shrink-0" />
                <span>FREE EXPRESS DELIVERY INCLUDED</span>
              </div>
            </div>

            {/* Footer Buttons in Right Panel */}
            <div className="space-y-3 pt-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400 font-bold uppercase">TOTAL</span>
                <span className="text-2xl font-black text-amber-400">
                  ₹{totalCalculatedPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isValidating}
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {isValidating ? (
                      'Validating Specs...'
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> Add Custom Glasses to Cart
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
