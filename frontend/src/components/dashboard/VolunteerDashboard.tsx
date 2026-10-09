import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import {
  getMyVolunteerAssignmentApi,
  getAvailableVolunteerEventsApi,
  applyAsVolunteerApi,
  getMyVolunteerApplicationsApi,
} from '../../api/volunteers';
import { checkInRegistrationApi } from '../../api/registrations';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { BecomeVolunteerModal } from '../auth/BecomeVolunteerModal';
import type {
  MyVolunteerAssignment,
  AvailableVolunteerEvent,
  VolunteerApplication,
  VolunteerOpening,
  AssignmentItem,
} from '../../types';
import {
  QrCode,
  AlertTriangle,
  LogOut,
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  MapPin,
  AlertCircle,
  X,
  Calendar,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Compass,
  Upload,
  Trash2,
} from 'lucide-react';

import { getFileUrl } from '../../api/events';
import { PageHeader } from '../common/PageHeader';

interface ScanHistoryItem {
  id: string;
  name: string;
  regId: string;
  time: string;
  status: 'Checked In' | 'Already Checked In' | 'Invalid Pass' | 'Not Found' | 'Invalid for this event';
  message?: string;
}

export const VolunteerDashboard: React.FC = () => {
  const { user, logout, uploadAvatar, deleteAvatar, updateBio } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'explore' | 'scan'>('profile');

  // Bio / Skills state
  const [bioInput, setBioInput] = useState<string>(user?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSuccessMsg, setBioSuccessMsg] = useState<string | null>(null);
  const [bioErrorMsg, setBioErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.bio !== undefined) {
      setBioInput(user.bio || '');
    }
  }, [user?.bio]);

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);
    setBioSuccessMsg(null);
    setBioErrorMsg(null);
    try {
      await updateBio(bioInput.trim());
      setBioSuccessMsg('Profile bio & skills updated successfully.');
    } catch (err: any) {
      setBioErrorMsg(err.response?.data?.detail || 'Failed to update bio.');
    } finally {
      setIsSavingBio(false);
    }
  };

  // Assignment state
  const [assignmentData, setAssignmentData] = useState<MyVolunteerAssignment | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);

  // Available opportunities & user applications
  const [availableEvents, setAvailableEvents] = useState<AvailableVolunteerEvent[]>([]);
  const [myApplications, setMyApplications] = useState<VolunteerApplication[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [applyingEventId, setApplyingEventId] = useState<number | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // Application Modal state
  const [selectedApplyEvent, setSelectedApplyEvent] = useState<AvailableVolunteerEvent | null>(null);
  const [selectedApplyOpening, setSelectedApplyOpening] = useState<VolunteerOpening | null>(null);
  const [applyExperience, setApplyExperience] = useState<string>('');

  // Avatar Management state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'already' | 'error';
    title: string;
    message: string;
    studentName?: string;
    eventTitle?: string;
    checkedInAt?: string;
  } | null>(null);

  // REAL SCAN HISTORY
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-full-region';

  // Modals
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBecomeVolunteerOpen, setIsBecomeVolunteerOpen] = useState(false);

  // Fetch initial assignment & applications
  const loadAssignment = async () => {
    setIsLoadingAssignment(true);
    try {
      const data = await getMyVolunteerAssignmentApi();
      setAssignmentData(data);
      if (data.has_assignment && data.all_assignments && data.all_assignments.length > 0) {
        setSelectedAssignmentId(data.all_assignments[0].assignment_id);
      }
    } catch (err) {
      console.error('Failed to load volunteer assignment:', err);
    } finally {
      setIsLoadingAssignment(false);
    }
  };

  const loadOpportunities = async () => {
    setIsLoadingOpportunities(true);
    try {
      const [eventsList, appsList] = await Promise.all([
        getAvailableVolunteerEventsApi(),
        getMyVolunteerApplicationsApi(),
      ]);
      setAvailableEvents(eventsList);
      setMyApplications(appsList);
    } catch (err) {
      console.error('Failed to load volunteer opportunities:', err);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    loadAssignment();
    loadOpportunities();
  }, []);

  useEffect(() => {
    if (activeTab === 'explore') {
      loadOpportunities();
      stopCamera();
    } else if (activeTab === 'profile') {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Avatar Handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      await uploadAvatar(file);
    } catch (err: any) {
      setAvatarError(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      await deleteAvatar();
    } catch (err: any) {
      setAvatarError(err.response?.data?.detail || 'Failed to remove photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Submit Application
  const submitApplicationModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplyEvent) return;
    setApplyingEventId(selectedApplyEvent.id);
    setApplyMessage(null);
    try {
      const res = await applyAsVolunteerApi(
        selectedApplyEvent.id,
        selectedApplyOpening?.id,
        applyExperience.trim() || undefined
      );
      setApplyMessage(res.message || 'Application submitted successfully.');
      setSelectedApplyEvent(null);
      setSelectedApplyOpening(null);
      setApplyExperience('');
      loadOpportunities();
      loadAssignment();
    } catch (err: any) {
      setApplyMessage(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setApplyingEventId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeAssignmentsList = (assignmentData?.all_assignments || []).filter((a) => {
    if (!a.event_date) return true;
    return a.event_date >= todayStr;
  });
  const currentAssignment: AssignmentItem | null =
    activeAssignmentsList.find((a) => a.assignment_id === selectedAssignmentId) ||
    (activeAssignmentsList.length > 0 ? activeAssignmentsList[0] : null);

  const volunteerIdDisplay = assignmentData?.volunteer_id || user?.volunteer_id || `ZQ-VOL-${String(user?.id || 1).padStart(6, '0')}`;

  const rawEventStatus = (currentAssignment?.event_status || assignmentData?.event_status || '').toLowerCase();
  const isApproved = assignmentData?.application_status === 'approved' || myApplications.some((a) => a.status === 'approved');
  const hasActiveAssignment = !!assignmentData?.has_assignment && !!currentAssignment;
  const isEventActive = rawEventStatus === 'active';

  const canScan = isApproved && hasActiveAssignment && isEventActive;

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        onQrCodeScanned,
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setIsCameraActive(false);
      setCameraError(
        err?.message || 'Could not access camera. Check browser permissions.'
      );
    }
  };

  const processScanToken = async (token: string) => {
    if (!token.trim()) return;

    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.pause(true);
      } catch (_e) {
        console.error('Pause failed:', _e);
      }
    }

    setIsVerifying(true);
    setScanResult(null);

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const response = await checkInRegistrationApi(undefined, token.trim());
      const studentName = response.student_name || 'Verified Attendee';

      setScanResult({
        type: 'success',
        title: 'VALID — CHECK-IN SUCCESSFUL',
        message: 'Pass validated successfully. Attendee marked present.',
        studentName: studentName,
        eventTitle: response.event_title,
        checkedInAt: response.checked_in_at,
      });

      setScanHistory((prev) => [
        {
          id: String(Date.now()),
          name: studentName,
          regId: `REG-#${response.registration_id}`,
          time: currentTimeStr,
          status: 'Checked In',
        },
        ...prev,
      ]);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Validation failed for this QR code.';

      if (errorDetail.includes('ALREADY CHECKED IN')) {
        setScanResult({
          type: 'already',
          title: 'ALREADY CHECKED IN',
          message: errorDetail,
        });
        setScanHistory((prev) => [
          {
            id: String(Date.now()),
            name: 'Duplicate Scan Attempt',
            regId: token.length > 10 ? `${token.slice(0, 8)}...` : token,
            time: currentTimeStr,
            status: 'Already Checked In',
            message: errorDetail,
          },
          ...prev,
        ]);
      } else if (errorDetail.includes('INVALID FOR THIS EVENT')) {
        setScanResult({
          type: 'error',
          title: 'INVALID FOR THIS EVENT',
          message: errorDetail,
        });
        setScanHistory((prev) => [
          {
            id: String(Date.now()),
            name: 'Wrong Event Pass',
            regId: token.length > 10 ? `${token.slice(0, 8)}...` : token,
            time: currentTimeStr,
            status: 'Invalid for this event',
            message: errorDetail,
          },
          ...prev,
        ]);
      } else {
        setScanResult({
          type: 'error',
          title: 'INVALID TICKET',
          message: errorDetail,
        });
        setScanHistory((prev) => [
          {
            id: String(Date.now()),
            name: 'Invalid Ticket',
            regId: token.length > 10 ? `${token.slice(0, 8)}...` : token,
            time: currentTimeStr,
            status: 'Invalid Pass',
            message: errorDetail,
          },
          ...prev,
        ]);
      }
    } finally {
      setIsVerifying(false);
      setManualTokenInput('');
    }
  };

  const onQrCodeScanned = (decodedText: string) => {
    processScanToken(decodedText);
  };

  const resumeScanning = async () => {
    setScanResult(null);
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === 3) {
          await scannerRef.current.resume();
        } else if (!scannerRef.current.isScanning) {
          await startCamera();
        }
      } catch (_e) {
        startCamera();
      }
    } else {
      startCamera();
    }
  };

  if (isLoadingAssignment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#1D4ED8]">Loading Volunteer Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row p-4 md:p-6 gap-6">
        {/* LEFT SIDEBAR NAVIGATION - EXACTLY 3 OPTIONS */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col space-y-4 md:sticky md:top-[var(--sidebar-top)] transition-[top] duration-250 ease-in-out motion-reduce:transition-none">
          {/* ASSIGNED EVENT CARD SUMMARY */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF5E36]">
              Assigned Shift
            </div>
            {currentAssignment ? (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                  {currentAssignment.event_title}
                </h3>
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span>{currentAssignment.event_date || 'Active Event'}</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span>{currentAssignment.position || currentAssignment.event_venue || 'Gate Station'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <p className="text-xs font-bold text-[#0F172A]">No Active Shift Assigned</p>
                <p className="text-[11px] text-slate-500 leading-tight">Explore open event positions to request a shift.</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="w-full mt-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Explore Events
                </button>
              </div>
            )}

            {activeAssignmentsList.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Switch Assignment:
                </label>
                <select
                  value={selectedAssignmentId || ''}
                  onChange={(e) => setSelectedAssignmentId(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus:outline-none focus:border-[#1D4ED8]"
                >
                  {activeAssignmentsList.map((a) => (
                    <option key={a.assignment_id} value={a.assignment_id}>
                      {a.event_title} ({a.position})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* EXACT THREE SIDEBAR OPTIONS */}
          <nav className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center space-x-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>1. Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center space-x-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>2. Explore Events</span>
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center space-x-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>3. Scan QR Codes</span>
            </button>

            <div className="pt-2 border-t border-slate-100 mt-1">
              <button
                onClick={logout}
                className="w-full px-3.5 py-2 rounded-xl text-left flex items-center space-x-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 space-y-5">
          {/* SECTION 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="VOLUNTEER PORTAL"
                title="Volunteer Profile"
                description="Your personal details, verified volunteer credentials, and skills."
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

              {avatarError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* Personal Information & Avatar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs">
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
                        {user?.name?.charAt(0).toUpperCase() || 'V'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0F172A]">{user?.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Approved Volunteer
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Credential ID: {volunteerIdDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
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
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Volunteer Credentials Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Volunteer ID</span>
                    <strong className="text-[#1D4ED8] text-xs font-bold font-mono">{volunteerIdDisplay}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Assigned Station / Gate</span>
                    <strong className="text-[#0F172A] text-xs font-bold">
                      {currentAssignment?.position || 'Unassigned'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Account Status</span>
                    <strong className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Active & Verified
                    </strong>
                  </div>
                </div>

                {/* Bio & Skills Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      Personal Bio & Volunteer Experience
                    </h4>
                    <span className="text-[10px] text-slate-400">Editable</span>
                  </div>

                  {bioSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{bioSuccessMsg}</span>
                    </div>
                  )}

                  {bioErrorMsg && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>{bioErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveBio} className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Add information about your prior volunteer experience, skills, or gate coordination background..."
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingBio}
                        className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSavingBio ? 'Saving Profile...' : 'Save Profile Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EXPLORE EVENTS */}
          {activeTab === 'explore' && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="VOLUNTEER PORTAL"
                title="Explore Events"
                description="Browse events with published volunteer openings and manage your position applications."
                actions={
                  <button
                    onClick={loadOpportunities}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                    title="Refresh Opportunities"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOpportunities ? 'animate-spin' : ''}`} />
                    Refresh List
                  </button>
                }
              />

              {applyMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{applyMessage}</span>
                </div>
              )}

              {/* CURRENTLY ASSIGNED EVENTS */}
              {activeAssignmentsList.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF5E36] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#FF5E36]" />
                    Your Assigned Events ({activeAssignmentsList.length})
                  </h2>

                  <div className="grid grid-cols-1 gap-3">
                    {activeAssignmentsList.map((assignment) => (
                      <div
                        key={assignment.assignment_id}
                        className="bg-white border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-xs relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[#0F172A]">{assignment.event_title}</h3>
                              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                CURRENTLY ASSIGNED
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                {assignment.event_date || 'Active Event'}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                {assignment.event_venue || 'Main Gate'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Gate / Role</span>
                            <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 inline-block">
                              {assignment.position}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          You are an approved volunteer for this event. Navigate to <strong>Scan QR Codes</strong> to begin scanning attendee passes at your assigned gate.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AVAILABLE VOLUNTEER OPENINGS */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Open Events & Roles Accepting Applications
                </h2>

                {isLoadingOpportunities ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80">
                    <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    <span className="text-xs text-slate-400">Fetching live event openings...</span>
                  </div>
                ) : availableEvents.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 space-y-1">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-[#0F172A]">No active events published for volunteer applications</p>
                    <p className="text-[11px] text-slate-400">Check back later when organizers open new event staffing requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableEvents.map((ev) => {
                      const isAssignedToThisEvent = activeAssignmentsList.some((a) => a.event_id === ev.id);
                      const hasOpenings = ev.openings && ev.openings.length > 0;

                      return (
                        <div
                          key={ev.id}
                          className={`bg-white border rounded-2xl p-5 space-y-4 transition-colors ${
                            isAssignedToThisEvent ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#0F172A]">{ev.title}</h3>
                                {isAssignedToThisEvent && (
                                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    CURRENTLY ASSIGNED
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
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

                            <span
                              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                                ev.application_status === 'approved' || isAssignedToThisEvent
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : ev.application_status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : ev.application_status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-blue-50 text-[#1D4ED8] border border-blue-200'
                              }`}
                            >
                              {isAssignedToThisEvent
                                ? 'Assigned'
                                : ev.application_status === 'none'
                                ? 'Open to Apply'
                                : `Application: ${ev.application_status}`}
                            </span>
                          </div>

                          {ev.description && <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>}

                          {/* Specific Openings List */}
                          {hasOpenings ? (() => {
                            const uniqueOpenings = (ev.openings || []).filter(
                              (op, idx, self) =>
                                idx ===
                                self.findIndex(
                                  (o) =>
                                    (o.role || '').trim().toLowerCase() === (op.role || '').trim().toLowerCase() &&
                                    (o.gate_area || '').trim().toLowerCase() === (op.gate_area || '').trim().toLowerCase()
                                )
                            );
                            return (
                              <div className="space-y-2 pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  Specific Volunteer Openings ({uniqueOpenings.length}):
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {uniqueOpenings.map((op) => {
                                    const userAppForOp = myApplications.find((a) => a.opening_id === op.id);
                                    const alreadyApplied = !!userAppForOp;
                                    const isFull = op.remaining_count === 0;
                                    const isUserHoldingThisRole = isAssignedToThisEvent && currentAssignment?.position === op.gate_area;

                                    return (
                                      <div
                                        key={op.id}
                                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 flex flex-col justify-between"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-[#0F172A]">{op.role}</h4>
                                            {op.gate_area && (
                                              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                Gate: {op.gate_area}
                                              </span>
                                            )}
                                          </div>
                                          {op.description && (
                                            <p className="text-[11px] text-slate-600 line-clamp-2">{op.description}</p>
                                          )}
                                          {op.deadline && (
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> Deadline: {op.deadline}
                                            </p>
                                          )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                          <span className="text-[10px] text-slate-500 font-medium">
                                            {op.remaining_count} left ({op.approved_count}/{op.volunteers_needed} filled)
                                          </span>

                                          {isUserHoldingThisRole ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                                              Your Current Role
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setSelectedApplyEvent(ev);
                                                setSelectedApplyOpening(op);
                                                setApplyExperience(user?.bio || '');
                                              }}
                                              disabled={alreadyApplied || isFull || applyingEventId === ev.id}
                                              className="px-3 py-1 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                                            >
                                              {alreadyApplied
                                                ? `Applied (${userAppForOp?.status})`
                                                : isFull
                                                ? 'Role Full'
                                                : 'Apply'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })() : (
                            <div className="pt-2 flex justify-end">
                              {isAssignedToThisEvent ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                                  Currently Assigned
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedApplyEvent(ev);
                                    setSelectedApplyOpening(null);
                                    setApplyExperience(user?.bio || '');
                                  }}
                                  disabled={ev.application_status !== 'none' || applyingEventId === ev.id}
                                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                  {ev.application_status !== 'none' ? `Applied (${ev.application_status})` : 'Apply as Gate Volunteer'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MY SUBMITTED APPLICATIONS HISTORY */}
              <div className="space-y-3 pt-4 border-t border-slate-200/80">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Application History & Decision Status ({myApplications.length})
                </h2>

                {myApplications.length === 0 ? (
                  <p className="text-xs text-slate-400">You have no pending or past event volunteer applications.</p>
                ) : (
                  <div className="space-y-2">
                    {myApplications.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#0F172A]">{app.event_title}</h4>
                            <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              {app.role_name || 'Gate Scanner'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Submitted on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                              app.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            Status: {app.status}
                          </span>

                          {app.status === 'approved' && app.assigned_position && (
                            <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#1D4ED8]" />
                              Gate: {app.assigned_position}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: SCAN QR CODES */}
          {activeTab === 'scan' && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="VOLUNTEER OPERATIONS"
                title="Scan QR Codes"
                description="Scan student event tickets at entry gates to validate registrations and mark attendees present."
              />

              {!canScan ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#0F172A]">Scanner Unavailable</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      {!hasActiveAssignment
                        ? 'You currently have no active event assignment. Explore events and apply for open openings to get assigned to a gate station.'
                        : !isEventActive
                        ? `Your assigned event "${currentAssignment?.event_title}" is not currently set to ACTIVE by the organizer.`
                        : 'Your volunteer account is not authorized to scan passes at this time.'}
                    </p>
                  </div>

                  {!hasActiveAssignment && (
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="px-4 py-2 bg-[#FF5E36] hover:bg-[#e04f2b] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Browse Open Events
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* CAMERA SCANNER INTERFACE */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-[#1D4ED8]" />
                          Camera Pass Scanner
                        </h2>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          Station: {currentAssignment?.position || 'Gate'}
                        </span>
                      </div>

                      <div className="relative bg-slate-50 border border-slate-200 rounded-2xl min-h-[280px] flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                        <div id={qrRegionId} className="w-full max-w-xs mx-auto rounded-xl overflow-hidden" />

                        {!isCameraActive && !scanResult && !isVerifying && (
                          <div className="space-y-3 z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                              <QrCode className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#0F172A]">
                                Open Camera to Scan Attendee Pass
                              </p>
                              <p className="text-[11px] text-slate-500 max-w-xs">
                                Click the button below to request camera permission and start the scanner.
                              </p>
                            </div>

                            {cameraError && (
                              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl max-w-xs mx-auto">
                                {cameraError}
                              </div>
                            )}

                            <button
                              onClick={startCamera}
                              className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 mx-auto cursor-pointer shadow-md"
                            >
                              <Camera className="w-4 h-4" />
                              Open Camera Scanner
                            </button>
                          </div>
                        )}

                        {isCameraActive && !scanResult && !isVerifying && (
                          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center">
                            <button
                              onClick={stopCamera}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Stop Camera
                            </button>
                          </div>
                        )}

                        {isVerifying && (
                          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center space-y-2 z-20">
                            <div className="w-8 h-8 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase text-[#1D4ED8] tracking-wider">
                              Verifying Registration Token...
                            </span>
                          </div>
                        )}

                        {/* SCAN RESULT OVERLAY */}
                        {scanResult && (
                          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-5 text-center space-y-3 z-30">
                            {scanResult.type === 'success' ? (
                              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-300 shadow-xs">
                                <CheckCircle2 className="w-8 h-8" />
                              </div>
                            ) : scanResult.type === 'already' ? (
                              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border-2 border-amber-300 shadow-xs">
                                <AlertTriangle className="w-8 h-8" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border-2 border-red-300 shadow-xs">
                                <XCircle className="w-8 h-8" />
                              </div>
                            )}

                            <div className="space-y-1">
                              <span
                                className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                                  scanResult.type === 'success'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : scanResult.type === 'already'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                              >
                                {scanResult.title}
                              </span>
                              <p className="text-xs text-slate-600 max-w-xs">{scanResult.message}</p>
                            </div>

                            {scanResult.studentName && (
                              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-left w-full max-w-xs space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-medium">Attendee Name:</span>
                                  <strong className="text-[#0F172A]">{scanResult.studentName}</strong>
                                </div>
                                {scanResult.eventTitle && (
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Event:</span>
                                    <span className="text-slate-700">{scanResult.eventTitle}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={resumeScanning}
                              className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Scan Next Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Token Entry Fallback */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Manual Ticket Token Verification:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Enter ticket token code..."
                          value={manualTokenInput}
                          onChange={(e) => setManualTokenInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') processScanToken(manualTokenInput);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1D4ED8]"
                        />
                        <button
                          onClick={() => processScanToken(manualTokenInput)}
                          disabled={!manualTokenInput.trim()}
                          className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          Validate Pass
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RECENT SESSION SCAN HISTORY */}
                  <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">Session Scan Log</h2>
                      {scanHistory.length > 0 && (
                        <button
                          onClick={() => setScanHistory([])}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          Clear Log
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[340px]">
                      {scanHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 space-y-2">
                          <Camera className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-xs font-bold text-[#0F172A]">No scan records yet</p>
                          <p className="text-[11px] leading-relaxed">
                            Decoded tickets and validation status will log here automatically during your shift.
                          </p>
                        </div>
                      ) : (
                        scanHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <div className="flex items-center space-x-2.5">
                              {item.status === 'Checked In' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : item.status === 'Already Checked In' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-[#0F172A] leading-tight">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.regId}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] text-slate-400 font-medium">{item.time}</div>
                              <span
                                className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  item.status === 'Checked In'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.status === 'Already Checked In'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* VOLUNTEER APPLICATION MODAL */}
      {selectedApplyEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApplyEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              aria-label="Close application dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5E36] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                Volunteer Position & Event Application
              </span>
              <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                {selectedApplyOpening ? selectedApplyOpening.role : 'General Volunteer'} — {selectedApplyEvent.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Venue / Gate</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedApplyOpening?.gate_area ? `${selectedApplyEvent.venue} (${selectedApplyOpening.gate_area})` : selectedApplyEvent.venue}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Event Date</span>
                  <span className="font-semibold text-[#0F172A]">{selectedApplyEvent.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Slots</span>
                  <span className="font-semibold text-[#FF5E36]">
                    {selectedApplyOpening
                      ? `${selectedApplyOpening.remaining_count} remaining (${selectedApplyOpening.approved_count}/${selectedApplyOpening.volunteers_needed} filled)`
                      : `${selectedApplyEvent.volunteers_limit || 10} limit`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Deadline</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedApplyOpening?.deadline || 'Until capacity filled'}
                  </span>
                </div>
              </div>

              {/* Responsibilities & Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Role Responsibilities</h4>
                <p className="text-xs text-slate-600 bg-blue-50/60 p-3 rounded-xl border border-blue-100 leading-relaxed">
                  {selectedApplyOpening?.description || selectedApplyEvent.description || 'Assist event organizers with attendee entry scanning, crowd management, and venue coordination.'}
                </p>
              </div>

              {/* Eligibility & Instructions */}
              <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-[#0F172A] block text-[11px] uppercase tracking-wider">Eligibility & Instructions</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Open to approved campus volunteers and registered students.</li>
                  <li>Upon submission, the event organizer will review your application.</li>
                  <li>Once approved, your QR pass scanner and gate shift assignment will activate.</li>
                </ul>
              </div>
            </div>

            <form onSubmit={submitApplicationModal} className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {user?.avatar_url ? (
                  <img
                    src={getFileUrl(user.avatar_url)}
                    alt={user?.name}
                    className="w-10 h-10 rounded-xl object-cover border border-blue-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#0B132B] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{user?.name}</h4>
                  <p className="text-[10px] text-slate-400">{user?.email}</p>
                  <p className="text-[10px] font-bold text-[#1D4ED8]">Volunteer ID: {volunteerIdDisplay}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Relevant Experience (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note on prior event handling, customer service, or volunteer experience..."
                  value={applyExperience}
                  onChange={(e) => setApplyExperience(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApplyEvent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingEventId === selectedApplyEvent.id}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md transition-all"
                >
                  {applyingEventId === selectedApplyEvent.id ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BECOME VOLUNTEER MODAL */}
      <BecomeVolunteerModal
        isOpen={isBecomeVolunteerOpen}
        onClose={() => setIsBecomeVolunteerOpen(false)}
        onSuccess={() => {
          loadAssignment();
          loadOpportunities();
        }}
      />
    </div>
  );
};

export default VolunteerDashboard;
