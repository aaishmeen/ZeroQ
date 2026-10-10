import React, { useEffect, useState } from 'react';
import type {
  EventItem,
  Registration,
  Payment,
  User,
  VolunteerOpening,
  VolunteerApplication,
  ApprovedVolunteerWithAssignment,
} from '../../types';
import {
  getEventsApi,
  getPendingEventsApi,
  approveEventApi,
  rejectEventApi,
  createEventApi,
  updateEventApi,
  activateEventApi,
  completeEventApi,
  getFileUrl,
} from '../../api/events';
import { getRegistrationsApi } from '../../api/registrations';
import {
  getPendingPaymentsApi,
  approvePaymentApi,
  rejectPaymentApi,
  getPaymentScreenshotUrl,
} from '../../api/payments';
import { getUsersApi, approveAdminApi, rejectAdminApi } from '../../api/auth';
import {
  getVolunteerOpeningsApi,
  getVolunteerRequestsApi,
  approveVolunteerApplicationApi,
  rejectVolunteerApplicationApi,
  getApprovedVolunteersApi,
  createVolunteerAssignmentApi,
  deleteVolunteerAssignmentApi,
  sendVolunteerNotificationApi,
} from '../../api/volunteers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { ZeroQLogo } from '../common/ZeroQLogo';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  Clock,
  CreditCard,
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Edit3,
  RefreshCw,
  LogOut,
  Eye,
  X,
  Check,
  Search,
  Key,
  LayoutDashboard,
  UserCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Menu,
  User as UserIcon,
  Briefcase,
  Layers,
  MapPin,
  Upload,
  Trash2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout, uploadAvatar, deleteAvatar } = useAuth();
  const { showToast } = useToast();
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'events' | 'pending-approvals' | 'payments' | 'registrations' | 'users' | 'volunteers' | 'profile' | 'governance'
  >(user?.role === 'superadmin' ? 'governance' : 'overview');

  const [governanceSubTab, setGovernanceSubTab] = useState<'requests' | 'admins'>('requests');
  const [adminActionLoadingId, setAdminActionLoadingId] = useState<number | null>(null);

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [volunteerOpenings, setVolunteerOpenings] = useState<VolunteerOpening[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<ApprovedVolunteerWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Volunteer Tab Scope Filter
  const [selectedEventForVolunteers, setSelectedEventForVolunteers] = useState<number | 'all'>('all');

  // Volunteer Gate Assignment Modal State
  const [selectedVolunteerForAssignment, setSelectedVolunteerForAssignment] = useState<{
    volunteerId: number;
    eventId: number;
    volunteerName: string;
    eventTitle: string;
    roleName: string;
    currentPosition?: string | null;
  } | null>(null);
  const [assignPositionInput, setAssignPositionInput] = useState<string>('Gate 1');

  // Modal States
  const [selectedPaymentToReview, setSelectedPaymentToReview] = useState<Payment | null>(null);
  const [selectedEventToReject, setSelectedEventToReject] = useState<EventItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastEventId, setBroadcastEventId] = useState<number>(0);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Form State for Event Creation
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState(100);
  const [newEventPrice, setNewEventPrice] = useState(0);

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
      setEditingEvent(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update event.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Search & Filter State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'student' | 'organizer' | 'admin'>('all');

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastEventId) {
      setBroadcastError('Please select an event for the broadcast.');
      return;
    }
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastError('Title and message are required.');
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);
    try {
      await sendVolunteerNotificationApi(
        broadcastEventId,
        broadcastTitle.trim(),
        broadcastMessage.trim()
      );
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

  const loadData = async () => {
    setIsLoading(true);
    setUsersError(null);
    try {
      const [eventsData, pendingEvData, pendingPayData, regData, openingsData, appsData, approvedData] =
        await Promise.all([
          getEventsApi().catch(() => []),
          getPendingEventsApi().catch(() => []),
          getPendingPaymentsApi().catch(() => []),
          getRegistrationsApi().catch(() => []),
          getVolunteerOpeningsApi().catch(() => []),
          getVolunteerRequestsApi().catch(() => []),
          getApprovedVolunteersApi().catch(() => []),
        ]);
      setAllEvents(eventsData);
      setPendingEvents(pendingEvData);
      setPendingPayments(pendingPayData);
      setAllRegistrations(regData);
      setVolunteerOpenings(openingsData);
      setVolunteerApplications(appsData);
      setApprovedVolunteers(approvedData);

      try {
        const usersData = await getUsersApi();
        setAllUsers(usersData);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setUsersError(err.response?.data?.detail || 'Failed to load user directory.');
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveEvent = async (eventId: number) => {
    try {
      await approveEventApi(eventId);
      showToast('Event approved successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve event.', 'error');
    }
  };

  const handleActivateEvent = async (eventId: number) => {
    try {
      await activateEventApi(eventId);
      showToast('Event activated successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to activate event.', 'error');
    }
  };

  const handleCompleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to mark this event as COMPLETED?')) return;
    try {
      await completeEventApi(eventId);
      showToast('Event marked as completed!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to mark event completed.', 'error');
    }
  };

  const handleRejectEvent = async () => {
    if (!selectedEventToReject || !rejectReason.trim()) {
      showToast('Please enter a rejection reason.', 'warning');
      return;
    }
    try {
      await rejectEventApi(selectedEventToReject.id, rejectReason.trim());
      setSelectedEventToReject(null);
      setRejectReason('');
      showToast('Event rejected successfully.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject event.', 'error');
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    setIsActionLoading(true);
    const regId = selectedPaymentToReview?.registration_id;
    try {
      await approvePaymentApi(paymentId);
      setSelectedPaymentToReview(null);
      showToast(regId ? `Payment for Pass #${regId} approved successfully!` : 'Payment approved successfully!', 'success');
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to approve payment.';
      showToast(errMsg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPaymentToReview) return;
    setIsActionLoading(true);
    const regId = selectedPaymentToReview.registration_id;
    const reason = rejectReason.trim() || 'Payment verification rejected';
    try {
      await rejectPaymentApi(selectedPaymentToReview.id, reason);
      setSelectedPaymentToReview(null);
      setRejectReason('');
      showToast(`Payment for Pass #${regId} has been rejected.`, 'info');
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to reject payment.';
      showToast(errMsg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEventApi({
        title: newEventTitle,
        description: newEventDesc,
        venue: newEventVenue,
        date: newEventDate,
        capacity: newEventCapacity,
        price: newEventPrice,
      });
      setIsCreateEventOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventVenue('');
      setNewEventDate('');
      showToast('Event created successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create event.', 'error');
    }
  };

  // Admin Volunteer Actions
  const handleApproveVolunteer = async (appId: number) => {
    try {
      await approveVolunteerApplicationApi(appId);
      showToast('Volunteer approved successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve volunteer.', 'error');
    }
  };

  const handleRejectVolunteer = async (appId: number) => {
    try {
      await rejectVolunteerApplicationApi(appId);
      showToast('Volunteer application rejected.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject volunteer.', 'error');
    }
  };

  const handleAssignVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteerForAssignment || !assignPositionInput.trim()) return;
    try {
      await createVolunteerAssignmentApi(
        selectedVolunteerForAssignment.volunteerId,
        selectedVolunteerForAssignment.eventId,
        assignPositionInput.trim()
      );
      setSelectedVolunteerForAssignment(null);
      showToast('Volunteer position assigned successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign volunteer position.', 'error');
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to unassign this volunteer?')) return;
    try {
      await deleteVolunteerAssignmentApi(assignmentId);
      showToast('Volunteer assignment removed.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to unassign volunteer.', 'error');
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const userRoleLower = (u.role || '').toLowerCase();
    const filterLower = selectedRoleFilter.toLowerCase();

    let matchesRole = false;
    if (filterLower === 'all') {
      matchesRole = true;
    } else if (filterLower === 'volunteer') {
      matchesRole = userRoleLower === 'volunteer' || Boolean(u.is_approved_volunteer);
    } else if (filterLower === 'admin') {
      matchesRole = userRoleLower === 'admin' || userRoleLower === 'superadmin';
    } else {
      matchesRole = userRoleLower === filterLower;
    }

    const query = userSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.reg_no ? u.reg_no.toLowerCase().includes(query) : false) ||
      (u.volunteer_id ? u.volunteer_id.toLowerCase().includes(query) : false) ||
      (u.phone ? u.phone.toLowerCase().includes(query) : false);

    return matchesRole && matchesSearch;
  });

  const handleApproveAdmin = async (userId: number, name: string) => {
    setAdminActionLoadingId(userId);
    try {
      await approveAdminApi(userId);
      showToast(`Admin application for ${name} approved!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve admin.', 'error');
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  const handleRejectAdmin = async (userId: number, name: string) => {
    if (!confirm(`Are you sure you want to reject admin request for ${name}?`)) return;
    setAdminActionLoadingId(userId);
    try {
      await rejectAdminApi(userId);
      showToast(`Admin application for ${name} rejected.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject admin.', 'error');
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  const adminUsers = allUsers.filter((u) => u.role === 'admin' || u.role === 'superadmin');
  const pendingAdminRequests = adminUsers.filter((u) => u.status === 'pending');
  const approvedAdmins = adminUsers.filter((u) => u.status !== 'pending');

  const sidebarItems = [
    ...(user?.role === 'superadmin'
      ? [
          {
            id: 'governance',
            label: `Root Governance${pendingAdminRequests.length > 0 ? ` (${pendingAdminRequests.length})` : ''}`,
            icon: ShieldCheck,
          },
        ]
      : []),
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Platform Events', icon: Calendar },
    { id: 'pending-approvals', label: `Pending Approvals (${pendingEvents.length})`, icon: Clock },
    { id: 'payments', label: `Payments Queue (${pendingPayments.length})`, icon: CreditCard },
    { id: 'registrations', label: `Registrations (${allRegistrations.length})`, icon: Users },
    { id: 'users', label: `Users (${allUsers.length})`, icon: Shield },
    { id: 'volunteers', label: 'Volunteers Oversight', icon: UserCheck },
    { id: 'profile', label: 'Admin Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Mobile Navigation Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-[var(--sidebar-top)] z-20 shadow-xs transition-[top] duration-250 ease-in-out motion-reduce:transition-none">
        <div className="flex items-center gap-2">
          <ZeroQLogo size="sm" />
          <div className="border-l border-slate-200 pl-2">
            <h2 className="text-xs font-bold text-[#0F172A]">Admin Portal</h2>
            <p className="text-[10px] text-[#1D4ED8] font-semibold">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-[var(--sidebar-top)] left-0 z-30 w-60 h-[var(--sidebar-height)] bg-[#0B132B] text-white border-r border-slate-800 flex flex-col justify-between transition-[top,height,transform] duration-250 ease-in-out motion-reduce:transition-none overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4">
          <div className="hidden lg:flex flex-col gap-2 pb-3 border-b border-slate-800">
            <ZeroQLogo size="md" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Admin Console</span>
              <span className="text-[10px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.5 rounded border border-[#06B6D4]/30 uppercase">
                {user?.role}
              </span>
            </div>
          </div>

          <nav className="space-y-0.5">
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
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="p-2.5 bg-[#0F172A] rounded-lg border border-slate-800 text-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Administrator</span>
            <p className="font-semibold text-white truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Governance Tab for Superadmin */}
        {activeTab === 'governance' && user?.role === 'superadmin' && (
          <div className="space-y-6">
            <PageHeader
              eyebrow="ROOT GOVERNANCE"
              title="Superadmin Control Center"
              description="Review administrator access requests and manage platform governance."
              actions={
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              }
            />

            {/* Governance System Notice */}
            <div className="p-4 bg-[#0B132B] text-white border border-[#1D4ED8]/30 rounded-xl space-y-1.5 text-xs shadow-sm">
              <div className="flex items-center gap-1.5 text-[#06B6D4] font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Superadmin System Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Admin registration requests require superadmin verification before access is granted.
              </p>
            </div>

            {/* Tab Selection */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setGovernanceSubTab('requests')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  governanceSubTab === 'requests'
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Admin Applications ({pendingAdminRequests.length})
              </button>
              <button
                onClick={() => setGovernanceSubTab('admins')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  governanceSubTab === 'admins'
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Active Administrators ({approvedAdmins.length})
              </button>
            </div>

            {/* Sub-Tab 1: Pending Admin Requests */}
            {governanceSubTab === 'requests' && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Pending Administrator Applications</h3>
                {pendingAdminRequests.length === 0 ? (
                  <div className="text-center py-8 space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-[#1D4ED8] mx-auto" />
                    <p className="text-xs text-slate-500">No pending administrator applications awaiting approval.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-[#0B132B]/5 text-[#0F172A] font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Applicant Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Reg Number</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingAdminRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-[#0F172A]">{req.name}</td>
                            <td className="p-2.5 text-slate-600">{req.email}</td>
                            <td className="p-2.5 font-mono">{req.reg_no || '-'}</td>
                            <td className="p-2.5">{req.phone}</td>
                            <td className="p-2.5">
                              <StatusBadge status={req.status} />
                            </td>
                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveAdmin(req.id, req.name)}
                                  disabled={adminActionLoadingId === req.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectAdmin(req.id, req.name)}
                                  disabled={adminActionLoadingId === req.id}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Approved Platform Administrators */}
            {governanceSubTab === 'admins' && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Platform Administrators</h3>
                {approvedAdmins.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No platform administrators registered.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-[#0B132B]/5 text-[#0F172A] font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Admin Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Reg Number</th>
                          <th className="p-2.5">Role</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {approvedAdmins.map((adm) => (
                          <tr key={adm.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-[#0F172A]">{adm.name}</td>
                            <td className="p-2.5 text-slate-600">{adm.email}</td>
                            <td className="p-2.5 font-mono">{adm.reg_no || '-'}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1D4ED8]/10 text-[#1D4ED8] border border-[#1D4ED8]/20">
                                {adm.role}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contextual Page Header based on Active Tab */}
        {activeTab === 'overview' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="System Overview"
            description="Platform-wide operational statistics, event health, and user metrics."
            actions={
              <button
                onClick={loadData}
                className="p-2 bg-[#1D4ED8]/10 text-[#1D4ED8] hover:bg-[#1D4ED8]/20 rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Data"
                aria-label="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            }
          />
        )}

        {activeTab === 'events' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="Platform Events"
            description="Audit, monitor, and configure university events across all departments."
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2 bg-[#1D4ED8]/10 text-[#1D4ED8] hover:bg-[#1D4ED8]/20 rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                  title="Refresh Data"
                  aria-label="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsCreateEventOpen(true)}
                  className="flex items-center gap-1.5 bg-[#FF5E36] hover:bg-[#F97316] text-white px-3.5 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Event
                </button>
              </div>
            }
          />
        )}

        {activeTab === 'pending-approvals' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="Pending Event Approvals"
            description="Review and authorize event submissions submitted by campus organizers."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Approvals"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'payments' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="Payment Verification Queue"
            description="Audit student transaction screenshots and verify payment validity."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Payments"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'registrations' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="All Event Registrations"
            description="Inspect attendee passes and registration statuses across all active events."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Registrations"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'users' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="User Directory"
            description="Manage platform accounts, role classifications, and user permissions."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'volunteers' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="Volunteer Operations & Gate Oversight"
            description="Audit volunteer staffing fulfillment, station assignments, and gate operations."
            actions={
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Staffing"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          />
        )}

        {activeTab === 'profile' && (
          <PageHeader
            eyebrow="ADMINISTRATION PORTAL"
            title="Admin Profile"
            description="Manage administrator credentials and account security settings."
            actions={
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                Change Password
              </button>
            }
          />
        )}

        {/* Action Confirmation Message */}
        {toastMessage && (
          <div
            className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
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
              <div className="bg-white p-4 rounded border border-[#CBE6C8] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#6B8B74] uppercase">Live Events</span>
                  <Calendar className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-2xl font-bold text-[#0F2417]">{allEvents.length}</span>
                <p className="text-[10px] text-[#6B8B74]">Total platform events</p>
              </div>

              <div className="bg-white p-4 rounded border border-[#CBE6C8] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#6B8B74] uppercase">Pending Reviews</span>
                  <Clock className="w-4 h-4 text-[#854D0E]" />
                </div>
                <span className="text-2xl font-bold text-[#0F2417]">{pendingEvents.length}</span>
                <p className="text-[10px] text-[#6B8B74]">Events awaiting approval</p>
              </div>

              <div className="bg-white p-4 rounded border border-[#CBE6C8] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#6B8B74] uppercase">Registrations</span>
                  <Users className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-2xl font-bold text-[#0F2417]">{allRegistrations.length}</span>
                <p className="text-[10px] text-[#6B8B74]">Total passes issued</p>
              </div>

              <div className="bg-white p-4 rounded border border-[#CBE6C8] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#6B8B74] uppercase">Pending Payments</span>
                  <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-2xl font-bold text-[#0F2417]">{pendingPayments.length}</span>
                <p className="text-[10px] text-[#6B8B74]">Verification required</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLATFORM EVENTS */}
        {activeTab === 'events' && (
          <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
            {allEvents.length === 0 ? (
              <p className="text-xs text-[#6B8B74] py-6 text-center">No events found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-[#F4FAF2] rounded border border-[#CBE6C8] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#0F2417]">{ev.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E5F5E0] text-[#1D4ED8] border border-[#74C476]">
                          {ev.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#3D5A45] line-clamp-2">{ev.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#3D5A45] pt-2 border-t border-[#CBE6C8]">
                        <div>
                          <span className="block font-semibold text-[#6B8B74] text-[10px]">VENUE</span>
                          <span className="font-medium text-[#0F2417]">{ev.venue}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-[#6B8B74] text-[10px]">DATE</span>
                          <span className="font-medium text-[#0F2417]">{ev.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#CBE6C8]">
                      {(ev.status.toUpperCase() === 'APPROVED' || ev.status.toUpperCase() === 'UPCOMING') && (
                        <button
                          onClick={() => handleActivateEvent(ev.id)}
                          className="px-2.5 py-1 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      {ev.status.toUpperCase() === 'ACTIVE' && (
                        <button
                          onClick={() => handleCompleteEvent(ev.id)}
                          className="px-2.5 py-1 bg-[#F4FAF2] hover:bg-slate-200 text-[#0F2417] border border-[#CBE6C8] font-bold text-xs rounded cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(ev)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-200 font-bold text-xs rounded cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PENDING APPROVALS */}
        {activeTab === 'pending-approvals' && (
          <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
            {pendingEvents.length === 0 ? (
              <p className="text-xs text-[#6B8B74] py-6 text-center">No pending events.</p>
            ) : (
              <div className="space-y-3">
                {pendingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-[#F4FAF2] rounded border border-[#CBE6C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#0F2417]">{ev.title}</h4>
                      <p className="text-xs text-[#3D5A45]">{ev.description}</p>
                      <p className="text-[10px] text-[#6B8B74]">
                        Venue: {ev.venue} • Date: {ev.date} • Capacity: {ev.capacity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveEvent(ev.id)}
                        className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedEventToReject(ev)}
                        className="px-3 py-1.5 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] font-bold text-xs rounded cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PAYMENTS QUEUE */}
        {activeTab === 'payments' && (
          <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-[#6B8B74] py-6 text-center">No pending payments.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="bg-[#F4FAF2] border border-[#CBE6C8] rounded p-3.5 space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#0F2417]">Pass #{pay.registration_id}</span>
                      <span className="font-bold text-xs text-[#1D4ED8] block">₹{pay.amount}</span>
                    </div>

                    <div className="h-36 bg-white rounded border border-[#CBE6C8] overflow-hidden flex items-center justify-center">
                      <img
                        src={getPaymentScreenshotUrl(pay.screenshot_path)}
                        alt="Payment Screenshot"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setSelectedPaymentToReview(pay)}
                      />
                    </div>

                    <button
                      onClick={() => setSelectedPaymentToReview(pay)}
                      className="w-full py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded flex items-center justify-center gap-1 cursor-pointer"
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

        {/* TAB 5: REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
            {allRegistrations.length === 0 ? (
              <p className="text-xs text-[#6B8B74] py-6 text-center">No registrations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#0F2417]">
                  <thead className="bg-[#F4FAF2] text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-[#CBE6C8]">
                    <tr>
                      <th className="p-2.5">Pass ID</th>
                      <th className="p-2.5">User ID</th>
                      <th className="p-2.5">Event ID</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5F5E0]">
                    {allRegistrations.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F4FAF2]">
                        <td className="p-2.5 font-bold">#Pass-{r.id}</td>
                        <td className="p-2.5">User #{r.user_id}</td>
                        <td className="p-2.5">Event #{r.event_id}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E5F5E0] text-[#1D4ED8]">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs font-semibold text-[#0F2417]"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>

                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B8B74]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search name, email..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>
            </div>

            {usersError ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-red-600 font-semibold">{usersError}</p>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Loading Users
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-xs text-[#6B8B74] py-6 text-center">No users match criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#0F2417]">
                  <thead className="bg-[#F4FAF2] text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-[#CBE6C8]">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Reg / Volunteer Code</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5F5E0]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F4FAF2]">
                        <td className="p-2.5 font-bold">#{u.id}</td>
                        <td className="p-2.5 font-semibold">{u.name}</td>
                        <td className="p-2.5 text-[#3D5A45]">{u.email}</td>
                        <td className="p-2.5 font-mono text-[11px]">{u.volunteer_id || u.reg_no || 'N/A'}</td>
                        <td className="p-2.5 text-[#3D5A45]">{u.phone || 'N/A'}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E5F5E0] text-[#1D4ED8]">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: VOLUNTEERS OVERSIGHT (UNIFIED SINGLE SOURCE OF TRUTH) */}
        {activeTab === 'volunteers' && (
          <div className="space-y-5">
            {/* Top Control Header */}
            <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5F5E0] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F2417] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#1D4ED8]" />
                    Volunteer Operations Oversight
                  </h3>
                  <p className="text-xs text-[#3D5A45] mt-0.5">
                    Platform-wide volunteer management: Openings, candidate applications review, and gate allocation roster.
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
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs font-semibold text-[#0F2417] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value="all">All Platform Events ({allEvents.length})</option>
                    {allEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedEventForVolunteers !== 'all') {
                        setBroadcastEventId(selectedEventForVolunteers);
                      } else if (allEvents.length > 0) {
                        setBroadcastEventId(allEvents[0].id);
                      }
                      setIsBroadcastModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Broadcast to Volunteers
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              {(() => {
                const filteredOpenings = volunteerOpenings.filter((o) =>
                  selectedEventForVolunteers === 'all' ? true : o.event_id === selectedEventForVolunteers
                );
                const filteredApps = volunteerApplications.filter((app) =>
                  selectedEventForVolunteers === 'all' ? true : app.event_id === selectedEventForVolunteers
                );
                const filteredApproved = approvedVolunteers.filter((appr) =>
                  selectedEventForVolunteers === 'all' ? true : appr.event_id === selectedEventForVolunteers
                );
                const pendingCount = filteredApps.filter((a) => a.status === 'pending').length;
                const unassignedCount = filteredApproved.filter((v) => !v.assigned_position).length;
                const assignedCount = filteredApproved.filter((v) => !!v.assigned_position).length;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8]">
                      <span className="text-[10px] font-bold text-[#6B8B74] uppercase block">Platform Openings</span>
                      <span className="text-xl font-bold text-[#0F2417]">{filteredOpenings.length}</span>
                    </div>
                    <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8]">
                      <span className="text-[10px] font-bold text-[#6B8B74] uppercase block">Applications Pending</span>
                      <span className={`text-xl font-bold ${pendingCount > 0 ? 'text-[#854D0E]' : 'text-[#0F2417]'}`}>
                        {pendingCount}
                      </span>
                    </div>
                    <div className="p-3 bg-[#E5F5E0] rounded border border-[#74C476]">
                      <span className="text-[10px] font-bold text-[#1D4ED8] uppercase block">Approved Volunteers</span>
                      <span className="text-xl font-bold text-[#1D4ED8]">{filteredApproved.length}</span>
                    </div>
                    <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8]">
                      <span className="text-[10px] font-bold text-[#6B8B74] uppercase block">Gate Roster</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#1D4ED8]">{assignedCount} Assigned</span>
                        <span className="text-xs text-[#6B8B74]">•</span>
                        <span className="text-xs font-bold text-[#854D0E]">{unassignedCount} Unassigned</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 1: Volunteer Openings */}
            <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5F5E0] pb-2">
                <h4 className="text-xs font-bold text-[#0F2417] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#1D4ED8]" />
                  1. Active Volunteer Openings
                </h4>
                <span className="text-[10px] text-[#6B8B74] font-semibold">
                  Platform-wide volunteer requirements
                </span>
              </div>

              {(() => {
                const filteredOpenings = volunteerOpenings.filter((o) =>
                  selectedEventForVolunteers === 'all' ? true : o.event_id === selectedEventForVolunteers
                );

                if (filteredOpenings.length === 0) {
                  return <p className="text-xs text-[#6B8B74] py-4 text-center">No openings found for this event selection.</p>;
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredOpenings.map((op) => (
                      <div key={op.id} className="p-3.5 bg-[#F4FAF2] rounded border border-[#CBE6C8] space-y-2">
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <h5 className="text-xs font-bold text-[#0F2417]">{op.role}</h5>
                            <p className="text-[10px] text-[#1D4ED8] font-semibold">{op.event_title}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              op.status === 'open'
                                ? 'bg-[#E5F5E0] text-[#1D4ED8] border-[#74C476]'
                                : 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171]'
                            }`}
                          >
                            {op.status}
                          </span>
                        </div>
                        {op.description && <p className="text-[11px] text-[#3D5A45] line-clamp-2">{op.description}</p>}
                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#CBE6C8] text-center text-xs">
                          <div className="bg-white p-1 rounded border border-[#CBE6C8]">
                            <span className="text-[9px] text-[#6B8B74] block">NEEDED</span>
                            <span className="font-bold">{op.volunteers_needed}</span>
                          </div>
                          <div className="bg-white p-1 rounded border border-[#CBE6C8]">
                            <span className="text-[9px] text-[#6B8B74] block">APPLIED</span>
                            <span className="font-bold">{op.applications_count}</span>
                          </div>
                          <div className="bg-white p-1 rounded border border-[#CBE6C8]">
                            <span className="text-[9px] text-[#6B8B74] block">APPROVED</span>
                            <span className="font-bold text-[#1D4ED8]">{op.approved_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 2: Volunteer Applications Queue */}
            <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5F5E0] pb-2">
                <h4 className="text-xs font-bold text-[#0F2417] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#1D4ED8]" />
                  2. Candidate Applications Queue
                </h4>
                <span className="text-[10px] text-[#6B8B74] font-semibold">
                  Review & Approve Volunteer Candidates
                </span>
              </div>

              {(() => {
                const filteredApps = volunteerApplications.filter((app) =>
                  selectedEventForVolunteers === 'all' ? true : app.event_id === selectedEventForVolunteers
                );

                if (filteredApps.length === 0) {
                  return <p className="text-xs text-[#6B8B74] py-4 text-center">No volunteer applications in queue.</p>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#0F2417] bg-white rounded border border-[#CBE6C8]">
                      <thead className="bg-[#F4FAF2] text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-[#CBE6C8]">
                        <tr>
                          <th className="p-2.5">Candidate</th>
                          <th className="p-2.5">Event & Role</th>
                          <th className="p-2.5">Experience / Notes</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5F5E0]">
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="hover:bg-[#F4FAF2]">
                            <td className="p-2.5">
                              <span className="font-semibold text-[#0F2417] block">{app.student_name}</span>
                              <span className="text-[10px] text-[#6B8B74] block">{app.student_email}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-[#0F2417] block">{app.role_name || 'Gate Volunteer'}</span>
                              <span className="text-[10px] text-[#1D4ED8] font-medium block">{app.event_title}</span>
                            </td>
                            <td className="p-2.5 text-[11px] text-[#3D5A45]">{app.experience || 'N/A'}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  app.status === 'approved'
                                    ? 'bg-[#E5F5E0] text-[#1D4ED8] border-[#74C476]'
                                    : app.status === 'pending'
                                    ? 'bg-amber-100 text-[#854D0E] border-amber-200'
                                    : 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171]'
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
                                    className="px-2.5 py-1 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-[11px] rounded cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectVolunteer(app.id)}
                                    className="px-2.5 py-1 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] font-bold text-[11px] rounded cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-[#6B8B74]">{app.status}</span>
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
            <div className="bg-white p-5 rounded border border-[#CBE6C8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5F5E0] pb-2">
                <h4 className="text-xs font-bold text-[#0F2417] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1D4ED8]" />
                  3. Approved Volunteers & Gate Allocation Roster
                </h4>
                <span className="text-[10px] text-[#6B8B74] font-semibold">
                  Decoupled location assignments
                </span>
              </div>

              {(() => {
                const filteredApproved = approvedVolunteers.filter((v) =>
                  selectedEventForVolunteers === 'all' ? true : v.event_id === selectedEventForVolunteers
                );

                if (filteredApproved.length === 0) {
                  return <p className="text-xs text-[#6B8B74] py-4 text-center">No approved volunteers for this selection.</p>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#0F2417] bg-white rounded border border-[#CBE6C8]">
                      <thead className="bg-[#F4FAF2] text-[#1D4ED8] font-bold uppercase text-[10px] border-b border-[#CBE6C8]">
                        <tr>
                          <th className="p-2.5">Volunteer</th>
                          <th className="p-2.5">Event & Role</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Allocated Gate / Area</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5F5E0]">
                        {filteredApproved.map((vol) => (
                          <tr key={vol.application_id} className="hover:bg-[#F4FAF2]">
                            <td className="p-2.5">
                              <span className="font-semibold text-[#0F2417] block">{vol.student_name}</span>
                              <span className="text-[10px] text-[#6B8B74] block">{vol.student_email}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-[#0F2417] block">{vol.role_name}</span>
                              <span className="text-[10px] text-[#1D4ED8] font-medium block">{vol.event_title}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E5F5E0] text-[#1D4ED8] border border-[#74C476] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#1D4ED8]" />
                                Approved
                              </span>
                            </td>
                            <td className="p-2.5">
                              {vol.assigned_position ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E5F5E0] text-[#1D4ED8] border border-[#74C476]">
                                  <MapPin className="w-3 h-3" />
                                  {vol.assigned_position}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-[#854D0E] border border-amber-200">
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
                                className="px-2.5 py-1 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-[11px] rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                {vol.assigned_position ? 'Change Location' : 'Assign Gate'}
                              </button>
                              {vol.assignment_id && (
                                <button
                                  onClick={() => handleRemoveAssignment(vol.assignment_id!)}
                                  className="px-2.5 py-1 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] font-bold text-[11px] rounded cursor-pointer transition-colors"
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

        {/* TAB 8: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded border border-[#CBE6C8] shadow-xs max-w-lg mx-auto space-y-4">
            {avatarSuccessMsg && (
              <div className="p-3 bg-[#F4FAF2] border border-[#74C476] text-[#1D4ED8] text-xs rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#74C476] shrink-0" />
                  <span>{avatarSuccessMsg}</span>
                </div>
                <button onClick={() => setAvatarSuccessMsg(null)} className="text-[#6B8B74] hover:text-[#0F2417]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {avatarErrorMsg && (
              <div className="p-3 bg-[#FEE2E2] border border-rose-300 text-[#991B1B] text-xs rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{avatarErrorMsg}</span>
                </div>
                <button onClick={() => setAvatarErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5F5E0] pb-4 gap-4">
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img
                    src={getFileUrl(user.avatar_url)}
                    alt={user?.name}
                    className="w-14 h-14 rounded object-cover border border-[#74C476]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-[#1D4ED8] text-white font-bold text-lg flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[#0F2417]">{user?.name}</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] uppercase">
                    {user?.role} Administrator
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer px-3 py-1.5 bg-[#E5F5E0] hover:bg-[#d8eed2] text-[#1D4ED8] border border-[#74C476] rounded text-xs font-bold transition-colors flex items-center gap-1.5">
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
                    className="px-2.5 py-1.5 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] border border-rose-300 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8] space-y-0.5">
                <span className="text-[#6B8B74] font-semibold text-[10px] uppercase block">Email</span>
                <p className="font-semibold text-[#0F2417]">{user?.email}</p>
              </div>

              <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8] space-y-0.5">
                <span className="text-[#6B8B74] font-semibold text-[10px] uppercase block">Registration Number</span>
                <p className="font-semibold text-[#0F2417]">{user?.reg_no}</p>
              </div>

              <div className="p-3 bg-[#F4FAF2] rounded border border-[#CBE6C8] space-y-0.5">
                <span className="text-[#6B8B74] font-semibold text-[10px] uppercase block">Phone</span>
                <p className="font-semibold text-[#0F2417]">{user?.phone}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E5F5E0]">
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex-1 py-2 bg-[#E5F5E0] hover:bg-[#d8eed2] text-[#1D4ED8] rounded font-bold text-xs border border-[#74C476] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                Change Password
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] rounded font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

        {/* Modal: Payment Review */}
        {selectedPaymentToReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white rounded border border-[#CBE6C8] p-5 max-w-md w-full space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F2417]">Payment Screenshot Review</h3>
                <button
                  onClick={() => setSelectedPaymentToReview(null)}
                  className="text-[#6B8B74] hover:text-[#0F2417]"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#3D5A45]">
                Pass #{selectedPaymentToReview.registration_id} • Amount: ₹{selectedPaymentToReview.amount}
              </p>

              <div className="h-56 bg-[#F4FAF2] rounded border border-[#CBE6C8] flex items-center justify-center overflow-hidden">
                <img
                  src={getPaymentScreenshotUrl(selectedPaymentToReview.screenshot_path)}
                  alt="Payment Screenshot"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F2417]">Rejection Reason (if rejecting)</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid transaction reference"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E5F5E0]">
                <button
                  onClick={() => setSelectedPaymentToReview(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#3D5A45] bg-[#F4FAF2] rounded hover:bg-slate-100"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRejectPayment}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] font-bold text-xs rounded disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprovePayment(selectedPaymentToReview.id)}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded disabled:opacity-50 cursor-pointer"
                  >
                    Approve Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Event Rejection Reason */}
        {selectedEventToReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white rounded border border-[#CBE6C8] p-5 max-w-sm w-full space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-[#0F2417]">Reject Event Submission</h3>
              <p className="text-xs text-[#3D5A45]">Provide reason for rejecting this event draft.</p>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason..."
                className="w-full p-2.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedEventToReject(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#3D5A45] bg-[#F4FAF2] rounded hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectEvent}
                  className="px-3 py-1.5 bg-[#FEE2E2] hover:bg-rose-200 text-[#991B1B] font-bold text-xs rounded cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Event */}
        {isCreateEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white rounded border border-[#CBE6C8] p-5 max-w-md w-full space-y-3 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F2417]">Create New Event</h3>
                <button
                  onClick={() => setIsCreateEventOpen(false)}
                  className="text-[#6B8B74] hover:text-[#0F2417]"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Event Title"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Details..."
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Venue</label>
                    <input
                      type="text"
                      required
                      value={newEventVenue}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      placeholder="Main Hall"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Capacity</label>
                    <input
                      type="number"
                      required
                      value={newEventCapacity}
                      onChange={(e) => setNewEventCapacity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newEventPrice}
                      onChange={(e) => setNewEventPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-[#E5F5E0]">
                  <button
                    type="button"
                    onClick={() => setIsCreateEventOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold text-[#3D5A45] bg-[#F4FAF2] rounded hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded cursor-pointer"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Volunteer Gate / Area */}
        {selectedVolunteerForAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-[#CBE6C8] rounded p-5 w-full max-w-sm space-y-3 relative shadow-lg">
              <button
                onClick={() => setSelectedVolunteerForAssignment(null)}
                className="absolute top-4 right-4 text-[#6B8B74] hover:text-[#0F2417]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F2417] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1D4ED8]" />
                  Admin Gate / Area Assignment
                </h3>
                <p className="text-xs text-[#3D5A45]">
                  {selectedVolunteerForAssignment.volunteerName} • {selectedVolunteerForAssignment.roleName}
                </p>
                <p className="text-[11px] font-semibold text-[#1D4ED8]">
                  {selectedVolunteerForAssignment.eventTitle}
                </p>
              </div>

              <form onSubmit={handleAssignVolunteerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">
                    Select Preset or Enter Location *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['Gate 1', 'Gate 2', 'Gate 3', 'Main Gate — Scanner 01', 'Registration Desk', 'Help Desk'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAssignPositionInput(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                          assignPositionInput === preset
                            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                            : 'bg-[#F4FAF2] text-[#0F2417] border-[#CBE6C8] hover:bg-[#E5F5E0]'
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
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="flex gap-2 pt-1 border-t border-[#E5F5E0]">
                  <button
                    type="button"
                    onClick={() => setSelectedVolunteerForAssignment(null)}
                    className="flex-1 py-1.5 bg-[#F4FAF2] text-[#3D5A45] font-bold text-xs rounded hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded cursor-pointer"
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
            <div className="bg-white border border-[#CBE6C8] rounded p-5 w-full max-w-md space-y-3 relative shadow-lg">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="absolute top-4 right-4 text-[#6B8B74] hover:text-[#0F2417]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F2417] flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#1D4ED8]" />
                  Broadcast to Volunteers
                </h3>
                <p className="text-xs text-[#3D5A45]">
                  Send live instructions to volunteers of a specific event.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-2.5 bg-[#E5F5E0] border border-[#74C476] text-[#1D4ED8] text-xs rounded font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              {broadcastError && (
                <div className="p-2.5 bg-[#FEE2E2] border border-[#F87171] text-[#991B1B] text-xs rounded font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Select Event *</label>
                  <select
                    required
                    value={broadcastEventId}
                    onChange={(e) => setBroadcastEventId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs font-semibold text-[#0F2417] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value={0} disabled>Choose an event...</option>
                    {allEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scanner Sync Update"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Message to volunteers..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="flex gap-2 pt-1 border-t border-[#E5F5E0]">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="flex-1 py-1.5 bg-[#F4FAF2] text-[#3D5A45] font-bold text-xs rounded hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="flex-1 py-1.5 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: Edit Event Details (Admin) */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white border border-[#CBE6C8] rounded p-5 w-full max-w-lg space-y-4 relative shadow-xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingEvent(null)}
                className="absolute top-4 right-4 text-[#6B8B74] hover:text-[#0F2417]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#0F2417] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#1D4ED8]" />
                  Edit Event Details (Admin)
                </h3>
                <p className="text-xs text-[#6B8B74]">
                  Update details for Event #{editingEvent.id} ({editingEvent.title})
                </p>
              </div>

              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2417] mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Capacity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Entry Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2417] mb-1">Volunteer Limit *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editVolunteersLimit}
                      onChange={(e) => setEditVolunteersLimit(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBE6C8] rounded text-xs focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#E5F5E0]">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 py-2 bg-[#F4FAF2] text-[#3D5A45] font-bold text-xs rounded hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-2 bg-[#1D4ED8] hover:bg-[#004727] text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50 shadow-xs"
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
