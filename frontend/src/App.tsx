import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutProvider } from './context/LayoutContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/home/HeroSection';
import { HowItWorksPage } from './components/home/HowItWorksPage';
import { AboutPage } from './components/home/AboutPage';
import { EventDiscoverySection } from './components/events/EventDiscoverySection';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { BecomeVolunteerModal } from './components/auth/BecomeVolunteerModal';
import { PaymentUploadModal } from './components/payments/PaymentUploadModal';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { VolunteerDashboard } from './components/dashboard/VolunteerDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { OrganizerDashboard } from './components/dashboard/OrganizerDashboard';
import { SuperadminDashboard } from './components/dashboard/SuperadminDashboard';
import { PendingAdminView } from './components/auth/PendingAdminView';
import type { EventItem } from './types';
import { registerForEventApi } from './api/events';
import { useToast } from './components/common/ToastContainer';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const isStudentCapable = user ? user.role === 'student' || user.role === 'volunteer' || !!user.reg_no : false;

  const [activeSection, setActiveSection] = useState<string>(
    isAuthenticated ? (isStudentCapable ? 'events' : 'dashboard') : 'home'
  );

  const [prevAuth, setPrevAuth] = useState<boolean>(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !prevAuth) {
      if (isStudentCapable) {
        setActiveSection('events');
      } else {
        setActiveSection('dashboard');
      }
    }
    setPrevAuth(isAuthenticated);
  }, [isAuthenticated]);

  // Auth Modals State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBecomeVolunteerOpen, setIsBecomeVolunteerOpen] = useState(false);
  const [preselectedVolunteerEventId, setPreselectedVolunteerEventId] = useState<number | null>(null);

  const handleOpenBecomeVolunteer = (eventId?: number) => {
    if (eventId) {
      setPreselectedVolunteerEventId(eventId);
    } else {
      setPreselectedVolunteerEventId(null);
    }
    setIsBecomeVolunteerOpen(true);
  };

  // Registration & Payment Flow State
  const [activePaymentFlow, setActivePaymentFlow] = useState<{
    regId: number;
    event: EventItem;
  } | null>(null);

  const handleRegisterEvent = async (event: EventItem) => {
    if (!isAuthenticated || !user) {
      setIsLoginOpen(true);
      return;
    }

    if (!isStudentCapable) {
      showToast('Only users with Student capability can register for events.', 'warning');
      return;
    }

    try {
      const res = await registerForEventApi(event.id);
      if (event.price > 0) {
        setActivePaymentFlow({
          regId: res.registration_id,
          event: event,
        });
      } else {
        showToast('Registration successful! Since this event is free, your pass has been automatically confirmed.', 'success');
        setActiveSection('dashboard');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Could not register for this event.', 'error');
    }
  };

  const handleContinuePayment = (regId: number, event: EventItem) => {
    setActivePaymentFlow({
      regId,
      event,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans antialiased text-[#0F172A] selection:bg-[#FF5E36] selection:text-white">
      {/* Top Fixed Header */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenBecomeVolunteer={() => handleOpenBecomeVolunteer()}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Body Dynamic Views */}
      <main className="flex-1 pt-[var(--navbar-height)]">
        {activeSection === 'volunteer' && isAuthenticated && user && (
          user.role === 'admin' ||
          user.role === 'organizer' ||
          user.role === 'volunteer' ||
          user.role === 'superadmin' ||
          user.is_approved_volunteer === true
        ) ? (
          <VolunteerDashboard />
        ) : activeSection === 'dashboard' && isAuthenticated && user ? (
          user.role === 'admin' && user.status === 'pending' ? (
            <PendingAdminView />
          ) : user.role === 'admin' ? (
            <AdminDashboard />
          ) : user.role === 'organizer' ? (
            <OrganizerDashboard />
          ) : user.role === 'superadmin' ? (
            <SuperadminDashboard />
          ) : user.role === 'volunteer' ? (
            <VolunteerDashboard />
          ) : (
            <StudentDashboard />
          )
        ) : activeSection === 'events' && isAuthenticated ? (
          user && user.role !== 'student' && user.role !== 'volunteer' && !user.is_approved_volunteer && !user.reg_no ? (
            user.role === 'admin' && user.status === 'pending' ? (
              <PendingAdminView />
            ) : user.role === 'admin' ? (
              <AdminDashboard />
            ) : user.role === 'organizer' ? (
              <OrganizerDashboard />
            ) : (
              <SuperadminDashboard />
            )
          ) : (
            /* Dedicated Authenticated Discover Events Page for Students */
            <div>
              <div className="bg-[#0B132B] text-white py-10 px-4 border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#06B6D4] bg-white/10 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
                      Participant Workspace
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold mt-2">Discover Campus Events</h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Browse approved events, reserve tickets, and activate your digital QR passbook.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('dashboard')}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white font-bold text-xs rounded-full transition-all shrink-0 cursor-pointer shadow-md hover:shadow-orange-500/20"
                  >
                    My Passbook & Tickets
                  </button>
                </div>
              </div>
              <EventDiscoverySection 
                onRegisterEvent={handleRegisterEvent} 
                onContinuePayment={handleContinuePayment} 
                onApplyVolunteer={(ev) => handleOpenBecomeVolunteer(ev.id)}
              />
            </div>
          )
        ) : activeSection === 'how-it-works' ? (
          <HowItWorksPage onGetStarted={() => setIsRegisterOpen(true)} />
        ) : activeSection === 'about' ? (
          <AboutPage
            onGetStarted={() => setIsRegisterOpen(true)}
            onExploreEvents={() => (isAuthenticated ? setActiveSection('events') : setIsLoginOpen(true))}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          /* Public Unauthenticated Landing View / Home */
          <HeroSection
            onGetStarted={() => setIsRegisterOpen(true)}
            onExploreEvents={() => (isAuthenticated ? setActiveSection('events') : setIsLoginOpen(true))}
            onHowItWorks={() => setActiveSection('how-it-works')}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <BecomeVolunteerModal
        isOpen={isBecomeVolunteerOpen}
        preselectedEventId={preselectedVolunteerEventId}
        onClose={() => setIsBecomeVolunteerOpen(false)}
        onNeedLogin={() => setIsLoginOpen(true)}
        onSuccess={() => {
          if (isAuthenticated && user) {
            setActiveSection('dashboard');
          }
        }}
      />

      {/* Payment Upload Modal */}
      {activePaymentFlow && (
        <PaymentUploadModal
          isOpen={!!activePaymentFlow}
          registrationId={activePaymentFlow.regId}
          event={activePaymentFlow.event}
          onClose={() => setActivePaymentFlow(null)}
          onPaymentSubmitted={() => {
            setActivePaymentFlow(null);
            setActiveSection('dashboard');
          }}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={(sec) => setActiveSection(sec)} />
    </div>
  );
};

import { ToastProvider } from './components/common/ToastContainer';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LayoutProvider>
          <MainAppContent />
        </LayoutProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
