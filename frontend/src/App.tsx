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
  const isStudentCapable = user ? (user.role === 'student' || user.role === 'volunteer') && user.role !== 'organizer' && user.role !== 'admin' && user.role !== 'superadmin' : false;

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
        {(() => {
          if (isAuthenticated && user) {
            // Administrative & Organizer Accounts: Always route to their Dashboard except for explicit info pages
            if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'organizer') {
              if (activeSection === 'how-it-works') {
                return <HowItWorksPage onGetStarted={() => setIsRegisterOpen(true)} />;
              }
              if (activeSection === 'about') {
                return (
                  <AboutPage
                    onGetStarted={() => setIsRegisterOpen(true)}
                    onExploreEvents={() => setActiveSection('dashboard')}
                    isAuthenticated={isAuthenticated}
                  />
                );
              }
              if (user.role === 'admin') {
                return user.status === 'pending' ? <PendingAdminView /> : <AdminDashboard />;
              }
              if (user.role === 'organizer') {
                return <OrganizerDashboard />;
              }
              return <SuperadminDashboard />;
            }

            // Student & Volunteer Accounts
            if (activeSection === 'volunteer' && (user.role === 'volunteer' || user.is_approved_volunteer)) {
              return <VolunteerDashboard />;
            }

            if (activeSection === 'dashboard') {
              return user.role === 'volunteer' ? <VolunteerDashboard /> : <StudentDashboard />;
            }

            if (activeSection === 'events') {
              return (
                <div>
                  <div className="bg-[#0B132B] text-white py-10 px-4 border-b border-slate-800">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold">Discover Campus Events</h1>
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
                    onApplyVolunteer={(ev) => {
                      if (user && (user.role === 'volunteer' || user.is_approved_volunteer)) {
                        setActiveSection('volunteer');
                      } else {
                        handleOpenBecomeVolunteer(ev.id);
                      }
                    }}
                  />
                </div>
              );
            }

            if (activeSection === 'how-it-works') {
              return <HowItWorksPage onGetStarted={() => setIsRegisterOpen(true)} />;
            }

            if (activeSection === 'about') {
              return (
                <AboutPage
                  onGetStarted={() => setIsRegisterOpen(true)}
                  onExploreEvents={() => setActiveSection('events')}
                  isAuthenticated={isAuthenticated}
                />
              );
            }

            return (
              <HeroSection
                onGetStarted={() => setIsRegisterOpen(true)}
                onExploreEvents={() => setActiveSection('events')}
                onHowItWorks={() => setActiveSection('how-it-works')}
                isAuthenticated={isAuthenticated}
              />
            );
          }

          // Unauthenticated Public Visitors
          if (activeSection === 'how-it-works') {
            return <HowItWorksPage onGetStarted={() => setIsRegisterOpen(true)} />;
          }

          if (activeSection === 'about') {
            return (
              <AboutPage
                onGetStarted={() => setIsLoginOpen(true)}
                onExploreEvents={() => setIsLoginOpen(true)}
                isAuthenticated={false}
              />
            );
          }

          return (
            <HeroSection
              onGetStarted={() => setIsRegisterOpen(true)}
              onExploreEvents={() => setIsLoginOpen(true)}
              onHowItWorks={() => setActiveSection('how-it-works')}
              isAuthenticated={false}
            />
          );
        })()}
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
