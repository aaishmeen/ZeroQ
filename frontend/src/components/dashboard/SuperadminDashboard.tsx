import React, { useEffect, useState } from 'react';
import type { User } from '../../types';
import { getUsersApi, approveAdminApi, rejectAdminApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { useToast } from '../common/ToastContainer';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  RefreshCw,
  LogOut,
  Shield,
  CheckCircle2,
  Clock,
  Check,
  X,
} from 'lucide-react';

export const SuperadminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'admins'>('requests');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsersApi();
      setAllUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId: number, name: string) => {
    setActionLoadingId(userId);
    try {
      await approveAdminApi(userId);
      showToast(`Admin application for ${name} approved!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve admin.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    if (!confirm(`Are you sure you want to reject admin request for ${name}?`)) return;
    setActionLoadingId(userId);
    try {
      await rejectAdminApi(userId);
      showToast(`Admin application for ${name} rejected.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject admin.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const adminUsers = allUsers.filter((u) => u.role === 'admin' || u.role === 'superadmin');
  const pendingAdminRequests = adminUsers.filter((u) => u.status === 'pending');
  const approvedAdmins = adminUsers.filter((u) => u.status !== 'pending');

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          eyebrow="ROOT GOVERNANCE"
          title="Superadmin Control Center"
          description="Review administrator access requests and manage platform governance."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8] font-bold text-xs rounded-lg border border-[#1D4ED8]/30 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          }
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Governance Notice */}
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
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Admin Applications ({pendingAdminRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Active Administrators ({approvedAdmins.length})
          </button>
        </div>

        {/* Tab 1: ADMIN REQUESTS */}
        {activeTab === 'requests' && (
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
                              onClick={() => handleApprove(req.id, req.name)}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id, req.name)}
                              disabled={actionLoadingId === req.id}
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

        {/* Tab 2: APPROVED ADMINS */}
        {activeTab === 'admins' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Platform Administrators</h3>
            {adminUsers.length === 0 ? (
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
                    {adminUsers.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-[#0F172A]">{adm.name}</td>
                        <td className="p-2.5 text-slate-600">{adm.email}</td>
                        <td className="p-2.5 font-mono">{adm.reg_no}</td>
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
    </div>
  );
};
