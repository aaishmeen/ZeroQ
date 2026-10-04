import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  User,
  UserCheck,
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  QrCode,
  Calendar,
  CreditCard,
  Scan,
  Layers,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealisticScannerView } from '../common/RealisticScannerView';

interface HowItWorksPageProps {
  onGetStarted: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onGetStarted }) => {
  const { isAuthenticated } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState<'attendee' | 'volunteer' | 'organizer' | 'admin'>('attendee');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
    }, 900);
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] selection:bg-[#FF5E36] selection:text-white">
      {/* SECTION 1 — INTRO HEADER */}
      <section className="relative py-20 bg-[#0B132B] text-white border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#06B6D4]/10 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-heading font-bold text-white tracking-tight">
            How ZeroQ Works
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From discovering an event to walking through the gate, ZeroQ connects every operational step into one seamless process.
          </p>
        </div>
      </section>

      {/* SECTION 2 — THE SIX-STAGE FLOW BENTO GRID */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200 mb-3">
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Event Progression</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              The Six Stages of Entry
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A clear progression designed to keep attendees informed and gate check-in fast.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  STAGE 01
                </span>
                <Calendar className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">01 — DISCOVER</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Find verified campus events on the active event stream.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  STAGE 02
                </span>
                <FileCheck className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">02 — REGISTER</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Reserve your place and receive a unique registration ID.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FF5E36] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  STAGE 03
                </span>
                <CreditCard className="w-5 h-5 text-[#FF5E36]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">03 — VERIFY</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload payment proof if required and await organizer audit.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  STAGE 04
                </span>
                <QrCode className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">04 — GET YOUR PASS</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Access your secure digital QR passbook ticket.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#06B6D4] bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  STAGE 05
                </span>
                <Scan className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">05 — SCAN</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Present your pass code at venue gates for camera scan.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  STAGE 06
                </span>
                <CheckCircle2 className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">06 — ENTER</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Once validated by gate volunteer, walk right in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW EACH ROLE USES ZEROQ */}
      <section className="py-20 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-300 mb-3">
              <Shield className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Role Workflows</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A]">
              How Each Role Uses ZeroQ
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Clear, step-by-step responsibilities customized for every user role.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'attendee', label: 'ATTENDEE', icon: User },
              { id: 'volunteer', label: 'VOLUNTEER', icon: UserCheck },
              { id: 'organizer', label: 'ORGANIZER', icon: Building2 },
              { id: 'admin', label: 'ADMIN', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeRoleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Role Workflow Steps Card */}
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            {activeRoleTab === 'attendee' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-[#0F172A]">Attendee Workflow</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Student & Participant Experience
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { step: '1', title: 'Discover event', desc: 'Find campus event on feed' },
                    { step: '2', title: 'Register', desc: 'Enter student details' },
                    { step: '3', title: 'Complete payment', desc: 'Upload proof if paid event' },
                    { step: '4', title: 'Get pass', desc: 'Secure QR generated' },
                    { step: '5', title: 'Show pass', desc: 'Present QR at gate' },
                    { step: '6', title: 'Enter', desc: 'Gate verification confirmed' },
                  ].map((s) => (
                    <div key={s.step} className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-[#06B6D4] block text-[11px]">Step {s.step}</span>
                      <p className="font-bold text-[#0F172A]">{s.title}</p>
                      <p className="text-[11px] text-slate-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRoleTab === 'volunteer' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-[#0F172A]">Volunteer Workflow</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Gate Verification Crew
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { step: '1', title: 'Receive assignment', desc: 'Assigned to specific gate' },
                    { step: '2', title: 'Open scanner', desc: 'Camera validator interface' },
                    { step: '3', title: 'Scan pass', desc: 'Optical QR read' },
                    { step: '4', title: 'Verify entry', desc: 'Instant pass confirmation' },
                    { step: '5', title: 'Record attendance', desc: 'Entry timestamp logged' },
                    { step: '6', title: 'Raise issue', desc: 'Flag duplicate or dispute' },
                  ].map((s) => (
                    <div key={s.step} className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-[#06B6D4] block text-[11px]">Step {s.step}</span>
                      <p className="font-bold text-[#0F172A]">{s.title}</p>
                      <p className="text-[11px] text-slate-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRoleTab === 'organizer' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-[#0F172A]">Organizer Workflow</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Club & Event Leads
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { step: '1', title: 'Create event', desc: 'Set date, venue, capacity' },
                    { step: '2', title: 'Review signups', desc: 'Monitor registration list' },
                    { step: '3', title: 'Verify payments', desc: 'Review submitted receipts' },
                    { step: '4', title: 'Manage volunteers', desc: 'Assign gate positions' },
                    { step: '5', title: 'Monitor turnout', desc: 'Live attendance tracking' },
                    { step: '6', title: 'Event operations', desc: 'Resolve disputes & close' },
                  ].map((s) => (
                    <div key={s.step} className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-[#06B6D4] block text-[11px]">Step {s.step}</span>
                      <p className="font-bold text-[#0F172A]">{s.title}</p>
                      <p className="text-[11px] text-slate-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRoleTab === 'admin' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-[#0F172A]">Administrator Workflow</h3>
                  <span className="text-xs font-semibold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    University Platform Governance
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { step: '1', title: 'Review events', desc: 'Approve draft submissions' },
                    { step: '2', title: 'Manage users', desc: 'Role permissions & status' },
                    { step: '3', title: 'Approve requests', desc: 'Authorize organizer roles' },
                    { step: '4', title: 'Monitor activity', desc: 'Campus platform overview' },
                    { step: '5', title: 'Admin actions', desc: 'Override or moderate' },
                    { step: '6', title: 'Governance', desc: 'Audit platform records' },
                  ].map((s) => (
                    <div key={s.step} className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <span className="font-bold text-[#06B6D4] block text-[11px]">Step {s.step}</span>
                      <p className="font-bold text-[#0F172A]">{s.title}</p>
                      <p className="text-[11px] text-slate-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4 — INTERACTIVE SCANNER DEMONSTRATION */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200">
                <Scan className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Live Optical Check-In Demo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
                Gate Check-In Takes Seconds
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Each digital pass code can be scanned at venue gates and validated instantly by gate volunteers.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-slate-200">
                  <span className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
                  <span>Participant presents QR pass on mobile screen</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-slate-200">
                  <span className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                  <span>Volunteer scans pass code with mobile camera</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-slate-200">
                  <span className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
                  <span>Pass validated & recorded in FastAPI database</span>
                </div>
              </div>
            </div>

            {/* Interactive Scanner Sandbox */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-[#0B132B] text-white p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center backdrop-blur-xl">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3 text-xs">
                  <span className="font-bold text-[#06B6D4] uppercase tracking-wider">Gate Scanner Simulator</span>
                  <span className="text-[10px] text-slate-400 uppercase">Gate #01 Active</span>
                </div>

                <div className="flex justify-center">
                  <RealisticScannerView
                    isScanning={isScanning}
                    size={160}
                    label="GATE #01 CAMERA SCANNER"
                  />
                </div>

                {scanSuccess ? (
                  <div className="p-3.5 bg-emerald-500/20 border border-emerald-500 rounded-2xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Pass Verified! Entry Recorded.</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Click below to test camera QR validation at the gate.
                  </p>
                )}

                <button
                  onClick={handleSimulateScan}
                  disabled={isScanning}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-orange-500/25"
                >
                  {isScanning ? 'Scanning QR Code...' : 'Simulate Gate QR Scan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — EXCEPTION HANDLING BENTO GRID */}
      <section className="py-20 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-300 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF5E36]" />
              <span>Exception Handling</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              What Happens When Something Goes Wrong?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              ZeroQ includes built-in workflows to handle edge cases and entry exceptions cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[#0F172A]">Payment Review Required</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Organizers can inspect submitted payment screenshots and approve or decline with a reason before issuing the pass.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-[#0F172A]">Pass Already Used</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The gate scanner immediately flags duplicate scans and displays previous check-in timestamp.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#1D4ED8]">
                <UserCheck className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-[#0F172A]">Gate Disputes</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Volunteers can log an on-the-spot gate dispute directly to the organizer dashboard for fast resolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA BANNER */}
      <section className="py-20 bg-[#0B132B] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-white tracking-tight">
            Ready to Experience ZeroQ?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Discover upcoming campus events or set up operations for your next event.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs sm:text-sm rounded-full transition-all inline-flex items-center gap-2 cursor-pointer shadow-xl hover:shadow-orange-500/30"
            >
              <span>{isAuthenticated ? 'Explore Events' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
