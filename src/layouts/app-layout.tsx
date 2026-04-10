"use client";

import { useState } from "react";
import AppSidebar from "./components/app-sidebar";
import AppHeader from "./components/app-header";

interface AppLayoutProps {
  userName: string;
  adminId?: number;
  legacyPortalUrl: string;
  children: React.ReactNode;
}

export default function AppLayout({
  userName,
  adminId,
  legacyPortalUrl,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {adminId != null && adminId > 0 && (
          <div className="bg-status-warning px-4 py-1.5 text-center text-[12px] font-medium text-text-heading">
            Admin viewing as customer
          </div>
        )}
        <AppHeader
          userName={userName}
          legacyPortalUrl={legacyPortalUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
