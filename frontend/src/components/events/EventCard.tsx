import React from 'react';
import type { EventItem } from '../../types';
import { Calendar, MapPin, Users, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { getFileUrl } from '../../api/events';

interface EventCardProps {
  event: EventItem;
  onViewDetails: (event: EventItem) => void;
  onApplyVolunteer?: (event: EventItem) => void;
  registration?: any;
  hasPayment?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onViewDetails, 
  onApplyVolunteer,
  registration, 
  hasPayment 
}) => {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free Entry';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getCategory = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('tech') || t.includes('ai') || t.includes('hack')) return 'TECH & INNOVATION';
    if (t.includes('dance') || t.includes('music') || t.includes('art')) return 'ARTS & CULTURE';
    if (t.includes('meet') || t.includes('network')) return 'NETWORKING';
    if (t.includes('workshop') || t.includes('sprint')) return 'WORKSHOPS';
    return 'GENERAL';
  };

  const category = getCategory(event.title);
  const isAcceptingVolunteers = event.accepting_volunteers !== false && (event.volunteers_limit === undefined || event.volunteers_limit > 0);

  return (
    <div 
      onClick={() => onViewDetails(event)}
      className="group bg-white rounded-3xl border border-slate-200 hover:border-[#1D4ED8] transition-all flex flex-col cursor-pointer overflow-hidden shadow-sm hover:shadow-xl"
    >
      {/* Event Banner */}
      <div 
        className="relative h-44 w-full bg-[#0B132B] bg-cover bg-center"
        style={event.banner_url ? { backgroundImage: `url(${getFileUrl(event.banner_url)})` } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-black/30" />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-[#1D4ED8] text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-200 shadow-xs">
            {category}
          </span>
          {isAcceptingVolunteers && (
            <span className="px-3 py-1 bg-gradient-to-r from-[#FF5E36] to-[#F97316] backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs">
              <UserCheck className="w-3 h-3 text-white" />
              Volunteers
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
          <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>{event.date}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#0F172A] line-clamp-1 group-hover:text-[#1D4ED8] transition-colors leading-snug">
            {event.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FF5E36] shrink-0" />
            <span className="font-medium text-[#0F172A] line-clamp-1">{event.venue}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
            <span>Capacity: {event.capacity} seats</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ticket</span>
            <span className="text-lg font-extrabold text-[#1D4ED8] block leading-tight">{formatPrice(event.price)}</span>
          </div>

          <div className="flex items-center gap-2">
            {hasPayment ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Registered
              </span>
            ) : registration ? (
              <span className="flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Action Required
              </span>
            ) : null}
            {onApplyVolunteer && isAcceptingVolunteers && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyVolunteer(event);
                }}
                className="flex items-center gap-1 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white px-3 py-2 rounded-full font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Volunteer</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(event);
              }}
              className="flex items-center gap-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white px-4 py-2 rounded-full font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

