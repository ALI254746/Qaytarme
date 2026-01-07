// app/ClientLayout.jsx
"use client";

import { useState } from "react";
import MobileNav from "./components/MobileNav";
import SplashScreen from "./components/SplashScreen";

export default function ClientLayout({ children }) {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <>
      {!splashFinished && <SplashScreen onComplete={() => setSplashFinished(true)} />}
      <div className={!splashFinished ? "hidden" : ""}>
        {children}
        <MobileNav />
      </div>
    </>
  );
}
