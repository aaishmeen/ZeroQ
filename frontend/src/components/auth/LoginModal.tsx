import React, { useState } from 'react';
import { ZeroQLogo } from '../common/ZeroQLogo';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, GraduationCap, UserCheck, ShieldAlert, QrCode } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  initialRole?: Role;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  initialRole,
}) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole || 'student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(cleanEmail, password);

      const userRole = (loggedUser.role || '').toLowerCase();
      const targetRole = selectedRole.toLowerCase();

      const roleMatches =
        userRole === targetRole ||
        (targetRole === 'admin' && (userRole === 'admin' || userRole === 'superadmin')) ||
        (userRole === 'volunteer' && targetRole === 'student') ||
        (userRole === 'student' && targetRole === 'volunteer');

      if (!roleMatches) {
        if (userRole === 'organizer') setSelectedRole('organizer');
        else if (userRole === 'admin' || userRole === 'superadmin') setSelectedRole('admin');
        else if (userRole === 'volunteer') setSelectedRole('volunteer');
        else setSelectedRole('student');
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Invalid credentials. Please check email and password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="relative w-full max-w-sm bg-white rounded border border-[#CBE6C8] p-6 shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#6B8B74] hover:text-[#0F2417] hover:bg-[#E5F5E0] rounded transition-colors"
          aria-label="Close login dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-1 mb-5">
          <ZeroQLogo size="md" />
          <h2 className="text-base font-bold text-[#0F2417] pt-1">Sign In to ZeroQ</h2>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-[#F8FAFC] p-1 rounded-2xl border border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <GraduationCap className="w-3 h-3 shrink-0" />
            Student
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('volunteer')}
            className={`flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
              selectedRole === 'volunteer'
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <QrCode className="w-3 h-3 shrink-0" />
            Volunteer
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('organizer')}
            className={`flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
              selectedRole === 'organizer'
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <UserCheck className="w-3 h-3 shrink-0" />
            Organizer
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <ShieldAlert className="w-3 h-3 shrink-0" />
            Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A]"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#1D4ED8] focus:ring-[#1D4ED8] border-slate-300"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white py-2.5 rounded-full font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md hover:shadow-orange-500/20"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="mt-4 text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Don't have an account?{' '}
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="font-bold text-[#1D4ED8] hover:underline ml-1 cursor-pointer"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};
