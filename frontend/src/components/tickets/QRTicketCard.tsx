import React, { useEffect, useState } from 'react';
import type { Registration, EventItem, User } from '../../types';
import { fetchRegistrationQRBlob } from '../../api/registrations';
import { ZeroQLogo } from '../common/ZeroQLogo';
import { Calendar, MapPin, CheckCircle2, QrCode, User as UserIcon } from 'lucide-react';

interface QRTicketCardProps {
  registration: Registration;
  event: EventItem;
  user: User;
}

export const QRTicketCard: React.FC<QRTicketCardProps> = ({
  registration,
  event,
  user,
}) => {
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setIsLoadingQr(true);
    setQrError(null);

    fetchRegistrationQRBlob(registration.id)
      .then((url) => {
        if (active) {
          createdUrl = url;
          setQrBlobUrl(url);
          setIsLoadingQr(false);
        }
      })
      .catch(async (err) => {
        if (active) {
          console.error('Failed to fetch QR blob:', err);
          let msg = 'QR Pass unavailable. Payment must be approved first.';
          if (err.response?.data instanceof Blob) {
            try {
              const text = await err.response.data.text();
              const json = JSON.parse(text);
              if (json.detail) msg = json.detail;
            } catch {
              // fallback to default msg
            }
          } else if (err.response?.data?.detail) {
            msg = err.response.data.detail;
          }
          setQrError(msg);
          setIsLoadingQr(false);
        }
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [registration.id]);

  return (
    <div className="w-full max-w-sm mx-auto bg-[#0B132B] rounded-2xl border border-[#1E3A8A]/50 shadow-xl overflow-hidden text-white relative">
      {/* Background Subtle Glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FF5E36]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md relative z-10">
        <ZeroQLogo size="sm" showText={true} />
        <span className="px-2.5 py-0.5 bg-[#FF5E36]/20 text-[#FF5E36] font-bold text-[10px] tracking-wider uppercase rounded-full border border-[#FF5E36]/40">
          DIGITAL PASS
        </span>
      </div>

      {/* Ticket Body Content */}
      <div className="p-5 space-y-4 relative z-10">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight font-sans">
            {event.title}
          </h3>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{event.date}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="line-clamp-1 max-w-[120px]">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Registration Bar */}
        <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-semibold text-white line-clamp-1">{user.name}</span>
          </div>
          <span className="font-mono font-bold text-[#06B6D4] text-[11px]">
            #TQ-{registration.id.toString().padStart(4, '0')}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center space-y-3">
          <div className="w-44 h-44 bg-white rounded-xl p-2 mx-auto border border-white/20 flex items-center justify-center relative overflow-hidden shadow-inner">
            {isLoadingQr && (
              <div className="space-y-1.5 text-center">
                <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-[10px] font-bold text-[#0F172A]">Loading Pass...</span>
              </div>
            )}

            {qrError && (
              <div className="p-2 text-center space-y-1">
                <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-[11px] font-semibold text-amber-700">{qrError}</p>
              </div>
            )}

            {!isLoadingQr && !qrError && qrBlobUrl && (
              <img
                src={qrBlobUrl}
                alt="ZeroQ Ticket QR Code"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="bg-[#1D4ED8]/20 border border-[#1D4ED8]/40 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span className="text-xs font-bold tracking-wider text-[#38BDF8] uppercase">
              ACTIVE ENTRY PASS
            </span>
          </div>

          <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-wider">
            Sub-second gate check-in
          </p>
        </div>
      </div>
    </div>
  );
};
