import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface LayoutContextType {
  isNavbarVisible: boolean;
  setIsNavbarVisible: (visible: boolean) => void;
  navbarHeight: number;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const navbarHeight = 64; // 64px (4rem / h-16)

  const prevScrollY = useRef(0);
  const accumulatedDelta = useRef(0);

  useEffect(() => {
    // Set initial CSS custom properties on root
    const root = document.documentElement;
    root.style.setProperty('--navbar-height', `${navbarHeight}px`);
    root.style.setProperty('--sidebar-top', `${navbarHeight}px`);
    root.style.setProperty('--sidebar-height', `calc(100vh - ${navbarHeight}px)`);
    root.style.setProperty('--navbar-translate', '0%');

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY);
        const diff = currentScrollY - prevScrollY.current;

        // At or near the very top (scrollY <= 10px): ALWAYS SHOW NAVBAR
        if (currentScrollY <= 10) {
          setIsNavbarVisible(true);
          accumulatedDelta.current = 0;
          prevScrollY.current = currentScrollY;
          ticking = false;
          return;
        }

        // Reset accumulation if scroll direction flips
        if ((diff > 0 && accumulatedDelta.current < 0) || (diff < 0 && accumulatedDelta.current > 0)) {
          accumulatedDelta.current = 0;
        }
        accumulatedDelta.current += diff;

        // SCROLLING DOWN:
        // Hide after passing threshold (30px) and moving down by at least 15px
        if (diff > 0 && currentScrollY > 30) {
          if (accumulatedDelta.current >= 15) {
            setIsNavbarVisible(false);
          }
        }
        // SCROLLING UP:
        // Reveal immediately when meaningful upward scrolling begins (~6px)
        else if (diff < 0) {
          if (Math.abs(accumulatedDelta.current) >= 6) {
            setIsNavbarVisible(true);
          }
        }

        prevScrollY.current = currentScrollY;
        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navbarHeight]);

  // Synchronize CSS custom properties whenever isNavbarVisible changes
  useEffect(() => {
    const root = document.documentElement;
    if (isNavbarVisible) {
      root.style.setProperty('--sidebar-top', `${navbarHeight}px`);
      root.style.setProperty('--sidebar-height', `calc(100vh - ${navbarHeight}px)`);
      root.style.setProperty('--navbar-translate', '0%');
    } else {
      root.style.setProperty('--sidebar-top', '0px');
      root.style.setProperty('--sidebar-height', '100vh');
      root.style.setProperty('--navbar-translate', '-100%');
    }
  }, [isNavbarVisible, navbarHeight]);

  return (
    <LayoutContext.Provider value={{ isNavbarVisible, setIsNavbarVisible, navbarHeight }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
