"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopHeader from "../components/TopHeader";

export default function DashboardLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isMapPage = pathname === "/desktop/map";
  const isAddPage = pathname === "/desktop/add";
  const isMessagesPage = pathname === "/desktop/messages";

  return (
    <div className="min-h-screen bg-[#f7f7f7] transition-colors duration-300">
      {/* Sidebar - Desktop Only */}
      <Sidebar isCollapsed={isSidebarCollapsed} compactHeader={isAddPage} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Content Area */}
      <div className={`flex flex-col transition-all duration-300 ${isMessagesPage ? "h-screen overflow-hidden" : "min-h-screen"} ${isSidebarCollapsed ? 'md:ml-16' : isAddPage ? 'md:ml-[168px]' : 'md:ml-40'}`}>
        {/* Header - Sticky */}
        {!isMapPage && !isMessagesPage && <TopHeader compact={isAddPage} />}

        {/* Content */}
        <main className={`flex-1 bg-[#f7f7f7] ${isMessagesPage ? "h-screen min-h-0 overflow-hidden p-0" : isAddPage ? "min-h-[calc(100vh-42px)] p-0" : `min-h-[calc(100vh-3.25rem)] ${isMapPage ? "py-1 px-2" : "py-1 px-4 lg:px-4"}`}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
