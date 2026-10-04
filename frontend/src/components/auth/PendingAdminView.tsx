import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const PendingAdminView: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 space-y-5 text-center shadow-lg">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <Clock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <ShieldAlert className="w-3 h-3" />
            Pending Superadmin Approval
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Admin Access Request Submitted
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your application is pending review by the Superadmin. You will gain access once authorized.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Applicant:</span>
              <span className="font-semibold text-[#0F172A]">{user.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Email:</span>
              <span className="font-semibold text-[#0F172A]">{user.email}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Requested Role:</span>
              <span className="font-semibold text-[#1D4ED8] capitalize">{user.role}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1D4ED8] text-white border border-[#1D4ED8] rounded-lg font-bold text-xs hover:bg-[#1E40AF] transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check Status
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
