import React, { useEffect, useState } from 'react';
import type {
  EventItem,
  Payment,
  RegistrationDetails,
  VolunteerOpening,
  VolunteerApplication,
  ApprovedVolunteerWithAssignment,
  Dispute,
} from '../../types';
import {
  getMyEventsApi,
  createEventApi,
  updateEventApi,
  submitEventApi,
  deleteEventApi,
  uploadEventBannerApi,
  uploadEventQrApi,
  getEventRegistrationsApi,
  activateEventApi,
  completeEventApi,
  getFileUrl,
} from '../../api/events';
import {
  getPendingPaymentsApi,
  approvePaymentApi,
  rejectPaymentApi,
  getPaymentScreenshotUrl,
} from '../../api/payments';
import {
  createVolunteerOpeningApi,
  getVolunteerOpeningsApi,
  updateOpeningStatusApi,
  deleteVolunteerOpeningApi,
  getVolunteerRequestsApi,
  approveVolunteerApplicationApi,
  rejectVolunteerApplicationApi,
  getApprovedVolunteersApi,
  createVolunteerAssignmentApi,
  deleteVolunteerAssignmentApi,
  sendVolunteerNotificationApi,
} from '../../api/volunteers';
import { getDisputesApi, updateDisputeStatusApi } from '../../api/disputes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { ZeroQLogo } from '../common/ZeroQLogo';
import { PageHeader } from '../common/PageHeader';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Edit3,
  Users,
  CreditCard,
  UserCheck,
  LogOut,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Upload,
  Send,
  Search,
  Menu,
  X,
  User as UserIcon,
  Key,
  AlertTriangle,
  Layers,
  MapPin,
  Briefcase,
  Check,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

export const OrganizerDashboard: React.FC = () => {
  const { user, logout, uploadAvatar, deleteAvatar } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'my-events' | 'create-event' | 'registrations' | 'payments' | 'volunteers' | 'disputes' | 'profile'
  >('overview');

  // Avatar Management state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingAvatar(true);
    setAvatarErrorMsg(null);
    setAvatarSuccessMsg(null);
    try {
      await uploadAvatar(file);
      showToast('Profile picture updated successfully!', 'success');
      setAvatarSuccessMsg('Profile picture updated successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload profile picture.';
      setAvatarErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    setAvatarErrorMsg(null);
    setAvatarSuccessMsg(null);
    try {
      await deleteAvatar();
      showToast('Profile picture removed.', 'info');
      setAvatarSuccessMsg('Profile picture removed.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to remove profile picture.';
      setAvatarErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Real API Data
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [eventRegistrationsMap, setEventRegistrationsMap] = useState<Record<number, RegistrationDetails[]>>({});
  const [volunteerOpenings, setVolunteerOpenings] = useState<VolunteerOpening[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<ApprovedVolunteerWithAssignment[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Volunteer Tab Filter
  const [selectedEventForVolunteers, setSelectedEventForVolunteers] = useState<number | 'all'>('all');
  const [selectedOpeningFilter, setSelectedOpeningFilter] = useState<number | 'all'>('all');

  // Managed Events Filter State
  const [managedEventFilter, setManagedEventFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  // Create Opening Modal State
  const [isCreateOpeningModalOpen, setIsCreateOpeningModalOpen] = useState(false);
  const [createOpeningEventId, setCreateOpeningEventId] = useState<number>(0);
  const [createOpeningRole, setCreateOpeningRole] = useState<string>('Gate Volunteer');
  const [createOpeningCount, setCreateOpeningCount] = useState<number>(6);
  const [createOpeningDesc, setCreateOpeningDesc] = useState<string>('');
  const [createOpeningDeadline, setCreateOpeningDeadline] = useState<string>('');
  const [createOpeningGate, setCreateOpeningGate] = useState<string>('');
  const [isCreatingOpening, setIsCreatingOpening] = useState(false);
  const [createOpeningError, setCreateOpeningError] = useState<string | null>(null);

  // Volunteer Assignment Modal State (Stage 4)
  const [selectedVolunteerForAssignment, setSelectedVolunteerForAssignment] = useState<{
    volunteerId: number;
    eventId: number;
    volunteerName: string;
    eventTitle: string;
    roleName: string;
    currentPosition?: string | null;
  } | null>(null);
  const [assignPositionInput, setAssignPositionInput] = useState<string>('Gate 1');

  // Broadcast Notification Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastEventId, setBroadcastEventId] = useState<number>(0);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Disputes View State
  const [selectedDisputeFilter, setSelectedDisputeFilter] = useState<'all' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'>('all');

  const [isLoading, setIsLoading] = useState(true);

  // Create Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventCapacity, setEventCapacity] = useState<number>(100);
  const [eventPrice, setEventPrice] = useState<number>(199);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [createEventSuccess, setCreateEventSuccess] = useState<string | null>(null);
  const [createEventError, setCreateEventError] = useState<string | null>(null);

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCapacity, setEditCapacity] = useState<number>(100);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editVolunteersLimit, setEditVolunteersLimit] = useState<number>(10);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEditModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDesc(ev.description);
    setEditVenue(ev.venue);
    setEditDate(ev.date);
    setEditCapacity(ev.capacity);
    setEditPrice(ev.price);
    setEditVolunteersLimit(ev.volunteers_limit || 10);
    setEditError(null);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!editTitle.trim() || editTitle.trim().length < 3) {
      setEditError('Title must be at least 3 characters.');
      return;
    }
    if (!editVenue.trim()) {
      setEditError('Venue is required.');
      return;
    }
    if (!editDate) {
      setEditError('Date is required.');
      return;
    }
    if (editCapacity < 1) {
      setEditError('Capacity must be at least 1.');
      return;
    }
    if (editPrice < 0) {
      setEditError('Price cannot be negative.');
      return;
    }
    if (editVolunteersLimit < 1) {
      setEditError('Volunteer limit must be at least 1.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      await updateEventApi(editingEvent.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        venue: editVenue.trim(),
        date: editDate,
        capacity: editCapacity,
        price: editPrice,
        volunteers_limit: editVolunteersLimit,
      });
      setToastMessage({ type: 'success', text: `Event '${editTitle}' updated successfully!` });
      setEditingEvent(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update event.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Registrations View State
  const [selectedEventForReg, setSelectedEventForReg] = useState<number | 'all'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'paid' | 'free'>('all');

  // Toast Confirmation State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [regSearchQuery, setRegSearchQuery] = useState('');

  // Payment Verification Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, paymentsData, openingsData, volApps, approvedData, disputeList] = await Promise.all([
        getMyEventsApi().catch(() => []),
        getPendingPaymentsApi().catch(() => []),
        getVolunteerOpeningsApi().catch(() => []),
        getVolunteerRequestsApi().catch(() => []),
        getApprovedVolunteersApi().catch(() => []),
        getDisputesApi().catch(() => []),
      ]);
      setMyEvents(eventsData);
      setPendingPayments(paymentsData);
      setVolunteerOpenings(openingsData);
      setVolunteerApplications(volApps);
      setApprovedVolunteers(approvedData);
      setDisputes(disputeList);

      const regMap: Record<number, RegistrationDetails[]> = {};
      await Promise.all(
        eventsData.map(async (ev) => {
          try {
            const regs = await getEventRegistrationsApi(ev.id);
            regMap[ev.id] = regs;
          } catch {
            regMap[ev.id] = [];
          }
        })
      );
      setEventRegistrationsMap(regMap);
    } catch (err) {
      console.error('Error loading organizer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- VOLUNTEER WORKFLOW HANDLERS ---

  const handleCreateOpeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOpeningEventId || !createOpeningRole.trim() || createOpeningCount < 1) {
      setCreateOpeningError('Event, Volunteer Role, and Count Needed are required.');
      return;
    }
    setIsCreatingOpening(true);
    setCreateOpeningError(null);
    try {
      await createVolunteerOpeningApi({
        event_id: createOpeningEventId,
        role: createOpeningRole.trim(),
        volunteers_needed: createOpeningCount,
        description: createOpeningDesc.trim() || undefined,
        deadline: createOpeningDeadline || undefined,
        gate_area: createOpeningGate.trim() || undefined,
      });
      setIsCreateOpeningModalOpen(false);
      setCreateOpeningDesc('');
      setCreateOpeningDeadline('');
      setCreateOpeningGate('');
      setToastMessage({ type: 'success', text: `Volunteer opening '${createOpeningRole}' created successfully!` });
      await loadData();
    } catch (err: any) {
      setCreateOpeningError(err.response?.data?.detail || 'Failed to create volunteer opening.');
    } finally {
      setIsCreatingOpening(false);
    }
  };

  const handleToggleOpeningStatus = async (openingId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    setIsActionLoading(true);
    try {
      await updateOpeningStatusApi(openingId, { status: newStatus as any });
      setToastMessage({
        type: 'success',
        text: `Opening is now ${newStatus === 'open' ? 'open for applications' : 'closed'}.`,
      });
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update opening status.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteOpening = async (openingId: number) => {
    if (!confirm('Are you sure you want to delete this volunteer opening?')) return;
    setIsActionLoading(true);
    try {
      await deleteVolunteerOpeningApi(openingId);
      setToastMessage({ type: 'success', text: 'Volunteer opening deleted.' });
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete volunteer opening.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveVolunteer = async (appId: number) => {
    setIsActionLoading(true);
    try {
      await approveVolunteerApplicationApi(appId);
      setToastMessage({
        type: 'success',
        text: 'Volunteer application approved! Volunteer is now in Approved roster (Unassigned).',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve volunteer application.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectVolunteer = async (appId: number) => {
    setIsActionLoading(true);
    try {
      await rejectVolunteerApplicationApi(appId);
      setToastMessage({ type: 'success', text: 'Volunteer application rejected.' });
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject volunteer application.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteerForAssignment || !assignPositionInput.trim()) return;
    setIsActionLoading(true);
    try {
      await createVolunteerAssignmentApi(
        selectedVolunteerForAssignment.volunteerId,
        selectedVolunteerForAssignment.eventId,
        assignPositionInput.trim()
      );
      setToastMessage({
        type: 'success',
        text: `Assigned ${selectedVolunteerForAssignment.volunteerName} to '${assignPositionInput.trim()}'.`,
      });
      setSelectedVolunteerForAssignment(null);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign volunteer position.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to unassign this volunteer from this gate/area?')) return;
    setIsActionLoading(true);
    try {
      await deleteVolunteerAssignmentApi(assignmentId);
      setToastMessage({ type: 'success', text: 'Volunteer returned to Unassigned state.' });
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to unassign volunteer.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastEventId || !broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);
    try {
      await sendVolunteerNotificationApi(broadcastEventId, broadcastTitle.trim(), broadcastMessage.trim());
      setBroadcastSuccess('Broadcast notification sent to event volunteers.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => {
        setIsBroadcastModalOpen(false);
        setBroadcastSuccess(null);
      }, 1500);
    } catch (err: any) {
      setBroadcastError(err.response?.data?.detail || 'Failed to send broadcast notification.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleActivateEvent = async (eventId: number) => {
    setIsActionLoading(true);
    try {
      await activateEventApi(eventId);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to set event active.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteEvent = async (eventId: number) => {
    setIsActionLoading(true);
    try {
      await completeEventApi(eventId);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to complete event.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitForApproval = async (eventId: number) => {
    setIsActionLoading(true);
    try {
      await submitEventApi(eventId);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to submit event for approval.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    setIsActionLoading(true);
    try {
      await deleteEventApi(eventId);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete event.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUploadBanner = async (eventId: number, file: File) => {
    setIsActionLoading(true);
    try {
      await uploadEventBannerApi(eventId, file);
      await loadData();
      showToast('Event banner uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload event banner.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUploadQr = async (eventId: number, file: File) => {
    setIsActionLoading(true);
    try {
      await uploadEventQrApi(eventId, file);
      await loadData();
      showToast('Payment QR code image uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload event payment QR.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    setIsActionLoading(true);
    const regId = selectedPayment?.registration_id;
    try {
      await approvePaymentApi(paymentId);
      setSelectedPayment(null);
      setToastMessage({
        type: 'success',
        text: regId ? `Payment for Pass #${regId} approved successfully!` : 'Payment approved successfully!',
      });
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to approve payment.';
      setToastMessage({ type: 'error', text: errMsg });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    setIsActionLoading(true);
    const regId = selectedPayment.registration_id;
    const reason = paymentRejectReason.trim() || 'Payment verification rejected';
    try {
      await rejectPaymentApi(selectedPayment.id, reason);
      setSelectedPayment(null);
      setPaymentRejectReason('');
      setToastMessage({
        type: 'success',
        text: `Payment for Pass #${regId} has been rejected successfully.`,
      });
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to reject payment.';
      setToastMessage({ type: 'error', text: errMsg });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEvent(true);
    setCreateEventSuccess(null);
    setCreateEventError(null);
    try {
      await createEventApi({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        venue: eventVenue.trim(),
        date: eventDate,
        capacity: eventCapacity,
        price: eventPrice,
      });
      setCreateEventSuccess('Event draft created successfully! Submit it for admin review when ready.');
      setEventTitle('');
      setEventDesc('');
      setEventVenue('');
      setEventDate('');
      setEventCapacity(100);
      setEventPrice(199);
      await loadData();
    } catch (err: any) {
      setCreateEventError(err.response?.data?.detail || 'Failed to create event.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleUpdateDisputeStatus = async (disputeId: number, status: 'RESOLVED' | 'CLOSED') => {
    setIsActionLoading(true);
    try {
      await updateDisputeStatusApi(disputeId, status);
      showToast(`Dispute status updated to ${status}.`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update dispute status.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Quick stats
  const activeEventsCount = myEvents.filter((e) => e.status?.toUpperCase() === 'APPROVED' || e.status?.toUpperCase() === 'ACTIVE').length;
  const pendingEventsCount = myEvents.filter((e) => e.status?.toUpperCase() === 'PENDING').length;
  const totalRegistrations = Object.values(eventRegistrationsMap).reduce((acc, arr) => acc + arr.length, 0);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'my-events', label: 'Managed Events', icon: Calendar },
    { id: 'create-event', label: 'Create Event', icon: PlusCircle },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'payments', label: 'Verify Payments', icon: CreditCard },
    { id: 'volunteers', label: 'Volunteer Staffing', icon: UserCheck },
    { id: 'disputes', label: 'Gate Disputes', icon: AlertTriangle },
    { id: 'profile', label: 'Profile & Settings', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#0F172A] font-sans antialiased">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-[var(--sidebar-top)] z-20 shadow-2xs transition-[top] duration-250 ease-in-out motion-reduce:transition-none">
        <ZeroQLogo size="sm" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-xl text-[#1D4ED8] hover:bg-slate-50 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-[var(--sidebar-top)] left-0 w-64 h-[var(--sidebar-height)] bg-white border-r border-slate-200/80 z-30 flex flex-col justify-between transition-[top,height,transform] duration-250 ease-in-out motion-reduce:transition-none overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between px-2 pt-1">
            <ZeroQLogo size="md" />
            <span className="text-[10px] font-bold text-[#FF5E36] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              Organizer
            </span>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Signed In</span>
            <p className="font-semibold text-[#0F172A] truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Contextual Page Header based on Active Tab */}
        {activeTab === 'overview' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Events Overview"
            description="Monitor live event metrics, attendance velocity, and operational queues."
            actions={
              <button
                onClick={loadData}
                className="p-2 bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                title="Refresh Data"
                aria-label="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            }
          />
        )}

        {activeTab === 'my-events' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Managed Events"
            description="Manage, monitor and configure your campus events."
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2 bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  title="Refresh Data"
                  aria-label="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setActiveTab('create-event')}
                  className="flex items-center gap-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Event
                </button>
              </div>
            }
          />
        )}

        {activeTab === 'create-event' && (
          <PageHeader
            eyebrow="EVENT CREATION"
            title="Create Event"
            description="Draft a new campus event and configure ticket capacity, date, and pricing."
          />
        )}

        {activeTab === 'registrations' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Attendee Registrations"
            description="Track confirmed attendee passes and filter registrations by event and payment status."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                title="Refresh Registrations"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'payments' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Payment Verification"
            description="Review submitted payment receipts and approve or reject student pass verification."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                title="Refresh Payments Queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'volunteers' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Volunteer Staffing"
            description="Manage openings, evaluate applicant submissions, and coordinate gate allocations."
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2 bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  title="Refresh Staffing"
                  aria-label="Refresh Staffing"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    if (selectedEventForVolunteers !== 'all') {
                      setCreateOpeningEventId(selectedEventForVolunteers);
                    } else if (myEvents.length > 0) {
                      setCreateOpeningEventId(myEvents[0].id);
                    }
                    setIsCreateOpeningModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Opening
                </button>
              </div>
            }
          />
        )}

        {activeTab === 'disputes' && (
          <PageHeader
            eyebrow="EVENT OPERATIONS"
            title="Gate Disputes"
            description="Review and resolve entry check-in disputes submitted by volunteer scanners."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                title="Refresh Disputes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'profile' && (
          <PageHeader
            eyebrow="PROFILE"
            title="Organizer Settings"
            description="Manage your organizer details, public profile bio, and account credentials."
            actions={
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Change Password
              </button>
            }
          />
        )}

        {/* Action Confirmation Message */}
        {toastMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
              }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Events</span>
                  <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-2xl font-bold text-[#0F172A]">{activeEventsCount}</span>
                <p className="text-[10px] text-slate-500">Approved for attendee signups</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Events</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-[#0F172A]">{pendingEventsCount}</span>
                <p className="text-[10px] text-slate-500">Awaiting admin approval</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Registrations</span>
                  <Users className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-2xl font-bold text-[#0F172A]">{totalRegistrations}</span>
                <p className="text-[10px] text-slate-500">Total attendees registered</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Payments</span>
                  <CreditCard className="w-4 h-4 text-[#FF5E36]" />
                </div>
                <span className="text-2xl font-bold text-[#0F172A]">{pendingPayments.length}</span>
                <p className="text-[10px] text-slate-500">Screenshots to verify</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY EVENTS */}
        {activeTab === 'my-events' && (() => {
          const activeManagedCount = myEvents.filter((e) => e.status?.toUpperCase() === 'ACTIVE').length;
          const upcomingManagedCount = myEvents.filter(
            (e) => e.status?.toUpperCase() === 'APPROVED' || e.status?.toUpperCase() === 'UPCOMING' || e.status?.toUpperCase() === 'PENDING' || e.status?.toUpperCase() === 'DRAFT'
          ).length;
          const pastManagedCount = myEvents.filter((e) => e.status?.toUpperCase() === 'COMPLETED').length;

          const filteredManagedEvents = myEvents
            .filter((ev) => {
              const s = ev.status?.toUpperCase();
              if (managedEventFilter === 'active') return s === 'ACTIVE';
              if (managedEventFilter === 'upcoming') {
                return s === 'APPROVED' || s === 'UPCOMING' || s === 'PENDING' || s === 'DRAFT';
              }
              if (managedEventFilter === 'past') return s === 'COMPLETED';
              return true;
            })
            .sort((a, b) => {
              // Active events stay top, then sorted by upcoming date
              if (a.status?.toUpperCase() === 'ACTIVE' && b.status?.toUpperCase() !== 'ACTIVE') return -1;
              if (b.status?.toUpperCase() === 'ACTIVE' && a.status?.toUpperCase() !== 'ACTIVE') return 1;
              const dateA = new Date(a.date).getTime() || 0;
              const dateB = new Date(b.date).getTime() || 0;
              return dateA - dateB;
            });

          const formatDisplayDate = (dateStr: string) => {
            if (!dateStr) return { formatted: 'Date TBD' };
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return { formatted: dateStr };
            const day = d.getDate();
            const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const year = d.getFullYear();
            return { formatted: `${day} ${month} ${year}` };
          };

          const getCategoryDetails = (title: string = '', desc: string = '') => {
            const t = `${title} ${desc}`.toLowerCase();
            if (t.includes('hack') || t.includes('code') || t.includes('sprint') || t.includes('marathon')) {
              return {
                name: 'Hackathon',
                accentColor: 'bg-indigo-500',
                badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
              };
            }
            if (
              t.includes('fest') ||
              t.includes('cultural') ||
              t.includes('concert') ||
              t.includes('dance') ||
              t.includes('kala') ||
              t.includes('nritya') ||
              t.includes('dandiya') ||
              t.includes('arts') ||
              t.includes('night')
            ) {
              return {
                name: 'Cultural',
                accentColor: 'bg-rose-500',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
              };
            }
            if (
              t.includes('workshop') ||
              t.includes('masterclass') ||
              t.includes('bootcamp') ||
              t.includes('summit') ||
              t.includes('pitch') ||
              t.includes('e-cell')
            ) {
              return {
                name: 'Workshop',
                accentColor: 'bg-amber-500',
                badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
              };
            }
            return {
              name: 'Technical',
              accentColor: 'bg-teal-500',
              badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
            };
          };

          const resolveMediaUrl = (url?: string | null) => {
            if (!url) return null;
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return getFileUrl(url);
          };

          return (
            <div className="space-y-6">
              {/* Summary Bar & Filter Pills */}
              <div className="bg-white p-3.5 sm:p-4 rounded border border-[#CBE6C8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Compact summary row */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>{myEvents.length} Events</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-bold">{activeManagedCount} Active</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-800">{upcomingManagedCount} Upcoming</span>
                  {pastManagedCount > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{pastManagedCount} Past</span>
                    </>
                  )}
                </div>

                {/* Lightweight segmented control filters */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/60 w-fit text-xs font-medium">
                  <button
                    onClick={() => setManagedEventFilter('all')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${managedEventFilter === 'all'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    All Events ({myEvents.length})
                  </button>
                  <button
                    onClick={() => setManagedEventFilter('active')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${managedEventFilter === 'active'
                        ? 'bg-white text-[#1D4ED8] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Active ({activeManagedCount})
                  </button>
                  <button
                    onClick={() => setManagedEventFilter('upcoming')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${managedEventFilter === 'upcoming'
                        ? 'bg-white text-[#1D4ED8] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Upcoming ({upcomingManagedCount})
                  </button>
                  <button
                    onClick={() => setManagedEventFilter('past')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${managedEventFilter === 'past'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Past ({pastManagedCount})
                  </button>
                </div>
              </div>

              {/* EVENT CARDS GRID */}
              {filteredManagedEvents.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No events found in this category.</p>
                  <p className="text-xs text-slate-400">Try selecting another filter or create a new event.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {filteredManagedEvents.map((ev) => {
                    const categoryMeta = getCategoryDetails(ev.title, ev.description);
                    const statusUpper = ev.status?.toUpperCase() || 'DRAFT';

                    // Parse title and subtitle if formatted with separator
                    let mainTitle = ev.title;
                    let subtitle = '';
                    if (ev.title.includes(' - ')) {
                      const parts = ev.title.split(' - ');
                      mainTitle = parts[0];
                      subtitle = parts.slice(1).join(' - ');
                    } else if (ev.title.includes(': ')) {
                      const parts = ev.title.split(': ');
                      mainTitle = parts[0];
                      subtitle = parts.slice(1).join(': ');
                    }

                    return (
                      <div
                        key={ev.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                      >
                        {/* Subtle Category Accent Line */}
                        <div className={`h-1 w-full ${categoryMeta.accentColor}`} />

                        <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* TOP ROW: Category & Small Status Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryMeta.badgeClass}`}
                              >
                                {categoryMeta.name}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusUpper === 'APPROVED' || statusUpper === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                    : statusUpper === 'PENDING'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                      : statusUpper === 'COMPLETED'
                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusUpper === 'ACTIVE'
                                      ? 'bg-emerald-600 animate-pulse'
                                      : statusUpper === 'APPROVED'
                                        ? 'bg-emerald-500'
                                        : statusUpper === 'PENDING'
                                          ? 'bg-amber-500'
                                          : 'bg-slate-400'
                                    }`}
                                />
                                {ev.status}
                              </span>
                            </div>

                            {/* MAIN IDENTITY & BANNER THUMBNAIL */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight leading-snug">
                                  {mainTitle}
                                </h3>
                                {subtitle && (
                                  <p className="text-xs font-semibold text-slate-500 line-clamp-1">
                                    {subtitle}
                                  </p>
                                )}

                                {/* Subtle Accepting Volunteers status line */}
                                <div className="flex items-center gap-1.5 pt-0.5 text-xs text-[#1D4ED8] font-medium">
                                  <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                                  <span>Accepting Volunteers</span>
                                </div>

                                {/* DATE + VENUE: Prominent Information Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                                  <div className="flex items-start gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#1D4ED8] shrink-0 mt-0.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#0F172A] text-xs block leading-tight">
                                        {formatDisplayDate(ev.date).formatted}
                                      </span>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                        Date
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#1D4ED8] shrink-0 mt-0.5">
                                      <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span
                                        className="font-bold text-[#0F172A] text-xs block leading-tight truncate"
                                        title={ev.venue}
                                      >
                                        {ev.venue}
                                      </span>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                        Venue
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* BANNER THUMBNAIL (150-180px on desktop) */}
                              <div className="w-full sm:w-40 md:w-44 shrink-0">
                                <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 relative group flex items-center justify-center shadow-2xs">
                                  {ev.banner_url ? (
                                    <img
                                      src={resolveMediaUrl(ev.banner_url) || ''}
                                      alt={ev.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                                      <span className="text-[10px] font-medium text-slate-400">No Banner</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* DE-EMPHASIZED DESCRIPTION */}
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-0.5" title={ev.description}>
                              {ev.description}
                            </p>

                            {/* REJECTION REASON (if any) */}
                            {ev.rejection_reason && (
                              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                                <span className="font-bold block text-[11px] uppercase tracking-wide text-rose-900">
                                  Rejection Reason:
                                </span>
                                <span className="mt-0.5 block">{ev.rejection_reason}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4 pt-1">
                            {/* EVENT STATS ROW */}
                            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50/90 rounded-xl text-center border border-slate-100">
                              <div>
                                <span className="block text-sm sm:text-base font-bold text-slate-800 leading-tight">
                                  {ev.capacity}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">Capacity</span>
                              </div>
                              <div className="border-x border-slate-200/70">
                                <span className="block text-sm sm:text-base font-bold text-[#1D4ED8] leading-tight">
                                  {ev.price > 0 ? `₹${ev.price}` : 'Free'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">Entry Fee</span>
                              </div>
                              <div>
                                <span className="block text-sm sm:text-base font-bold text-slate-800 leading-tight">
                                  {(eventRegistrationsMap[ev.id] || []).length}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">Registered</span>
                              </div>
                            </div>

                            {/* ASSETS SECTION */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Assets
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                <label
                                  className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${ev.banner_url
                                      ? 'bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border-blue-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                >
                                  {ev.banner_url ? (
                                    <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span>{ev.banner_url ? '✓ Banner' : '↗ Banner'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleUploadBanner(ev.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>

                                <label
                                  className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${ev.payment_qr_url
                                      ? 'bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border-blue-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                >
                                  {ev.payment_qr_url ? (
                                    <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span>{ev.payment_qr_url ? '✓ Payment QR' : '↗ Payment QR'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleUploadQr(ev.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* ACTION HIERARCHY ROW */}
                            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* PRIMARY ACTION: Allot Volunteers */}
                                <button
                                  onClick={() => {
                                    setSelectedEventForVolunteers(ev.id);
                                    setCreateOpeningEventId(ev.id);
                                    setActiveTab('volunteers');
                                    setIsCreateOpeningModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Allot Volunteers</span>
                                </button>

                                {/* SECONDARY ACTION: Registrations */}
                                {ev.status !== 'DRAFT' && (
                                  <button
                                    onClick={() => {
                                      setSelectedEventForReg(ev.id);
                                      setActiveTab('registrations');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Registrations ({(eventRegistrationsMap[ev.id] || []).length})</span>
                                  </button>
                                )}

                                {/* TERTIARY ACTION: Set Active / Submit / Status indicator */}
                                {ev.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleSubmitForApproval(ev.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Submit</span>
                                  </button>
                                )}

                                {(ev.status.toUpperCase() === 'APPROVED' || ev.status.toUpperCase() === 'UPCOMING') && (
                                  <button
                                    onClick={() => handleActivateEvent(ev.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Set Active</span>
                                  </button>
                                )}

                                {ev.status.toUpperCase() === 'ACTIVE' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                    <span>Active</span>
                                  </span>
                                )}

                                {ev.status.toUpperCase() === 'ACTIVE' && (
                                  <button
                                    onClick={() => handleCompleteEvent(ev.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    <span>Mark Completed</span>
                                  </button>
                                )}
                              </div>

                              {/* EDIT & DELETE ACTIONS */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1.5 text-slate-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                  title="Edit Event"
                                  aria-label="Edit Event"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete Event"
                                  aria-label="Delete Event"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: CREATE EVENT */}
        {activeTab === 'create-event' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#FF5E36] uppercase tracking-wider">New Event</span>
              <h3 className="text-base font-bold text-[#0F172A]">Publish Campus Event</h3>
            </div>

            {createEventSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{createEventSuccess}</span>
              </div>
            )}

            {createEventError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createEventError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dandiya Nights 2026"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Event details, schedule, requirements..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={eventCapacity}
                    onChange={(e) => setEventCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Entry Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={eventPrice}
                    onChange={(e) => setEventPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingEvent}
                className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmittingEvent ? 'Saving Draft...' : 'Save as Draft'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedEventForReg}
                  onChange={(e) => setSelectedEventForReg(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="all">All Events ({myEvents.length})</option>
                  {myEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as 'all' | 'paid' | 'free')}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="all">All Ticket Types</option>
                  <option value="paid">Paid Events</option>
                  <option value="free">Free Events</option>
                </select>

                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regSearchQuery}
                    onChange={(e) => setRegSearchQuery(e.target.value)}
                    placeholder="Search attendee..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(selectedEventForReg === 'all'
                ? myEvents
                : myEvents.filter((e) => e.id === selectedEventForReg)
              ).map((ev) => {
                const eventRegs = (eventRegistrationsMap[ev.id] || []).filter((r) => {
                  const matchesType =
                    selectedTypeFilter === 'all' ||
                    (selectedTypeFilter === 'paid' && ev.price > 0) ||
                    (selectedTypeFilter === 'free' && ev.price === 0);
                  const query = regSearchQuery.toLowerCase();
                  const matchesSearch =
                    !query ||
                    r.student_name.toLowerCase().includes(query) ||
                    r.student_email.toLowerCase().includes(query) ||
                    r.registration_number.toLowerCase().includes(query);
                  return matchesType && matchesSearch;
                });

                return (
                  <div
                    key={ev.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-[#0F172A]">{ev.title}</h4>
                      <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {eventRegs.length} Confirmed
                      </span>
                    </div>

                    {eventRegs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">No registrations for this event.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#0F172A] bg-white rounded-xl border border-slate-200">
                          <thead className="bg-slate-50 text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Pass ID</th>
                              <th className="p-2.5">Student</th>
                              <th className="p-2.5">Reg No</th>
                              <th className="p-2.5">Email</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {eventRegs.map((reg) => (
                              <tr key={reg.id} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold">#Pass-{reg.id}</td>
                                <td className="p-2.5 font-semibold">{reg.student_name}</td>
                                <td className="p-2.5 font-mono">{reg.registration_number}</td>
                                <td className="p-2.5 text-slate-600">{reg.student_email}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {reg.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENTS REVIEW */}
        {activeTab === 'payments' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">

            {pendingPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payments pending review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0F172A]">Pass #{pay.registration_id}</span>
                        <span className="font-bold text-[#1D4ED8]">₹{pay.amount}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Ref: {pay.transaction_id || 'N/A'}</p>
                    </div>

                    <div className="h-36 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        src={getPaymentScreenshotUrl(pay.screenshot_path)}
                        alt="Payment Screenshot"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setSelectedPayment(pay)}
                      />
                    </div>

                    <button
                      onClick={() => setSelectedPayment(pay)}
                      className="w-full py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review Screenshot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: VOLUNTEER WORKFLOW & GATE STAFFING HUB */}
        {activeTab === 'volunteers' && (
          <div className="space-y-5">
            {/* Top Control Header with Event Filter & Stats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#1D4ED8]" />
                    Volunteer Operations & Gate Staffing
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Decoupled 4-stage workflow: Openings → Applications → Review & Approval → Gate & Area Allocation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedEventForVolunteers}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setSelectedEventForVolunteers(val);
                      if (val !== 'all') {
                        setBroadcastEventId(val);
                        setCreateOpeningEventId(val);
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value="all">All Events ({myEvents.length})</option>
                    {myEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedEventForVolunteers !== 'all') {
                        setBroadcastEventId(selectedEventForVolunteers);
                      } else if (myEvents.length > 0) {
                        setBroadcastEventId(myEvents[0].id);
                      }
                      setIsBroadcastModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Broadcast
                  </button>
                </div>
              </div>

              {/* 4-Stat Metrics Bar */}
              {(() => {
                const myOwnedEventIds = new Set(myEvents.map((e) => e.id));
                const myVolunteerOpenings = volunteerOpenings.filter((o) => myOwnedEventIds.has(o.event_id));
                const myVolunteerApplications = volunteerApplications.filter((app) => myOwnedEventIds.has(app.event_id));
                const myApprovedVolunteers = approvedVolunteers.filter((appr) => myOwnedEventIds.has(appr.event_id));

                const filteredOpenings = myVolunteerOpenings.filter((o) =>
                  selectedEventForVolunteers === 'all' ? true : o.event_id === selectedEventForVolunteers
                );
                const filteredApps = myVolunteerApplications.filter((app) =>
                  selectedEventForVolunteers === 'all' ? true : app.event_id === selectedEventForVolunteers
                );
                const filteredApproved = myApprovedVolunteers.filter((appr) =>
                  selectedEventForVolunteers === 'all' ? true : appr.event_id === selectedEventForVolunteers
                );
                const pendingCount = filteredApps.filter((a) => a.status === 'pending').length;
                const unassignedCount = filteredApproved.filter((v) => !v.assigned_position).length;
                const assignedCount = filteredApproved.filter((v) => !!v.assigned_position).length;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Openings</span>
                      <span className="text-xl font-bold text-[#0F172A]">{filteredOpenings.length}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Applications</span>
                      <span className={`text-xl font-bold ${pendingCount > 0 ? 'text-amber-700' : 'text-[#0F172A]'}`}>
                        {pendingCount}
                      </span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] font-bold text-[#1D4ED8] uppercase block">Approved Volunteers</span>
                      <span className="text-xl font-bold text-[#1D4ED8]">{filteredApproved.length}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Gate Assignments</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#1D4ED8]">{assignedCount} Assigned</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className={`text-xs font-bold ${unassignedCount > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                          {unassignedCount} Unassigned
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 1: Volunteer Openings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#1D4ED8]" />
                    1. Volunteer Openings
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Define roles and volunteer headcounts needed for your events.
                  </p>
                </div>
                <span className="text-[10px] text-[#1D4ED8] font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Stage 1: Create Opening
                </span>
              </div>

              {(() => {
                const myOwnedEventIds = new Set(myEvents.map((e) => e.id));
                const filteredOpenings = volunteerOpenings
                  .filter((o) => myOwnedEventIds.has(o.event_id))
                  .filter((o) => (selectedEventForVolunteers === 'all' ? true : o.event_id === selectedEventForVolunteers));

                if (filteredOpenings.length === 0) {
                  return (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-xs text-slate-400">No volunteer openings created yet for this event.</p>
                      <button
                        onClick={() => {
                          if (selectedEventForVolunteers !== 'all') {
                            setCreateOpeningEventId(selectedEventForVolunteers);
                          } else if (myEvents.length > 0) {
                            setCreateOpeningEventId(myEvents[0].id);
                          }
                          setIsCreateOpeningModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Create First Opening
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {filteredOpenings.map((opening) => {
                      const isFull = opening.remaining_count === 0 && opening.status === 'open';
                      const isClosed = opening.status === 'closed';

                      return (
                        <div
                          key={opening.id}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <h5 className="text-xs font-bold text-[#0F172A]">{opening.role}</h5>
                                <p className="text-[10px] text-[#1D4ED8] font-semibold">{opening.event_title}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${isClosed
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : isFull
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-blue-50 text-[#1D4ED8] border-blue-200'
                                  }`}
                              >
                                {isClosed ? 'Applications Closed' : isFull ? 'Opening Full' : 'Open'}
                              </span>
                            </div>

                            {opening.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2">{opening.description}</p>
                            )}

                            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-200 text-center">
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 block">NEEDED</span>
                                <span className="text-xs font-bold text-[#0F172A]">{opening.volunteers_needed}</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 block">APPLIED</span>
                                <span className="text-xs font-bold text-[#0F172A]">{opening.applications_count}</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 block">APPROVED</span>
                                <span className="text-xs font-bold text-[#1D4ED8]">{opening.approved_count}</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 block">REMAINING</span>
                                <span className={`text-xs font-bold ${opening.remaining_count === 0 ? 'text-amber-700' : 'text-[#1D4ED8]'}`}>
                                  {opening.remaining_count}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => {
                                setSelectedOpeningFilter(opening.id);
                                const el = document.getElementById('applications-queue-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#1D4ED8] border border-blue-200 font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                            >
                              View Applications ({opening.applications_count})
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleOpeningStatus(opening.id, opening.status)}
                                className={`px-2.5 py-1 font-bold text-[10px] rounded-lg cursor-pointer transition-colors ${opening.status === 'open'
                                    ? 'bg-slate-200 hover:bg-slate-300 text-[#0F172A]'
                                    : 'bg-[#1D4ED8] hover:bg-[#1e40af] text-white'
                                  }`}
                              >
                                {opening.status === 'open' ? 'Close' : 'Reopen'}
                              </button>
                              <button
                                onClick={() => handleDeleteOpening(opening.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer"
                                title="Delete Opening"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 2: Volunteer Applications Queue */}
            <div id="applications-queue-section" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#1D4ED8]" />
                    2. Volunteer Applications Queue
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Review candidate applications and approve who is accepted into event staff.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedOpeningFilter !== 'all' && (
                    <button
                      onClick={() => setSelectedOpeningFilter('all')}
                      className="text-[10px] text-[#1D4ED8] font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 cursor-pointer"
                    >
                      Clear Opening Filter ✕
                    </button>
                  )}
                  <span className="text-[10px] text-[#1D4ED8] font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Stage 2 & 3: Review & Approve
                  </span>
                </div>
              </div>

              {(() => {
                const myOwnedEventIds = new Set(myEvents.map((e) => e.id));
                const filteredApps = volunteerApplications
                  .filter((app) => myOwnedEventIds.has(app.event_id))
                  .filter((app) => {
                    const matchesEvent = selectedEventForVolunteers === 'all' || app.event_id === selectedEventForVolunteers;
                    const matchesOpening = selectedOpeningFilter === 'all' || app.opening_id === selectedOpeningFilter;
                    return matchesEvent && matchesOpening;
                  });

                if (filteredApps.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No candidate applications in the queue for this selection.
                    </p>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#0F172A] bg-white rounded-xl border border-slate-200">
                      <thead className="bg-slate-50 text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Candidate</th>
                          <th className="p-2.5">Event & Role</th>
                          <th className="p-2.5">Applied Date</th>
                          <th className="p-2.5">Experience / Notes</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <span className="font-semibold text-[#0F172A] block">{app.student_name}</span>
                              <span className="text-[10px] text-slate-400 block">{app.student_email}</span>
                              {app.volunteer_code && (
                                <span className="font-mono text-[9px] text-[#1D4ED8] bg-blue-50 px-1.5 rounded inline-block mt-0.5">
                                  ID: {app.volunteer_code}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-[#0F172A] block">{app.role_name || 'Gate Volunteer'}</span>
                              <span className="text-[10px] text-[#1D4ED8] font-medium block">{app.event_title}</span>
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600">
                              {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 max-w-xs">
                              {app.experience || 'No notes provided'}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${app.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : app.status === 'pending'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right space-x-1.5">
                              {app.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveVolunteer(app.id)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectVolunteer(app.id)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : app.status === 'approved' ? (
                                <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Approved
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Rejected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 3: Approved Volunteers & Gate Assignments */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#1D4ED8]" />
                    3. Approved Volunteers & Gate Assignments
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Decoupled operational stage. Assign specific gates/areas when ready, or leave as Unassigned.
                  </p>
                </div>
                <span className="text-[10px] text-[#1D4ED8] font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Stage 4: Gate Allocation
                </span>
              </div>

              {(() => {
                const myOwnedEventIds = new Set(myEvents.map((e) => e.id));
                const filteredApproved = approvedVolunteers
                  .filter((v) => myOwnedEventIds.has(v.event_id))
                  .filter((v) => (selectedEventForVolunteers === 'all' ? true : v.event_id === selectedEventForVolunteers));

                if (filteredApproved.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No approved volunteers yet for this event. Review and approve candidates above.
                    </p>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#0F172A] bg-white rounded-xl border border-slate-200">
                      <thead className="bg-slate-50 text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Approved Volunteer</th>
                          <th className="p-2.5">Event & Role</th>
                          <th className="p-2.5">Approval Status</th>
                          <th className="p-2.5">Gate / Area Location</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredApproved.map((vol) => (
                          <tr key={vol.application_id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <span className="font-semibold text-[#0F172A] block">{vol.student_name}</span>
                              <span className="text-[10px] text-slate-400 block">{vol.student_email}</span>
                              {vol.volunteer_code && (
                                <span className="font-mono text-[9px] text-[#1D4ED8] bg-blue-50 px-1.5 rounded inline-block mt-0.5">
                                  ID: {vol.volunteer_code}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-[#0F172A] block">{vol.role_name}</span>
                              <span className="text-[10px] text-[#1D4ED8] font-medium block">{vol.event_title}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approved
                              </span>
                            </td>
                            <td className="p-2.5">
                              {vol.assigned_position ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                                  <MapPin className="w-3 h-3" />
                                  {vol.assigned_position}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedVolunteerForAssignment({
                                    volunteerId: vol.volunteer_id,
                                    eventId: vol.event_id,
                                    volunteerName: vol.student_name,
                                    eventTitle: vol.event_title,
                                    roleName: vol.role_name,
                                    currentPosition: vol.assigned_position,
                                  });
                                  setAssignPositionInput(vol.assigned_position || 'Gate 1');
                                }}
                                className="px-3 py-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                {vol.assigned_position ? 'Change Location' : 'Assign Gate / Area'}
                              </button>

                              {vol.assignment_id && (
                                <button
                                  onClick={() => handleRemoveAssignment(vol.assignment_id!)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                                >
                                  Unassign
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 7: DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-end items-center border-b border-slate-100 pb-3">
              <select
                value={selectedDisputeFilter}
                onChange={(e) => setSelectedDisputeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A]"
              >
                <option value="all">All ({disputes.length})</option>
                <option value="OPEN">Open</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {disputes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No gate disputes reported.</p>
            ) : (
              <div className="space-y-3">
                {disputes
                  .filter((d) => (selectedDisputeFilter === 'all' ? true : d.status === selectedDisputeFilter))
                  .map((disp) => (
                    <div
                      key={disp.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#1D4ED8] px-2.5 py-0.5 rounded-full border border-blue-200">
                          {disp.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white text-[#0F172A] border border-slate-200">
                          {disp.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#0F172A]">{disp.description}</p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                        <span>Volunteer: {disp.volunteer_name} ({disp.position})</span>
                        <div className="flex items-center gap-1.5">
                          {disp.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateDisputeStatus(disp.id, 'RESOLVED')}
                              className="px-2.5 py-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-lg cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                          {disp.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleUpdateDisputeStatus(disp.id, 'CLOSED')}
                              className="px-2.5 py-1 bg-white border border-slate-200 text-[#0F172A] font-bold rounded-lg cursor-pointer"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-lg mx-auto space-y-4">
            {avatarSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{avatarSuccessMsg}</span>
                </div>
                <button onClick={() => setAvatarSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {avatarErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{avatarErrorMsg}</span>
                </div>
                <button onClick={() => setAvatarErrorMsg(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="flex items-center space-x-4">
                {user?.avatar_url ? (
                  <img
                    src={getFileUrl(user.avatar_url)}
                    alt={user?.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#0B132B] text-white font-bold text-2xl flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'O'}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{user?.name}</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] uppercase">
                    Organizer Role
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploadingAvatar ? 'Uploading...' : user?.avatar_url ? 'Change Photo' : 'Upload Photo'}
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
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Email</span>
                <p className="font-semibold text-[#0F172A]">{user?.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Registration Number</span>
                <p className="font-semibold text-[#0F172A]">{user?.reg_no}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Phone</span>
                <p className="font-semibold text-[#0F172A]">{user?.phone}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Change Password
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />

        {/* Modal: Payment Zoom Review */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A]">Payment Screenshot Review</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Pass #{selectedPayment.registration_id} • Amount: ₹{selectedPayment.amount}
              </p>

              <div className="h-56 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                <img
                  src={getPaymentScreenshotUrl(selectedPayment.screenshot_path)}
                  alt="Payment Screenshot"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Rejection Reason (if rejecting)</label>
                <input
                  type="text"
                  value={paymentRejectReason}
                  onChange={(e) => setPaymentRejectReason(e.target.value)}
                  placeholder="e.g. Reference number not matching"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRejectPayment}
                    disabled={isActionLoading}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprovePayment(selectedPayment.id)}
                    disabled={isActionLoading}
                    className="px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Approve Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Volunteer Opening (Stage 1) */}
        {isCreateOpeningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-md space-y-3 relative shadow-xl">
              <button
                onClick={() => setIsCreateOpeningModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#1D4ED8]" />
                  Create Volunteer Opening
                </h3>
                <p className="text-xs text-slate-500">
                  Publish a volunteer opportunity for students to discover and apply.
                </p>
              </div>

              {createOpeningError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{createOpeningError}</span>
                </div>
              )}

              <form onSubmit={handleCreateOpeningSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Select Event *</label>
                  <select
                    required
                    value={createOpeningEventId}
                    onChange={(e) => setCreateOpeningEventId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value={0} disabled>Choose an event...</option>
                    {myEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Volunteer Role *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gate Volunteer"
                      value={createOpeningRole}
                      onChange={(e) => setCreateOpeningRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Number Needed *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={createOpeningCount}
                      onChange={(e) => setCreateOpeningCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Role Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of duties..."
                    value={createOpeningDesc}
                    onChange={(e) => setCreateOpeningDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Application Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={createOpeningDeadline}
                      onChange={(e) => setCreateOpeningDeadline(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Preferred Area / Gate (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Gate"
                      value={createOpeningGate}
                      onChange={(e) => setCreateOpeningGate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-[#1D4ED8] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span>You can assign specific gates & areas after volunteers are approved.</span>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpeningModalOpen(false)}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOpening}
                    className="flex-1 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isCreatingOpening ? 'Creating...' : 'Create Opening'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Volunteer Gate / Area (Stage 4) */}
        {selectedVolunteerForAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm space-y-3 relative shadow-xl">
              <button
                onClick={() => setSelectedVolunteerForAssignment(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1D4ED8]" />
                  Assign Gate / Area
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVolunteerForAssignment.volunteerName} • {selectedVolunteerForAssignment.roleName}
                </p>
                <p className="text-[11px] font-semibold text-[#1D4ED8]">
                  {selectedVolunteerForAssignment.eventTitle}
                </p>
              </div>

              <form onSubmit={handleAssignVolunteerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Select Preset or Enter Location *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['Gate 1', 'Gate 2', 'Gate 3', 'Main Gate — Scanner 01', 'Registration Desk', 'Help Desk'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAssignPositionInput(preset)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${assignPositionInput === preset
                            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                            : 'bg-slate-50 text-[#0F172A] border-slate-200 hover:bg-blue-50'
                          }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gate 1, VIP Entrance, Registration Desk"
                    value={assignPositionInput}
                    onChange={(e) => setAssignPositionInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-[#1D4ED8]">
                  Assigning a location gives the volunteer active QR scanning permissions at this designated gate.
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedVolunteerForAssignment(null)}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-1 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Broadcast to Volunteers */}
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-md space-y-3 relative shadow-xl">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#1D4ED8]" />
                  Broadcast to Volunteers
                </h3>
                <p className="text-xs text-slate-500">
                  Send live updates to volunteers for a specific event.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              {broadcastError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Select Event *</label>
                  <select
                    required
                    value={broadcastEventId}
                    onChange={(e) => setBroadcastEventId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value={0} disabled>Choose an event...</option>
                    {myEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gate 01 Peak Flow Update"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write instructions..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="flex-1 py-1.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: Edit Event Details */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-lg space-y-4 relative shadow-xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingEvent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#1D4ED8]" />
                  Edit Event Details
                </h3>
                <p className="text-xs text-slate-500">
                  Update event information for #{editingEvent.id} ({editingEvent.title})
                </p>
              </div>

              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Capacity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Entry Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Volunteer Limit *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editVolunteersLimit}
                      onChange={(e) => setEditVolunteersLimit(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

