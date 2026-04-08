"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface AppLayoutProps {
  userName: string;
  adminId?: number;
  children: React.ReactNode;
}

export default function AppLayout({
  userName,
  adminId,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
