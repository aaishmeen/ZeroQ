import React, { useState, useEffect } from 'react';
import { getEventsApi } from '../../api/events';
import { applyAsVolunteerApi, getVolunteerOpeningsApi, getAvailableVolunteerEventsApi } from '../../api/volunteers';
import { useAuth } from '../../context/AuthContext';
import type { EventItem, VolunteerOpening } from '../../types';
import { X, UserCheck, Calendar, CheckCircle2, AlertCircle, ArrowRight, Award, Sparkles, Briefcase } from 'lucide-react';

interface BecomeVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNeedLogin?: () => void;
  preselectedEventId?: number | null;
}

const AVAILABLE_SKILLS = [
  '📱 Optical Gate Scanning',
  '👥 Crowd Control & Ushering',
  'ℹ️ Registration & Helpdesk',
  '⚡ Tech & Audio/Visual',
  '🛡️ Emergency & Safety Assist',
  '📋 Event Logistics',
];

export const BecomeVolunteerModal: React.FC<BecomeVolunteerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNeedLogin,
  preselectedEventId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(preselectedEventId || null);
  const [openings, setOpenings] = useState<VolunteerOpening[]>([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState<number | null>(null);

  const [capabilitiesText, setCapabilitiesText] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingOpenings, setIsLoadingOpenings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg(null);
      setErrorMsg(null);
      setCapabilitiesText('');
      setSelectedSkills([]);
      loadEvents();
    }
  }, [isOpen, preselectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      loadOpeningsForEvent(selectedEventId);
    } else {
      setOpenings([]);
      setSelectedOpeningId(null);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      let volunteerEvents: EventItem[] = [];

      // 1. Fetch events specifically available for volunteering
      try {
        const volData = await getAvailableVolunteerEventsApi();
        if (volData && volData.length > 0) {
          volunteerEvents = volData.filter((ev: any) => {
            const volLimit = ev.volunteers_limit ?? 10;
            const approvedCount = ev.approved_volunteers_count || 0;
            const hasOpenings = ev.openings && ev.openings.length > 0;
            const isVolunteersAllowed = volLimit > 0;
            const hasCapacity = approvedCount < volLimit || hasOpenings;
            return isVolunteersAllowed && hasCapacity;
          }) as any[];
        }
      } catch (err) {
        console.warn('Failed to load available volunteer events endpoint:', err);
      }

      // 2. Fallback if available-events was empty/errored
      if (volunteerEvents.length === 0) {
        try {
          const allEvents = await getEventsApi();
          const todayStr = new Date().toISOString().split('T')[0];
          volunteerEvents = allEvents.filter((e) => {
            const status = (e.status || '').toUpperCase();
            const isStatusEligible =
              status === 'APPROVED' ||
              status === 'ACTIVE' ||
              status === 'UPCOMING' ||
              status === 'DRAFT' ||
              status === '';
            const isNotExpired = !e.date || e.date >= todayStr;
            const isTakingVolunteers = e.volunteers_limit === undefined || e.volunteers_limit > 0;
            return isStatusEligible && isNotExpired && isTakingVolunteers;
          });
        } catch (err) {
          console.error('Failed to load fallback events:', err);
        }
      }

      // Deduplicate events by (title, venue, date) to ensure unique dropdown options
      const uniqueEventsMap = new Map<string, EventItem>();
      volunteerEvents.forEach((ev) => {
        const key = `${(ev.title || '').trim().toLowerCase()}_${(ev.venue || '').trim().toLowerCase()}_${ev.date || ''}`;
        if (!uniqueEventsMap.has(key)) {
          uniqueEventsMap.set(key, ev);
        }
      });
      const uniqueEvents = Array.from(uniqueEventsMap.values());

      setEvents(uniqueEvents);

      if (preselectedEventId && uniqueEvents.some((e) => e.id === preselectedEventId)) {
        setSelectedEventId(preselectedEventId);
      } else if (uniqueEvents.length > 0) {
        setSelectedEventId(uniqueEvents[0].id);
      } else {
        setSelectedEventId(null);
      }
    } catch (err) {
      console.error('Failed to load events for volunteer application:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadOpeningsForEvent = async (eventId: number) => {
    setIsLoadingOpenings(true);
    try {
      const data = await getVolunteerOpeningsApi(eventId, 'open');
      setOpenings(data);
      if (data.length > 0) {
        setSelectedOpeningId(data[0].id);
      } else {
        setSelectedOpeningId(null);
      }
    } catch (err) {
      console.error('Failed to fetch openings for event:', err);
      setOpenings([]);
      setSelectedOpeningId(null);
    } finally {
      setIsLoadingOpenings(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      if (onNeedLogin) onNeedLogin();
      return;
    }

    if (!selectedEventId) {
      setErrorMsg('Please select an event to apply for.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Combine skills and experience into structured capability text
    const skillsText = selectedSkills.length > 0 ? `Key Strengths: ${selectedSkills.join(', ')}` : '';
    const fullExperience = [skillsText, capabilitiesText.trim()]
      .filter(Boolean)
      .join('\n\nDetails / Experience: ');

    try {
      await applyAsVolunteerApi(
        selectedEventId,
        selectedOpeningId || undefined,
        fullExperience || undefined
      );
      setSuccessMsg('Volunteer application submitted! The event organizer will review your capabilities.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit volunteer application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center space-y-1 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 text-[#1D4ED8] rounded-2xl flex items-center justify-center shadow-xs">
            <UserCheck className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] pt-1">Volunteer Application</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Apply to assist event organizers with gate check-in, crowd control, and event operations.
          </p>
        </div>

        {successMsg ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-full font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Applicant Profile Badge */}
            {user && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">{user.name}</h4>
                    <span className="text-[10px] font-semibold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                      Student Applicant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{user.email} • Reg No: {user.reg_no}</p>
                </div>
              </div>
            )}

            {/* Select Campus Event */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Select Event
              </label>
              {isLoadingEvents ? (
                <div className="p-3 text-center text-xs text-slate-400">Loading active events...</div>
              ) : events.length === 0 ? (
                <div className="p-3 bg-[#F8FAFC] text-slate-500 rounded-2xl text-xs text-center border border-slate-200">
                  No upcoming approved events available for volunteering.
                </div>
              ) : (
                <select
                  value={selectedEventId || ''}
                  onChange={(e) => setSelectedEventId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {ev.venue} ({ev.date})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Preferred Role / Opening */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Preferred Volunteer Role
              </label>
              {isLoadingOpenings ? (
                <div className="p-2.5 text-center text-xs text-slate-400">Loading roles...</div>
              ) : openings.length > 0 ? (
                <select
                  value={selectedOpeningId || ''}
                  onChange={(e) => setSelectedOpeningId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                >
                  {openings.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.role} ({op.volunteers_needed} needed) {op.gate_area ? `— ${op.gate_area}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-medium">
                  General Gate Volunteer (General Check-In & Gate Assist)
                </div>
              )}
            </div>

            {/* Strengths & Skills Quick Selection */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5E36]" />
                Select Your Key Capabilities & Skills
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${isSelected
                          ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience & Capabilities Note */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Prior Experience & Statement of Capability (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Describe your prior volunteering experience, past event organizing roles, availability during event hours, or relevant skills..."
                value={capabilitiesText}
                onChange={(e) => setCapabilitiesText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Workflow Guide */}
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-1">
              <div className="font-bold text-[#1D4ED8] text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1D4ED8]" />
                What happens next?
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The event organizer will review your capabilities and past experience. Upon approval, your Scanner Portal will activate automatically for event gate validation.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || events.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white py-2.5 rounded-full font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md hover:shadow-orange-500/20"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
