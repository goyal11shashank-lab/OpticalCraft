/**
 * OptiCraft Eyewear - Frame Measurement & Size Guide Modal
 */

import React from 'react';
import { X, Ruler, Glasses, Check, Info } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">OptiCraft Eyewear Size Guide</h3>
              <p className="text-xs text-amber-400 font-medium">Find your perfect fitting spectacle frame</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-600 max-h-[80vh] overflow-y-auto">
          {/* Visual Diagram */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-lg font-black text-slate-900">135-139 mm</div>
                <div className="text-[10px] text-amber-600 font-bold uppercase">Small Fit</div>
              </div>
              <div className="text-slate-300 font-bold text-lg">•</div>
              <div className="text-center">
                <div className="text-lg font-black text-slate-900">140-144 mm</div>
                <div className="text-[10px] text-amber-600 font-bold uppercase">Medium Fit (Standard)</div>
              </div>
              <div className="text-slate-300 font-bold text-lg">•</div>
              <div className="text-center">
                <div className="text-lg font-black text-slate-900">145-150 mm</div>
                <div className="text-[10px] text-amber-600 font-bold uppercase">Wide Fit</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              *Check the 3 digits printed inside your existing pair's left temple arm (e.g. 52-18-142).
            </p>
          </div>

          {/* Explanation of 3 Key Measurements */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Glasses className="w-4 h-4 text-amber-600" /> Understanding Frame Specs
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900">1. Frame Width</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Total horizontal width from left hinge to right hinge across your face.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900">2. Bridge Width</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The distance over the bridge of your nose between the two lenses (16-20 mm).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900">3. Temple Length</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The length of the arm extending behind your ear (typically 140-145 mm).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Fit Recommendations */}
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl space-y-2">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" /> Which size should I pick?
            </div>
            <ul className="space-y-1.5 text-[11px] text-amber-900 list-disc list-inside">
              <li><strong>Medium (138-142 mm)</strong> fits 85% of Indian adults comfortably.</li>
              <li>If you have a narrower face or delicate features, choose <strong>Small (130-137 mm)</strong>.</li>
              <li>If standard sunglasses feel tight on your temples, choose <strong>Large / Wide (143-150 mm)</strong>.</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
