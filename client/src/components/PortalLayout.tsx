import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';

export interface PortalLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  activeTab,
  onTabChange,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex antialiased">
      {/* 1. Desktop Fixed Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 xl:w-72 z-40 shadow-xl">
        <PortalSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* 2. Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl flex flex-col">
            <PortalSidebar
              onCloseMobile={() => setMobileNavOpen(false)}
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      )}

      {/* 3. Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 min-h-screen bg-slate-50">
        <PortalHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
