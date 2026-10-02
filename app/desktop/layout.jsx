"use client";
import { Suspense } from "react";
import Shell from "../components/qaytarme/Shell";
export default function DashboardLayout({children}) { return <Suspense fallback={<div className="qm-loading">Buyum Qidiruv yuklanmoqda…</div>}><Shell>{children}</Shell></Suspense>; }
