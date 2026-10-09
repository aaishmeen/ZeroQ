import React, { useState, useEffect } from 'react';
import { ZeroQLogo } from './ZeroQLogo';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { getFileUrl } from '../../api/events';
import { LogOut, LayoutDashboard, Menu, X, Bell, QrCode } from 'lucide-react';
import { getVolunteerNotificationsApi } from '../../api/volunteers';
import type { VolunteerNotification } from '../../types';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenBecomeVolunteer?: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenBecomeVolunteer,
  activeSection,
  setActiveSection,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isNavbarVisible, setIsNavbarVisible } = useLayout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<VolunteerNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Keep navbar visible when mobile menu or notifications popover is open
  useEffect(() => {
    if (mobileMenuOpen || isNotifOpen) {
      setIsNavbarVisible(true);
    }
  }, [mobileMenuOpen, isNotifOpen, setIsNavbarVisible]);

  // Keep navbar visible when active section changes
  useEffect(() => {
    setIsNavbarVisible(true);
  }, [activeSection, setIsNavbarVisible]);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar_url]);

  useEffect(() => {
    if (isAuthenticated && user) {
      getVolunteerNotificationsApi()
        .then((data) => setNotifications(data))
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'events' && !isAuthenticated) {
      onOpenLogin();
      return;
    }
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  const hasVolunteerAccess =
    user?.role === 'admin' ||
    user?.role === 'organizer' ||
    user?.role === 'volunteer' ||
    user?.role === 'superadmin' ||
    user?.is_approved_volunteer === true;

  return (
    <header
      onFocus={() => setIsNavbarVisible(true)}
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-[#0B132B]/90 backdrop-blur-xl border-b border-blue-500/20 shadow-xl transform transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
        isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo in Light / White variant */}
          <div
            className="cursor-pointer flex items-center gap-2 group"
            onClick={() =>
              setActiveSection(
                isAuthenticated ? (user && (user.role === 'student' || user.role === 'volunteer') ? 'events' : 'dashboard') : 'home'
              )
            }
          >
            <ZeroQLogo size="md" variant="light" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-[#0F172A]/80 border border-white/10 rounded-full px-3 py-1 shadow-inner">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'home'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </button>

            {isAuthenticated && user && (user.role === 'student' || user.role === 'volunteer') && (
              <button
                onClick={() => handleNavClick('events')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'events'
                    ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Discover Events
              </button>
            )}

            {onOpenBecomeVolunteer && (!isAuthenticated || user?.role === 'student') && (
              <button
                onClick={onOpenBecomeVolunteer}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] transition-all cursor-pointer shadow-md"
              >
                Volunteer
              </button>
            )}

            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'how-it-works'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              How It Works
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'about'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              About
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setNotifRead(true);
                    }}
                    className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer border border-white/10"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {!notifRead && notifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF5E36] text-white font-bold text-[10px] rounded-full flex items-center justify-center border border-[#0B132B]">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#0B132B] border border-slate-700/80 rounded-2xl shadow-2xl py-3 px-4 z-50 space-y-3 backdrop-blur-xl">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <h3 className="text-xs font-bold uppercase text-[#06B6D4] tracking-wider">
                          Notifications
                        </h3>
                        <button
                          onClick={() => setIsNotifOpen(false)}
                          className="text-slate-400 hover:text-white"
                          aria-label="Close notifications"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          No notifications at this time.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {user.role !== 'volunteer' && (
                  <button
                    onClick={() => setActiveSection('dashboard')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeSection === 'dashboard'
                        ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                )}

                {hasVolunteerAccess && (
                  <button
                    onClick={() => setActiveSection('volunteer')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeSection === 'volunteer' || (user.role === 'volunteer' && activeSection === 'dashboard')
                        ? 'bg-gradient-to-r from-[#FF5E36] to-[#F97316] text-white shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Volunteer Portal
                  </button>
                )}

                <div 
                  onClick={() => setActiveSection('dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/15 rounded-full border border-white/10 cursor-pointer transition-colors"
                  title="View My Profile & Dashboard"
                >
                  {user.avatar_url &&
                  typeof user.avatar_url === 'string' &&
                  user.avatar_url.trim() !== '' &&
                  user.avatar_url !== 'null' &&
                  user.avatar_url !== 'undefined' &&
                  !imgError ? (
                    <img
                      src={getFileUrl(user.avatar_url)}
                      alt={user.name}
                      onError={() => setImgError(true)}
                      className="w-6 h-6 rounded-full object-cover border border-[#06B6D4]"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                    <span className="text-[10px] font-semibold text-[#06B6D4] tracking-wider block">
                      {user.role === 'student' && user.is_approved_volunteer
                        ? 'STUDENT • VOLUNTEER'
                        : user.role === 'volunteer'
                        ? `Volunteer • ${user.volunteer_id || `ZQ-VOL-${String(user.id).padStart(6, '0')}`}`
                        : user.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-300 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer border border-white/10"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenLogin}
                  className="text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-full transition-colors cursor-pointer hover:bg-white/10 border border-transparent hover:border-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenRegister}
                  className="bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] text-white px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-orange-500/20"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:bg-white/10 rounded-xl focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0B132B]/95 backdrop-blur-xl px-4 pt-2 pb-5 space-y-2">
          <button
            onClick={() => handleNavClick('home')}
            className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'home' ? 'bg-[#1D4ED8] text-white' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Home
          </button>
          {isAuthenticated && user && (user.role === 'student' || user.role === 'volunteer') && (
            <button
              onClick={() => handleNavClick('events')}
              className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'events' ? 'bg-[#1D4ED8] text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              Discover Events
            </button>
          )}
          {onOpenBecomeVolunteer && (!isAuthenticated || user?.role === 'student') && (
            <button
              onClick={() => {
                onOpenBecomeVolunteer();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5E36] to-[#F97316] hover:from-[#ea522a] hover:to-[#e06109] transition-all shadow-md cursor-pointer"
            >
              Volunteer
            </button>
          )}
          <button
            onClick={() => handleNavClick('how-it-works')}
            className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'how-it-works' ? 'bg-[#1D4ED8] text-white' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'about' ? 'bg-[#1D4ED8] text-white' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            About
          </button>

          <div className="pt-3 border-t border-white/10">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveSection('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  My Dashboard ({user.role})
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-bold text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center font-bold text-slate-200 bg-white/10 rounded-xl text-xs border border-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenRegister();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center font-bold text-white bg-gradient-to-r from-[#FF5E36] to-[#F97316] rounded-xl text-xs shadow-md"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
