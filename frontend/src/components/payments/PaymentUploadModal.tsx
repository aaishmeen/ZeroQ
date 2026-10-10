import React, { useState } from 'react';
import type { EventItem } from '../../types';
import { uploadPaymentApi } from '../../api/payments';
import { getFileUrl } from '../../api/events';
import { X, UploadCloud, CheckCircle2, QrCode, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../common/ToastContainer';

import { RealisticScannerView } from '../common/RealisticScannerView';

interface PaymentUploadModalProps {
  isOpen: boolean;
  registrationId: number | null;
  event: EventItem | null;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

export const PaymentUploadModal: React.FC<PaymentUploadModalProps> = ({
  isOpen,
  registrationId,
  event,
  onClose,
  onPaymentSubmitted,
}) => {
  const { showToast } = useToast();
  const [transactionId, setTransactionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !event || !registrationId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg('Please select a payment screenshot image or PDF.');
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadPaymentApi(registrationId, selectedFile, transactionId || undefined);
      showToast('Payment proof uploaded successfully!', 'success');
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSubmitted();
        onClose();
        setIsSuccess(false);
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to upload payment proof.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="relative w-full max-w-3xl bg-white rounded border border-[#CBE6C8] p-6 shadow-lg max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#6B8B74] hover:text-[#0F2417] hover:bg-[#E5F5E0] rounded transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <div className="max-w-xs mx-auto mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Register
            </span>
            <span className="h-0.5 w-6 bg-[#1D4ED8]" />
            <span className="flex items-center gap-1 font-bold">
              <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Pay & Upload
            </span>
            <span className="h-0.5 w-6 bg-slate-200" />
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center text-[10px]">3</span>
              Pass
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">Payment Submitted</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Your transaction proof has been submitted. Your QR ticket will activate upon organizer approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0F172A] line-clamp-1">{event.title}</h4>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#1D4ED8] px-2 py-0.5 rounded-full border border-blue-200">
                    {event.date}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Amount Due</span>
                  <span className="text-xl font-extrabold text-[#1D4ED8]">₹{event.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  Organizer Payment QR
                </h5>

                <div className="text-center space-y-1.5 flex flex-col items-center">
                  {event.payment_qr_url ? (
                    <div className="w-32 h-32 bg-[#F8FAFC] rounded-xl p-2 border border-slate-200 mx-auto flex items-center justify-center overflow-hidden">
                      <img src={getFileUrl(event.payment_qr_url)} alt="Payment QR" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <RealisticScannerView size={128} label="UPI PAYMENT QR" />
                  )}
                  {!event.payment_qr_url && (
                    <span className="text-[11px] font-mono font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-block">
                      UPI ID: zeroq@sbi
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Upload Payment Proof</h3>
                <p className="text-xs text-slate-500">
                  Submit transaction receipt screenshot to verify your registration.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Transaction Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TXN-487562431"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Payment Screenshot (PNG, JPG, PDF)
                  </label>

                  <div className="relative border border-dashed border-blue-300 bg-[#F8FAFC] rounded-2xl p-4 text-center cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {filePreview ? (
                      <div className="space-y-1.5">
                        <img
                          src={filePreview}
                          alt="Payment Preview"
                          className="h-28 mx-auto rounded-xl object-cover border border-slate-200"
                        />
                        <p className="text-xs font-bold text-[#1D4ED8]">{selectedFile?.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-6 h-6 text-[#1D4ED8] mx-auto" />
                        <p className="text-xs font-bold text-[#0F172A]">Click to select screenshot</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG, PDF (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white py-2.5 rounded-full font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md hover:shadow-orange-500/20"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit for Verification
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
