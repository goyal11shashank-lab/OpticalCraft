/**
 * OptiCraft Eyewear - Prescription Entry, Upload & Saved Profiles Component
 * Complete Phase 3 Production Experience
 */

import React, { useState, useEffect } from 'react';
import { Prescription, EyePrescriptionValues } from '../types';
import { useApp } from '../context/AppContext';
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  Trash2,
  Sparkles,
  UserCheck,
  Info,
  HelpCircle,
  Eye,
  X,
  Plus,
  Minus,
  Save,
} from 'lucide-react';

interface PrescriptionFormProps {
  initialPrescription?: Prescription;
  onPrescriptionChange: (rx: Prescription | undefined, mode: 'manual' | 'upload' | 'both' | 'none') => void;
  requiresPrescription: boolean;
  isProgressiveLens?: boolean;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  initialPrescription,
  onPrescriptionChange,
  requiresPrescription,
  isProgressiveLens = false,
}) => {
  const { savedPrescriptions, addPrescription } = useApp();

  const [mode, setMode] = useState<'manual' | 'upload' | 'saved'>(
    savedPrescriptions.length > 0 ? 'saved' : 'manual'
  );

  // Active Tooltip Info Modal State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Manual Rx Values
  const [odRight, setOdRight] = useState<EyePrescriptionValues>(
    initialPrescription?.odRight || { sph: -1.0, cyl: 0, axis: 90, add: isProgressiveLens ? 1.5 : 0 }
  );
  const [osLeft, setOsLeft] = useState<EyePrescriptionValues>(
    initialPrescription?.osLeft || { sph: -1.0, cyl: 0, axis: 90, add: isProgressiveLens ? 1.5 : 0 }
  );
  const [pd, setPd] = useState<number>(initialPrescription?.pd || 63);

  // Upload Rx state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    initialPrescription?.uploadedFilePath || null
  );
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    initialPrescription?.uploadedFilePath || null
  );

  // Saved Rx Selection
  const [selectedSavedRxId, setSelectedSavedRxId] = useState<string>(
    savedPrescriptions[0]?.id || ''
  );

  // Save new Rx state
  const [saveToProfile, setSaveToProfile] = useState<boolean>(false);
  const [rxProfileTitle, setRxProfileTitle] = useState<string>('My Prescribed Glasses');

  // Error Messages Map
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Generate range for SPH dropdown (-15.00 to +15.00 in 0.25 steps)
  const generateSphOptions = () => {
    const options = [];
    for (let i = -15.0; i <= 15.0; i += 0.25) {
      options.push(Number(i.toFixed(2)));
    }
    return options;
  };

  const sphValues = generateSphOptions();

  // Validate and sync with parent
  const validateAndEmit = (
    currentMode = mode,
    right = odRight,
    left = osLeft,
    currentPd = pd,
    fileName = uploadedFileName
  ) => {
    const errs: { [key: string]: string } = {};

    if (currentMode === 'manual' || currentMode === 'saved') {
      if (right.sph === undefined || isNaN(right.sph)) {
        errs.odSph = 'Please enter the right-eye SPH.';
      }
      if (left.sph === undefined || isNaN(left.sph)) {
        errs.osSph = 'Please enter the left-eye SPH.';
      }

      if (right.axis !== undefined && (right.axis < 0 || right.axis > 180)) {
        errs.odAxis = 'Please enter a valid axis between 0 and 180 for Right Eye.';
      }
      if (left.axis !== undefined && (left.axis < 0 || left.axis > 180)) {
        errs.osAxis = 'Please enter a valid axis between 0 and 180 for Left Eye.';
      }

      if (isProgressiveLens) {
        if (!right.add || right.add <= 0) {
          errs.odAdd = 'ADD power is required for Progressive lenses on Right Eye.';
        }
        if (!left.add || left.add <= 0) {
          errs.osAdd = 'ADD power is required for Progressive lenses on Left Eye.';
        }
      }

      if (!currentPd || currentPd < 45 || currentPd > 75) {
        errs.pd = 'Please enter your PD (Pupillary Distance between 45mm and 75mm).';
      }
    }

    if (currentMode === 'upload' && !fileName) {
      errs.upload = 'Please upload a prescription image or PDF document.';
    }

    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      if (currentMode === 'saved') {
        const found = savedPrescriptions.find((s) => s.id === selectedSavedRxId);
        if (found) {
          onPrescriptionChange(found, 'manual');
        }
      } else if (currentMode === 'manual') {
        const customRx: Prescription = {
          id: `rx-${Date.now()}`,
          odRight: right,
          osLeft: left,
          pd: currentPd,
          verificationStatus: 'Pending Verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (saveToProfile && rxProfileTitle.trim()) {
          addPrescription({
            title: rxProfileTitle.trim(),
            odRight: right,
            osLeft: left,
            pd: currentPd,
          });
        }

        onPrescriptionChange(customRx, 'manual');
      } else if (currentMode === 'upload') {
        const customRx: Prescription = {
          id: `rx-up-${Date.now()}`,
          odRight: { sph: 0 },
          osLeft: { sph: 0 },
          pd: 63,
          uploadedFilePath: fileName || undefined,
          uploadedFileType: fileName?.endsWith('.pdf') ? 'pdf' : 'jpg',
          verificationStatus: 'Pending Verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onPrescriptionChange(customRx, 'upload');
      }
    } else {
      onPrescriptionChange(undefined, 'none');
    }
  };

  useEffect(() => {
    validateAndEmit();
  }, [mode, selectedSavedRxId]);

  // Handle Mock File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setUploadedPreviewUrl(url);
      } else {
        setUploadedPreviewUrl(null);
      }
      validateAndEmit('upload', odRight, osLeft, pd, file.name);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
    setUploadedPreviewUrl(null);
    validateAndEmit('upload', odRight, osLeft, pd, null);
  };

  // Utility to step numeric values up or down
  const adjustValue = (
    eye: 'OD' | 'OS',
    field: 'sph' | 'cyl' | 'axis' | 'add',
    delta: number
  ) => {
    if (eye === 'OD') {
      const currentVal = odRight[field] || 0;
      let newVal = Number((currentVal + delta).toFixed(2));
      if (field === 'axis') {
        newVal = Math.max(0, Math.min(180, Math.round(newVal)));
      }
      const updated = { ...odRight, [field]: newVal };
      setOdRight(updated);
      validateAndEmit(mode, updated, osLeft, pd, uploadedFileName);
    } else {
      const currentVal = osLeft[field] || 0;
      let newVal = Number((currentVal + delta).toFixed(2));
      if (field === 'axis') {
        newVal = Math.max(0, Math.min(180, Math.round(newVal)));
      }
      const updated = { ...osLeft, [field]: newVal };
      setOsLeft(updated);
      validateAndEmit(mode, odRight, updated, pd, uploadedFileName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progressive Lens Informational Banner */}
      {isProgressiveLens && (
        <div className="bg-amber-50 border border-amber-200/90 p-4 rounded-2xl space-y-2 text-amber-950 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-extrabold text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Progressive Multi-Focal Lens Guide</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            "One lens designed to provide seamless vision correction across multiple viewing distances."
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] font-bold">
            <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
              <div className="text-amber-800">1. DISTANCE</div>
              <div className="text-slate-500 font-normal">Driving & TV</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
              <div className="text-amber-800">2. INTERMEDIATE</div>
              <div className="text-slate-500 font-normal">Computer Screen</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
              <div className="text-amber-800">3. NEAR (ADD)</div>
              <div className="text-slate-500 font-normal">Reading & Mobile</div>
            </div>
          </div>
          <p className="text-[10px] text-amber-700 font-medium">
            *Please ensure your optician prescription includes the <strong>ADD</strong> power value.
          </p>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {savedPrescriptions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMode('saved');
              validateAndEmit('saved', odRight, osLeft, pd, uploadedFileName);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'saved'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Saved Profiles
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setMode('manual');
            validateAndEmit('manual', odRight, osLeft, pd, uploadedFileName);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'manual'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Enter Values
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('upload');
            validateAndEmit('upload', odRight, osLeft, pd, uploadedFileName);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'upload'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Slip
        </button>
      </div>

      {/* MODE 1: SAVED PRESCRIPTIONS CHOICE */}
      {mode === 'saved' && (
        <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" /> Select Saved Profile Prescription
            </span>
            <span className="text-[10px] text-slate-400 font-medium">({savedPrescriptions.length} Profiles Available)</span>
          </label>
          <div className="space-y-2">
            {savedPrescriptions.map((rx) => {
              const isSelected = selectedSavedRxId === rx.id;
              return (
                <div
                  key={rx.id}
                  onClick={() => {
                    setSelectedSavedRxId(rx.id);
                    onPrescriptionChange(rx, 'manual');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      {rx.title || 'Saved Prescription'}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        {rx.verificationStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      OD: {rx.odRight.sph > 0 ? `+${rx.odRight.sph}` : rx.odRight.sph} SPH | OS: {rx.osLeft.sph > 0 ? `+${rx.osLeft.sph}` : rx.osLeft.sph} SPH | PD: {rx.pd}mm
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="savedRx"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-amber-600 w-4 h-4"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: MANUAL PRESCRIPTION VALUES */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
            {/* RIGHT EYE / OD */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    RIGHT EYE / OD
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Oculus Dexter</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* SPH Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      SPH
                      <button
                        type="button"
                        onClick={() => setActiveTooltip('sph')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustValue('OD', 'sph', -0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <select
                      value={odRight.sph}
                      onChange={(e) => {
                        const updated = { ...odRight, sph: parseFloat(e.target.value) };
                        setOdRight(updated);
                        validateAndEmit(mode, updated, osLeft, pd, uploadedFileName);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1 text-xs font-bold text-slate-900 text-center"
                    >
                      {sphValues.map((v) => (
                        <option key={`od-sph-${v}`} value={v}>
                          {v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => adjustValue('OD', 'sph', 0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* CYL Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      CYL
                      <button
                        type="button"
                        onClick={() => setActiveTooltip('cyl')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustValue('OD', 'cyl', -0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <select
                      value={odRight.cyl || 0}
                      onChange={(e) => {
                        const updated = { ...odRight, cyl: parseFloat(e.target.value) };
                        setOdRight(updated);
                        validateAndEmit(mode, updated, osLeft, pd, uploadedFileName);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1 text-xs font-bold text-slate-900 text-center"
                    >
                      {[-4, -3.75, -3.5, -3.25, -3, -2.75, -2.5, -2.25, -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(
                        (v) => (
                          <option key={`od-cyl-${v}`} value={v}>
                            {v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => adjustValue('OD', 'cyl', 0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Axis Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      Axis (0-180°)
                      <button
                        type="button"
                        onClick={() => setActiveTooltip('axis')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={odRight.axis || 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...odRight, axis: v };
                      setOdRight(updated);
                      validateAndEmit(mode, updated, osLeft, pd, uploadedFileName);
                    }}
                    placeholder="90"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-slate-900 text-center"
                  />
                </div>

                {/* ADD Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      ADD Near
                      <button
                        type="button"
                        onClick={() => setActiveTooltip('add')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <input
                    type="number"
                    step={0.25}
                    min={0}
                    max={4}
                    value={odRight.add || 0}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      const updated = { ...odRight, add: v };
                      setOdRight(updated);
                      validateAndEmit(mode, updated, osLeft, pd, uploadedFileName);
                    }}
                    placeholder="+1.50"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-slate-900 text-center"
                  />
                </div>
              </div>
            </div>

            {/* LEFT EYE / OS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    LEFT EYE / OS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Oculus Sinister</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* SPH Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>SPH</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustValue('OS', 'sph', -0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <select
                      value={osLeft.sph}
                      onChange={(e) => {
                        const updated = { ...osLeft, sph: parseFloat(e.target.value) };
                        setOsLeft(updated);
                        validateAndEmit(mode, odRight, updated, pd, uploadedFileName);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1 text-xs font-bold text-slate-900 text-center"
                    >
                      {sphValues.map((v) => (
                        <option key={`os-sph-${v}`} value={v}>
                          {v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => adjustValue('OS', 'sph', 0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* CYL Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>CYL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustValue('OS', 'cyl', -0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <select
                      value={osLeft.cyl || 0}
                      onChange={(e) => {
                        const updated = { ...osLeft, cyl: parseFloat(e.target.value) };
                        setOsLeft(updated);
                        validateAndEmit(mode, odRight, updated, pd, uploadedFileName);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1 text-xs font-bold text-slate-900 text-center"
                    >
                      {[-4, -3.75, -3.5, -3.25, -3, -2.75, -2.5, -2.25, -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(
                        (v) => (
                          <option key={`os-cyl-${v}`} value={v}>
                            {v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => adjustValue('OS', 'cyl', 0.25)}
                      className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Axis Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>Axis (0-180°)</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={osLeft.axis || 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      const updated = { ...osLeft, axis: v };
                      setOsLeft(updated);
                      validateAndEmit(mode, odRight, updated, pd, uploadedFileName);
                    }}
                    placeholder="90"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-slate-900 text-center"
                  />
                </div>

                {/* ADD Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>ADD Near</span>
                  </div>
                  <input
                    type="number"
                    step={0.25}
                    min={0}
                    max={4}
                    value={osLeft.add || 0}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      const updated = { ...osLeft, add: v };
                      setOsLeft(updated);
                      validateAndEmit(mode, odRight, updated, pd, uploadedFileName);
                    }}
                    placeholder="+1.50"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-slate-900 text-center"
                  />
                </div>
              </div>
            </div>

            {/* PUPILLARY DISTANCE (PD) */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-900 flex items-center gap-1.5">
                  Pupillary Distance (PD)
                  <button
                    type="button"
                    onClick={() => setActiveTooltip('pd')}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 font-black">
                  {pd} mm
                </span>
              </div>
              <input
                type="range"
                min={45}
                max={75}
                value={pd}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPd(val);
                  validateAndEmit(mode, odRight, osLeft, val, uploadedFileName);
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Narrow (45mm)</span>
                <span>Standard Adult (63mm)</span>
                <span>Wide (75mm)</span>
              </div>
            </div>

            {/* Save to profile checkbox */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <Save className="w-3.5 h-3.5 text-amber-600" /> Save this prescription to my account profile for future orders
              </label>

              {saveToProfile && (
                <input
                  type="text"
                  placeholder="e.g., My Office Glasses Rx"
                  value={rxProfileTitle}
                  onChange={(e) => setRxProfileTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-900"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: UPLOAD PRESCRIPTION SLIP */}
      {mode === 'upload' && (
        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Upload Optician Prescription Slip</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a clear photo or PDF document of your doctor's prescription slip (JPG, PNG, PDF up to 10MB).
            </p>
          </div>

          {!uploadedFileName ? (
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all">
              <Upload className="w-4 h-4" /> Browse Prescription File
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-left shadow-xs">
              <div className="flex items-center gap-3">
                {uploadedPreviewUrl ? (
                  <img src={uploadedPreviewUrl} alt="Rx Slip" className="w-12 h-12 object-cover rounded-xl border" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                    PDF
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900 truncate max-w-[180px]">{uploadedFileName}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready for Optician Verification
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Error Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
          {Object.values(errors).map((err, i) => (
            <div key={i} className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" /> {err}
            </div>
          ))}
        </div>
      )}

      {/* Tooltip Help Modal / Popover */}
      {activeTooltip && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setActiveTooltip(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            {activeTooltip === 'sph' && (
              <>
                <h4 className="font-extrabold text-slate-900 text-sm">SPH (Sphere Power)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indicates the amount of lens power needed to correct nearsightedness (-) or farsightedness (+).
                  Measured in diopters.
                </p>
              </>
            )}

            {activeTooltip === 'cyl' && (
              <>
                <h4 className="font-extrabold text-slate-900 text-sm">CYL (Cylinder Power)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indicates the lens power needed for astigmatism (an irregularly shaped cornea). Leave as 0 if not listed on your slip.
                </p>
              </>
            )}

            {activeTooltip === 'axis' && (
              <>
                <h4 className="font-extrabold text-slate-900 text-sm">Axis (0° to 180°)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Describes the angle and direction of astigmatism correction on the lens, ranging from 0 to 180 degrees.
                </p>
              </>
            )}

            {activeTooltip === 'add' && (
              <>
                <h4 className="font-extrabold text-slate-900 text-sm">ADD Power (Near Magnification)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Additional magnifying power added to the lower portion of progressive or multi-focal lenses to assist reading and close-up work.
                </p>
              </>
            )}

            {activeTooltip === 'pd' && (
              <>
                <h4 className="font-extrabold text-slate-900 text-sm">PD (Pupillary Distance)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The distance in millimeters between the centers of your two pupils. Ensures optical centers align perfectly over your line of sight. Average adult PD is 63mm.
                </p>
              </>
            )}

            <button
              onClick={() => setActiveTooltip(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl mt-2"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
