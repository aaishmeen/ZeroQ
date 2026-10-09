import React, { useEffect, useState } from 'react';
import type { Registration, EventItem, Payment, AvailableVolunteerEvent, VolunteerApplication } from '../../types';
import { getMyRegistrationsApi } from '../../api/registrations';
import { getEventsApi, getFileUrl } from '../../api/events';
import { getMyPaymentsApi } from '../../api/payments';
import {
  getAvailableVolunteerEventsApi,
  getMyVolunteerApplicationsApi,
} from '../../api/volunteers';
import { QRTicketCard } from '../tickets/QRTicketCard';
import { PaymentUploadModal } from '../payments/PaymentUploadModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { BecomeVolunteerModal } from '../auth/BecomeVolunteerModal';
import { useAuth } from '../../context/AuthContext';
import {
  Ticket,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Upload,
  RefreshCw,
  Key,
  Trash2,
  UserCheck,
  MapPin,
  X,
  ChevronRight,
} from 'lucide-react';

import { useToast } from '../common/ToastContainer';

export const StudentDashboard: React.FC = () => {
  const { user, uploadAvatar, deleteAvatar } = useAuth();
  const { showToast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(e.target.files[0]);
      showToast('Profile picture updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await deleteAvatar();
      showToast('Profile picture removed.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to remove profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<number, EventItem>>({});
  const [paymentsMap, setPaymentsMap] = useState<Record<number, Payment>>({});
  const [availableVolunteerEvents, setAvailableVolunteerEvents] = useState<AvailableVolunteerEvent[]>([]);
  const [myVolunteerApplications, setMyVolunteerApplications] = useState<VolunteerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals for buttons
  const [isPassesModalOpen, setIsPassesModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // Volunteer Apply Modal State
  const [selectedVolunteerEvent, setSelectedVolunteerEvent] = useState<AvailableVolunteerEvent | null>(null);
  const [volunteerAppToast, setVolunteerAppToast] = useState<string | null>(null);
  // Active Modals
  const [selectedTicket, setSelectedTicket] = useState<{ reg: Registration; ev: EventItem } | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{ regId: number; ev: EventItem } | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBecomeVolunteerOpen, setIsBecomeVolunteerOpen] = useState(false);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const [regs, evs, pays, volEvents, volApps] = await Promise.all([
        getMyRegistrationsApi(),
        getEventsApi(),
        getMyPaymentsApi().catch(() => []),
        getAvailableVolunteerEventsApi().catch(() => []),
        getMyVolunteerApplicationsApi().catch(() => []),
      ]);

      const mapEv: Record<number, EventItem> = {};
      evs.forEach((e) => (mapEv[e.id] = e));
      setEventsMap(mapEv);

      const mapPay: Record<number, Payment> = {};
      pays.forEach((p) => (mapPay[p.registration_id] = p));
      setPaymentsMap(mapPay);

      setRegistrations(regs);
      setMyVolunteerApplications(volApps);

      let finalVolEvents = volEvents || [];
      if (finalVolEvents.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        finalVolEvents = evs.filter((e) => {
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
        }) as any[];
      }

      setAvailableVolunteerEvents(finalVolEvents);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const renderRegistrationCard = (reg: Registration) => {
    const event = eventsMap[reg.event_id];
    const payment = paymentsMap[reg.id];

    const isApproved = reg.status?.toLowerCase() === 'approved';
    const isPending = reg.status?.toLowerCase() === 'pending';
    const isRejected = reg.status?.toLowerCase() === 'rejected';

    return (
      <div
        key={reg.id}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#1D4ED8]/40 transition-colors"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#1D4ED8] px-2.5 py-0.5 rounded-full border border-blue-100">
              Pass #{reg.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isPending
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {isPending && <Clock className="w-3 h-3 text-amber-600" />}
              {isRejected && <XCircle className="w-3 h-3 text-red-600" />}
              {reg.status}
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A] leading-snug">
            {event ? event.title : `Event #${reg.event_id}`}
          </h3>

          {event && (
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>{event.date}</span>
              </div>
              <p className="font-semibold text-[#1D4ED8]">
                Price: {event.price === 0 ? 'Free' : `₹${event.price}`}
              </p>
            </div>
          )}

          {payment && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span
                  className={`font-bold uppercase ${
                    payment.status?.toLowerCase() === 'rejected'
                      ? 'text-red-700'
                      : payment.status?.toLowerCase() === 'approved'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {payment.status}
                </span>
              </div>
              {payment.rejection_reason && (
                <p className="text-red-600 font-medium text-[10px]">
                  Reason: {payment.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100">
          {isApproved && event && (
            <button
              onClick={() => setSelectedTicket({ reg, ev: event })}
              className="w-full flex items-center justify-center gap-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              View Digital Pass
            </button>
          )}

          {(isPending || isRejected) && event && (
            <button
              onClick={() => setPaymentModalData({ regId: reg.id, ev: event })}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:opacity-95 text-white py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              {payment ? (isRejected ? 'Re-upload Payment Proof' : 'Update Payment Proof') : 'Upload Payment Proof'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const approvedRegs = registrations.filter(r => r.status?.toLowerCase() === 'approved');
  const pendingRegs = registrations.filter(r => r.status?.toLowerCase() !== 'approved');
  const totalOpenings = availableVolunteerEvents.reduce(
    (acc, ev) => acc + (ev.openings && ev.openings.length > 0 ? ev.openings.length : 1),
    0
  );

  return (
    <div className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Volunteer Toast Feedback */}
        {volunteerAppToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{volunteerAppToast}</span>
            </div>
            <button
              onClick={() => setVolunteerAppToast(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Grid: Left (Action Buttons) + Right (Vertical Profile Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Action Cards / Feature Buttons */}
          <main className="lg:col-span-8 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Student Passbook & Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif-heading font-bold text-[#0F172A] mt-2">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access your digital tickets, track pending registrations, and discover volunteer positions.
              </p>
            </div>

            {/* Action Cards Grid */}
            <div className="space-y-4">
              
              {/* Card 1: Active Event Passes Button */}
              <div 
                onClick={() => setIsPassesModalOpen(true)}
                className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#1D4ED8] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#1D4ED8] group-hover:text-white transition-colors">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                        Active Event Passes
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {approvedRegs.length} Confirmed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      View your confirmed entry passes, QR codes, and ticket details.
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPassesModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-full transition-colors shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Open Active Passes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Pending Registrations Button */}
              {pendingRegs.length > 0 && (
                <div 
                  onClick={() => setIsPendingModalOpen(true)}
                  className="group bg-white p-6 rounded-3xl border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#0F172A]">
                          Pending & Action Required
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {pendingRegs.length} Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload payment receipts or check status for submitted pass applications.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPendingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-full transition-colors shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Manage Pending Passes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Card 3: Volunteer Opportunities & Applications Button */}
              <div 
                onClick={() => setIsVolunteerModalOpen(true)}
                className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#FF5E36] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5E36] flex items-center justify-center shrink-0 border border-orange-100 group-hover:bg-[#FF5E36] group-hover:text-white transition-colors">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#0F172A] group-hover:text-[#FF5E36] transition-colors">
                        Volunteer Opportunities
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#FF5E36] border border-orange-200">
                        {totalOpenings} Openings
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Join campus event management teams, assist gate scanning, and earn certificates.
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVolunteerModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs rounded-full transition-colors shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Explore Openings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </main>

          {/* Right Column: Vertical Profile Card */}
          <aside className="lg:col-span-4 sticky top-24">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
              
              {/* Profile Avatar & Upload */}
              <div className="relative w-28 h-28 mx-auto">
                {user?.avatar_url ? (
                  <img
                    src={getFileUrl(user.avatar_url)}
                    alt={user?.name}
                    className="w-28 h-28 rounded-3xl object-cover border-2 border-[#1D4ED8] shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#1D4ED8] to-[#0B132B] text-white font-bold text-3xl flex items-center justify-center shadow-md mx-auto">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <label className="absolute -bottom-2 right-0 bg-[#1D4ED8] text-white p-2 rounded-2xl cursor-pointer shadow-md hover:bg-[#1e40af] transition-colors" title="Change Photo">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                </label>

                {user?.avatar_url && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-2 left-0 bg-red-600 text-white p-2 rounded-2xl cursor-pointer shadow-md hover:bg-red-700 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* User Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {user?.role === 'volunteer' ? 'Approved Volunteer' : 'Student Participant'}
                </span>
                <h2 className="text-xl font-bold text-[#0F172A] pt-2">{user?.name}</h2>
                <p className="text-xs text-slate-500">{user?.email}</p>
                {user?.reg_no && (
                  <p className="text-xs font-semibold text-[#1D4ED8] pt-1">
                    Reg No: {user?.reg_no}
                  </p>
                )}
              </div>

              {/* Vertical Action Buttons Stack */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <button
                  onClick={() => setIsBecomeVolunteerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs rounded-2xl shadow-xs transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  Apply for Volunteer Role
                </button>

                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4 text-[#1D4ED8]" />
                  Change Password
                </button>

                <button
                  onClick={loadStudentData}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs rounded-2xl border border-blue-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Dashboard
                </button>
              </div>

            </div>
          </aside>

        </div>

        {/* MODAL 1: Active Passes Modal */}
        {isPassesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-5">
              <button
                onClick={() => setIsPassesModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center border border-blue-100">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Active Event Passes ({approvedRegs.length})</h2>
                  <p className="text-xs text-slate-500">Your confirmed digital passes with instant QR check-in codes.</p>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : approvedRegs.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-2 border border-slate-200">
                  <Ticket className="w-6 h-6 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-[#0F172A]">No Confirmed Passes</h3>
                  <p className="text-xs text-slate-500">You do not have any active event passes at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedRegs.map(renderRegistrationCard)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: Pending Registrations Modal */}
        {isPendingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-5">
              <button
                onClick={() => setIsPendingModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Pending & Rejected Passes ({pendingRegs.length})</h2>
                  <p className="text-xs text-slate-500">Upload payment receipts or view feedback for your pending registrations.</p>
                </div>
              </div>

              {pendingRegs.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-2 border border-slate-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-[#0F172A]">All Clear!</h3>
                  <p className="text-xs text-slate-500">You have no pending or action required registrations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRegs.map(renderRegistrationCard)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 3: Volunteer Opportunities & Applications Modal */}
        {isVolunteerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-5">
              <button
                onClick={() => setIsVolunteerModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5E36] flex items-center justify-center border border-orange-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Volunteer Openings & Staff Roles</h2>
                  <p className="text-xs text-slate-500">Discover available volunteer spots across events and track submitted applications.</p>
                </div>
              </div>

              {/* Volunteer Opportunities List */}
              <div className="space-y-4">
                {availableVolunteerEvents.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 space-y-1">
                    <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-[#0F172A]">No volunteer openings available at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableVolunteerEvents.map((ev) => {
                      const hasOpenings = ev.openings && ev.openings.length > 0;
                      return (
                        <div
                          key={ev.id}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                            <div>
                              <h3 className="text-sm font-bold text-[#0F172A]">{ev.title}</h3>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                  {ev.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                  {ev.venue}
                                </span>
                              </div>
                            </div>
                          </div>

                          {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}

                          {/* Openings Grid */}
                          {hasOpenings ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              {ev.openings!.map((op) => {
                                const userApp = myVolunteerApplications.find((a) => a.opening_id === op.id || a.event_id === ev.id);
                                const alreadyApplied = !!userApp || (!!ev.application_status && ev.application_status !== 'none');
                                const isFull = op.remaining_count === 0;

                                return (
                                  <div
                                    key={op.id}
                                    className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-[#0F172A]">{op.role}</h4>
                                      </div>
                                      {op.description && (
                                        <p className="text-[11px] text-slate-600 line-clamp-2">{op.description}</p>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-500">
                                        {op.volunteers_needed} needed • {op.approved_count} approved
                                      </span>

                                      <button
                                        onClick={() => {
                                          setIsVolunteerModalOpen(false);
                                          setSelectedVolunteerEvent(ev);
                                        }}
                                        disabled={alreadyApplied || isFull}
                                        className="px-3 py-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                                      >
                                        {alreadyApplied
                                          ? `Applied (${userApp?.status || 'pending'})`
                                          : isFull
                                          ? 'Opening Full'
                                          : 'Apply'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="pt-2 flex justify-end">
                              {(() => {
                                const userApp = myVolunteerApplications.find((a) => a.event_id === ev.id);
                                const isApplied = !!userApp || (!!ev.application_status && ev.application_status !== 'none');

                                return (
                                  <button
                                    onClick={() => {
                                      setIsVolunteerModalOpen(false);
                                      setSelectedVolunteerEvent(ev);
                                    }}
                                    disabled={isApplied}
                                    className="px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    {isApplied ? `Applied (${userApp?.status || 'pending'})` : 'Apply as General Volunteer'}
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* My Volunteer Applications */}
                {myVolunteerApplications.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      My Submitted Applications ({myVolunteerApplications.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {myVolunteerApplications.map((app) => {
                        const status = (app.status || '').toLowerCase();
                        return (
                          <div
                            key={app.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <h4 className="font-bold text-[#0F172A]">{app.event_title || `Event #${app.event_id}`}</h4>
                              <p className="text-[11px] text-slate-500">{app.role_name || 'General Volunteer'}</p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Digital Ticket Card */}
        {selectedTicket && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="relative max-w-sm w-full">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute -top-8 right-0 text-white hover:text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Close Pass
              </button>
              <QRTicketCard
                registration={selectedTicket.reg}
                event={selectedTicket.ev}
                user={user}
              />
            </div>
          </div>
        )}

        {/* Modal: Payment Upload */}
        {paymentModalData && (
          <PaymentUploadModal
            isOpen={!!paymentModalData}
            registrationId={paymentModalData.regId}
            event={paymentModalData.ev}
            onClose={() => setPaymentModalData(null)}
            onPaymentSubmitted={loadStudentData}
          />
        )}

        {/* Modal: Change Password */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />

        {/* Modal: Volunteer Application */}
        <BecomeVolunteerModal
          isOpen={isBecomeVolunteerOpen || !!selectedVolunteerEvent}
          preselectedEventId={selectedVolunteerEvent?.id}
          onClose={() => {
            setIsBecomeVolunteerOpen(false);
            setSelectedVolunteerEvent(null);
          }}
          onSuccess={loadStudentData}
        />
      </div>
    </div>
  );
};
