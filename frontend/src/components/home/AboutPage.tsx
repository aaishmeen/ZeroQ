import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  QrCode,
  Scan,
  Users,
  Shield,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AboutPageProps {
  onExploreEvents: () => void;
  onGetStarted: () => void;
  isAuthenticated?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onExploreEvents,
  onGetStarted,
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] selection:bg-[#FF5E36] selection:text-white">
      {/* SECTION 1 — WHAT IS ZEROQ? */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 bg-[#0B132B] text-white border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#06B6D4]/15 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#06B6D4] text-xs font-bold border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Overview</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-heading font-bold text-white tracking-tight leading-[1.1]">
            Built to Make Campus Events<br className="hidden sm:inline" /> Simpler.
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            ZeroQ is a campus event operations platform that brings registration, payment verification, digital passes, and gate check-in together in one connected experience.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Event entry often involves separate registrations, payment checks, lists, screenshots, and manual verification. ZeroQ brings these steps together so attendees and event teams can spend less time managing entry and more time running the event.
          </p>
        </div>
      </section>

      {/* SECTION 2 — WHAT ZEROQ HANDLES BENTO GRID */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200 mb-3">
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Platform Scope</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              Everything Behind a Smooth Entry
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Three core pillars that keep event operations reliable from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">EVENT OPERATIONS</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Discover events, manage registrations, handle capacity, and keep event information organized.
              </p>
            </div>

            <div className="p-8 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">CHECK-IN & SCANNING</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Use secure digital passes and a simple scanner to verify attendees at the gate.
              </p>
            </div>

            <div className="p-8 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5E36] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">ROLES & MANAGEMENT</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Give attendees, volunteers, organizers, and administrators the right tools for their role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — CAPABILITIES */}
      <section className="py-20 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-300 mb-3">
              <Shield className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Detailed Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              Platform Features & Capabilities
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Organized into clear functional areas without technical jargon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Area 1 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#1D4ED8]">
                <Calendar className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">EVENT MANAGEMENT</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Event discovery:</strong> Browse all verified campus gatherings in one place.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Registration:</strong> Instant pass reservation linked to student ID.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Capacity limits:</strong> Automatic cutoff when venue seats are filled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Event details:</strong> Clear schedules, venues, and organizer contacts.</span>
                </li>
              </ul>
            </div>

            {/* Area 2 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#FF5E36]">
                <CreditCard className="w-5 h-5 text-[#FF5E36]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">PAYMENTS</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5E36] font-bold">•</span>
                  <span><strong>Proof submission:</strong> Simple upload for UPI receipts and transaction IDs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5E36] font-bold">•</span>
                  <span><strong>Payment verification:</strong> Organizer dashboard queue to inspect proof.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5E36] font-bold">•</span>
                  <span><strong>Review workflow:</strong> Instant approval or rejection with explicit reasons.</span>
                </li>
              </ul>
            </div>

            {/* Area 3 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#06B6D4]">
                <QrCode className="w-5 h-5 text-[#06B6D4]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">DIGITAL PASSES</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#06B6D4] font-bold">•</span>
                  <span><strong>Secure QR passes:</strong> Dynamic high-contrast QR tickets generated per pass.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06B6D4] font-bold">•</span>
                  <span><strong>Student linked:</strong> Connected to verified student registration records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#06B6D4] font-bold">•</span>
                  <span><strong>Live pass status:</strong> Instant display of active, pending, or used states.</span>
                </li>
              </ul>
            </div>

            {/* Area 4 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#1D4ED8]">
                <Scan className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">CHECK-IN</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>QR scanning:</strong> Mobile camera verification with zero app install needed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Duplicate prevention:</strong> Instant flag if a ticket is presented twice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Attendance records:</strong> Exact entry timestamps logged automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D4ED8] font-bold">•</span>
                  <span><strong>Issue reporting:</strong> Fast dispute logging from gate scanners to organizers.</span>
                </li>
              </ul>
            </div>

            {/* Area 5 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 text-[#1D4ED8]">
                <Shield className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">MANAGEMENT</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="space-y-2">
                  <p><strong>Volunteer assignments:</strong> Assign gate positions to approved staff.</p>
                  <p><strong>User management:</strong> Role controls for students, staff, and organizers.</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Event approvals:</strong> Admin review queue before public event publishing.</p>
                  <p><strong>Broadcast notifications:</strong> Send live updates directly to volunteers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY ZEROQ */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Core Benefits</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              Why Campus Teams Choose ZeroQ
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Practical advantages that eliminate manual friction on event days.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#1D4ED8]" />
              <h3 className="text-base font-bold text-[#0F172A]">Less manual checking.</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated QR ticket generation replaces physical name lists and paper spreadsheets.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#1D4ED8]" />
              <h3 className="text-base font-bold text-[#0F172A]">Clearer event operations.</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Real-time visibility into registrations, payment statuses, and gate check-in counts.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#1D4ED8]" />
              <h3 className="text-base font-bold text-[#0F172A]">Faster entry.</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sub-second camera scanning prevents long queues and bottlenecks at the doors.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#1D4ED8]" />
              <h3 className="text-base font-bold text-[#0F172A]">One connected workflow.</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Attendees, volunteers, organizers, and admins all work in the same seamless portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL CTA */}
      <section className="py-20 bg-[#0B132B] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-white tracking-tight">
            Ready to Simplify Campus Events?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Join students, organizers, and campus staff using ZeroQ for seamless event operations.
          </p>
          <div className="pt-2">
            {!isAuthenticated ? (
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs sm:text-sm rounded-full transition-all inline-flex items-center gap-2 cursor-pointer shadow-xl hover:shadow-orange-500/30"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onExploreEvents}
                className="px-8 py-4 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs sm:text-sm rounded-full transition-all inline-flex items-center gap-2 cursor-pointer shadow-xl hover:shadow-orange-500/30"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

