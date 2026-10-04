import React from 'react';
import type { EventItem } from '../../types';
import { X, Calendar, MapPin, Users, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { getFileUrl } from '../../api/events';

interface EventDetailModalProps {
  isOpen: boolean;
  event: EventItem | null;
  registration?: any;
  hasPayment?: boolean;
  onClose: () => void;
  onRegister: (event: EventItem) => void;
  onContinuePayment?: (regId: number, event: EventItem) => void;
  onApplyVolunteer?: (event: EventItem) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  event,
  registration,
  hasPayment,
  onClose,
  onRegister,
  onContinuePayment,
  onApplyVolunteer,
}) => {
  if (!isOpen || !event) return null;

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const isAcceptingVolunteers = event.accepting_volunteers !== false && (event.volunteers_limit === undefined || event.volunteers_limit > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="relative w-full max-w-2xl bg-white rounded border border-[#CBE6C8] p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#6B8B74] hover:text-[#0F2417] hover:bg-[#E5F5E0] rounded transition-colors z-10 bg-white border border-[#CBE6C8]"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {event.banner_url && (
          <div className="-mt-6 -mx-6 mb-5 h-56 bg-cover bg-center" style={{ backgroundImage: `url(${getFileUrl(event.banner_url)})` }} />
        )}

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{event.title}</h2>
            {isAcceptingVolunteers && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#1D4ED8] text-xs font-bold uppercase rounded-full border border-blue-200">
                <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Accepting Volunteers
              </span>
            )}
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#06B6D4]" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Date</span>
                <span className="font-semibold text-xs text-[#0F172A]">{event.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1D4ED8]" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Capacity</span>
                <span className="font-semibold text-xs text-[#0F172A]">{event.capacity} seats</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF5E36]" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Venue</span>
                <span className="font-semibold text-xs text-[#0F172A]">{event.venue}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ticket Price</span>
              <span className="text-xl font-extrabold text-[#1D4ED8]">{formatPrice(event.price)}</span>
            </div>

            <div className="flex items-center gap-2">
              {onApplyVolunteer && isAcceptingVolunteers && (
                <button
                  onClick={() => {
                    onClose();
                    onApplyVolunteer(event);
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white px-4 py-2.5 rounded-full font-bold text-xs transition-colors cursor-pointer shadow-md hover:shadow-orange-500/20"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Apply as Volunteer
                </button>
              )}

              {(registration && (registration.status === 'APPROVED' || event.price === 0)) || hasPayment ? (
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Already Registered
                </span>
              ) : registration && event.price > 0 && onContinuePayment ? (
                <button
                  onClick={() => {
                    onClose();
                    onContinuePayment(registration.id, event);
                  }}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Upload Payment
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onRegister(event);
                  }}
                  className="flex items-center gap-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-full font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Register
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
