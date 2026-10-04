import React, { useEffect, useState } from 'react';
import { ZeroQLogo } from './ZeroQLogo';
import { getHealthApi } from '../../api/auth';
import { ShieldCheck, Calendar, Lock, X } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | 'refund' | null>(null);

  useEffect(() => {
    getHealthApi()
      .then((res) => {
        if (res.status === 'healthy') {
          setSystemStatus('ONLINE');
        } else {
          setSystemStatus('OFFLINE');
        }
      })
      .catch(() => setSystemStatus('OFFLINE'));
  }, []);

  return (
    <footer className="bg-[#0B132B] text-white pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <ZeroQLogo variant="light" size="md" />
            <p className="text-slate-300 text-xs leading-relaxed max-w-xs font-normal">
              High-velocity event registration, payment verification, and optical gate check-in for campus operations.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] mb-4 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => onNavigate('events')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  Explore Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  About Platform
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Policy Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => setActivePolicyModal('privacy')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('terms')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('refund')}
                  className="hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  Refund Guidelines
                </button>
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] mb-4 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              System Status
            </h4>

            <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Gate API & Engine</span>
                <span className="flex h-2.5 w-2.5 relative">
                  {systemStatus === 'ONLINE' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  )}
                  <span
                    className={`inline-flex rounded-full h-2.5 w-2.5 ${
                      systemStatus === 'ONLINE' ? 'bg-[#06B6D4]' : 'bg-amber-400'
                    }`}
                  />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-bold tracking-wide ${
                    systemStatus === 'ONLINE' ? 'text-[#06B6D4]' : 'text-amber-400'
                  }`}
                >
                  {systemStatus === 'ONLINE' ? 'OPERATIONAL' : 'CHECKING STATUS'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Real-time connection to ZeroQ FastAPI backend service.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 ZeroQ. Production Event Operations Platform.</p>
          <p className="font-semibold text-slate-300">Zero Queues • Single-Use Passes • Verified Entry</p>
        </div>
      </div>

      {/* Policy Modal Dialog Structure */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-[#0F172A] text-white border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <button
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#06B6D4]" />
              {activePolicyModal === 'privacy' && 'Privacy Policy'}
              {activePolicyModal === 'terms' && 'Terms of Service'}
              {activePolicyModal === 'refund' && 'Refund Guidelines'}
            </h3>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300 max-h-64 overflow-y-auto">
              <p className="font-mono text-[11px] text-[#06B6D4] font-bold">
                [Placeholder: Official Product/Legal Copy Required Before Production]
              </p>
              <p>
                ZeroQ operates an event entry and optical ticket verification system. All personal information, transaction receipts, and digital QR passes generated on this platform are used solely for identity verification, attendance tracking, and campus security.
              </p>
              <p>
                For official policy document requests or legal inquiries regarding event passes, refunds, or data compliance, please consult your event organizer or administrator.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActivePolicyModal(null)}
                className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
