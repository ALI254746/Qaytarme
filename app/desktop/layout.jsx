"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopHeader from "../components/TopHeader";

export default function DashboardLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-ivory dark:bg-black transition-colors duration-300">
      {/* Sidebar - Desktop Only */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Content Area */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* Header - Sticky */}
        <TopHeader />

        {/* Content */}
        <main className="p-4 lg:p-8 pb-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}


