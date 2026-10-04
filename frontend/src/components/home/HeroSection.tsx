import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEventsApi } from '../../api/events';
import type { EventItem } from '../../types';
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  QrCode,
  Scan,
  UserCheck,
  Building2,
  ShieldCheck,
  User,
  Sparkles,
  MapPin,
  Ticket,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreEvents: () => void;
  onHowItWorks: () => void;
  isAuthenticated?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onExploreEvents,
  onHowItWorks,
}) => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'volunteer' | 'organizer' | 'admin'>('student');
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    getEventsApi()
      .then((data) => {
        setEvents(data.filter((e) => e.status === 'active' || e.status === 'approved'));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  const handleNextEvent = () => {
    if (events.length > 0) {
      setCarouselIndex((prev) => (prev + 1) % events.length);
    }
  };

  const handlePrevEvent = () => {
    if (events.length > 0) {
      setCarouselIndex((prev) => (prev - 1 + events.length) % events.length);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] selection:bg-[#FF5E36] selection:text-white">
      {/* SECTION 1 — ATMOSPHERIC LUXURY DARK HERO */}
      <section className="relative bg-[#0B132B] text-white pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-slate-800 overflow-hidden">
        {/* Stadium Background Image & Overlay */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/hero-bg.jpg"
            alt="Event Stadium Background"
            className="w-full h-full object-cover object-center opacity-35 brightness-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-[#0B132B]/80" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Main Headline & Action CTAs */}
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-heading tracking-tight leading-[1.1] text-white">
              Smarter Events. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#06B6D4]">
                Seamless Experiences.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              ZeroQ unifies campus event registration, manual & digital payment verification, tamper-proof single-use passes, and optical gate check-in into one effortless platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              {!isAuthenticated ? (
                <button
                  onClick={onGetStarted}
                  className="group px-6 py-3.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold rounded-full text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-orange-500/25"
                >
                  <span>Get Started</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={onExploreEvents}
                  className="group px-6 py-3.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold rounded-full text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-orange-500/25"
                >
                  <span>Explore Events</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              )}

              <button
                onClick={onHowItWorks}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold rounded-full text-xs sm:text-sm transition-all cursor-pointer backdrop-blur-md"
              >
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — REAL LIVE EVENTS CAROUSEL */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200 mb-3">
                <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Live Event Stream</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A]">
                Featured Campus Events
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Browse real active events scheduled on the ZeroQ platform. Reserve tickets and access your digital QR pass.
              </p>
            </div>

            {/* Carousel Navigation Buttons */}
            {events.length > 1 && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handlePrevEvent}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-blue-50 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  aria-label="Previous Event"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextEvent}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-blue-50 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  aria-label="Next Event"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Events Grid / Carousel */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
              ))}
            </div>
          ) : events.length === 0 ? (
            /* Clean Empty State */
            <div className="p-10 rounded-3xl bg-[#F8FAFC] border border-slate-200 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">No Public Events Scheduled Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Organizers are preparing upcoming campus events. Create an account to stay updated or publish an event as an organizer.
              </p>
              <div className="pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold text-xs rounded-full cursor-pointer transition-colors"
                >
                  Register / Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(events.length <= 3
                ? events
                : Array.from({ length: 3 }, (_, i) => events[(carouselIndex + i) % events.length])
              ).map((event) => (
                <div
                  key={event.id}
                  onClick={onExploreEvents}
                  className="group bg-white rounded-3xl border border-slate-200 hover:border-[#1D4ED8] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {event.price === 0 ? 'FREE ENTRY' : `₹${event.price}`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5E36]" />
                        {event.venue}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors leading-snug">
                      {event.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-[#0F172A] block">
                        {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>Cap: {event.capacity} Attendees</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1D4ED8] group-hover:bg-[#1D4ED8] group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — BENTO GRID OF REAL ZEROQ FEATURES */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-300 mb-3">
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Core Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A] tracking-tight">
              What Makes ZeroQ Different?
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              ZeroQ eliminates manual paper lists and long queue bottlenecks through camera-based verification, instant digital passbooks, and transparent organizer workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento Card 1 — Gate Optical Scanner */}
            <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                <Scan className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A]">Camera Optical Gate Scanner</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Volunteers scan participant QR codes directly via mobile camera or webcam. Single-use ticket validation guarantees zero duplicate entries at venue gates.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 rounded-2xl text-white text-xs border border-white/10 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-slate-200 font-bold tracking-wide">Live Check-in Active</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Instant Scan
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">Entry Approved</p>
                      <p className="text-[11px] text-slate-300">Valid Event Pass • Single Use</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">Gate #01</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2 — Tamper-Proof Passbook */}
            <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A]">Digital QR Passbook</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Approved participants get instant access to their digital event pass complete with event location, price tier, and encrypted QR token.
                </p>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs space-y-1.5">
                <span className="font-bold text-[#1E3A8A]">Passbook Features:</span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li>• Dynamic QR Matrix with single-scan lock</li>
                  <li>• Offline screenshot fallback option</li>
                </ul>
              </div>
            </div>

            {/* Bento Card 3 — Payment Audit Workflow */}
            <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5E36] flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A]">Payment Receipt Audit</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  For paid events, students upload payment proof directly during registration. Organizers verify receipts with one click to confirm pass status.
                </p>
              </div>
            </div>

            {/* Bento Card 4 — Integrated Volunteer System */}
            <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A]">Volunteer Gate Coordination</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Organizers publish volunteer openings, accept applications, and assign volunteers to specific event gates with shift notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — ROLE-BASED WORKSPACE TAB SHOWCASE */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-300">
              <Shield className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Role-Based Access Control</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-[#0F172A]">
              Designed for Every Campus Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ZeroQ tailors workspaces specifically for students, gate volunteers, event organizers, and campus admins.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'student', label: 'Attendee / Student', icon: User },
              { id: 'volunteer', label: 'Gate Volunteer', icon: UserCheck },
              { id: 'organizer', label: 'Event Organizer', icon: Building2 },
              { id: 'admin', label: 'Campus Admin', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeRoleTab === tab.id
                      ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-md'
                      : 'bg-[#F8FAFC] text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Preview Card */}
          <div className="max-w-4xl mx-auto bg-[#F8FAFC] rounded-3xl border border-slate-200 p-8 shadow-sm">
            {activeRoleTab === 'student' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0F172A]">Student / Attendee Workspace</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Discover upcoming campus events, register for free or paid tiers, upload payment receipts, and manage your digital QR tickets in your personal passbook.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Event Discovery</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Digital Passbook</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Payment Upload</span>
                </div>
              </div>
            )}

            {activeRoleTab === 'volunteer' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0F172A]">Gate Volunteer Workspace</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Apply for volunteer duty openings across events, view gate assignments, receive operational shift notifications, and scan attendee QR passes in real time.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Camera QR Scanner</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Gate Duty View</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Shift Notifications</span>
                </div>
              </div>
            )}

            {activeRoleTab === 'organizer' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0F172A]">Event Organizer Workspace</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Create and manage events, set pricing and capacity limits, audit submitted payment receipts, publish volunteer openings, and review live attendance logs.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Event Creation</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Payment Receipt Audit</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Volunteer Openings</span>
                </div>
              </div>
            )}

            {activeRoleTab === 'admin' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0F172A]">Campus Admin Workspace</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Approve proposed campus events, manage organizer and volunteer approvals, monitor platform activity, and oversee system operations.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Event Approvals</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ User Management</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-slate-200 font-medium text-[#1D4ED8]">✓ Platform Oversight</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5 — VIBRANT NAVY, BLUE & CORAL CTA BANNER */}
      <section className="py-20 bg-[#0B132B] text-white relative overflow-hidden">
        {/* Vibrant Gradient Background Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#FF5E36]/40 opacity-90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#06B6D4]/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#06B6D4] text-xs font-bold border border-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Queue Gate Entry</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-serif-heading font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Spark Ideas. Build Community. Make an Impact.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Get started with ZeroQ today and simplify the way campus events are planned, ticketed, and verified.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            {!isAuthenticated ? (
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-sm rounded-full transition-all cursor-pointer shadow-xl hover:shadow-orange-500/30 flex items-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onExploreEvents}
                className="px-8 py-4 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-sm rounded-full transition-all cursor-pointer shadow-xl hover:shadow-orange-500/30 flex items-center gap-2"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onHowItWorks}
              className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-sm rounded-full transition-all cursor-pointer backdrop-blur-md"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

