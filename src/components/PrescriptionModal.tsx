/**
 * OptiCraft Eyewear - Secure Prescription Viewing Modal
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Eye, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const PrescriptionModal: React.FC = () => {
  const { viewingPrescription, setViewingPrescription } = useApp();

  if (!viewingPrescription) return null;

  const rx = viewingPrescription;

  const formatSph = (val?: number) => {
    if (val === undefined || val === null) return '0.00';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const formatCyl = (val?: number) => {
    if (val === undefined || val === null || val === 0) return '0.00';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Prescription Details</h3>
              <p className="text-xs text-amber-400 font-medium">{rx.title || 'Configured Prescription'}</p>
            </div>
          </div>
          <button
            onClick={() => setViewingPrescription(null)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">Optician Verification Status</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                rx.verificationStatus === 'Verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : rx.verificationStatus === 'Rejected / Requires Clarification'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {rx.verificationStatus === 'Verified' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              )}
              {rx.verificationStatus}
            </span>
          </div>

          {/* Ocular Prescription Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Refractive Values (Diopters)
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Eye</th>
                    <th className="py-2.5 px-3 text-center">SPH</th>
                    <th className="py-2.5 px-3 text-center">CYL</th>
                    <th className="py-2.5 px-3 text-center">Axis</th>
                    <th className="py-2.5 px-3 text-center">ADD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  <tr className="bg-white">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> OD (Right)
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {formatSph(rx.odRight?.sph)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{formatCyl(rx.odRight?.cyl)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {rx.odRight?.axis ? `${rx.odRight.axis}°` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700">
                      {rx.odRight?.add ? `+${rx.odRight.add.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> OS (Left)
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {formatSph(rx.osLeft?.sph)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{formatCyl(rx.osLeft?.cyl)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {rx.osLeft?.axis ? `${rx.osLeft.axis}°` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700">
                      {rx.osLeft?.add ? `+${rx.osLeft.add.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pupillary Distance (PD) */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs">
            <span className="font-bold text-amber-950">Pupillary Distance (PD)</span>
            <span className="font-extrabold font-mono text-amber-900 text-sm">{rx.pd || 63} mm</span>
          </div>

          {/* Uploaded File Slip Reference if present */}
          {rx.uploadedFilePath && (
            <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {rx.uploadedFilePath.split('/').pop() || 'Prescription Slip Uploaded'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2 py-0.5 bg-white rounded border border-slate-200">
                {rx.uploadedFileType || 'Verified Slip'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setViewingPrescription(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Prescription View
          </button>
        </div>
      </div>
    </div>
  );
};
