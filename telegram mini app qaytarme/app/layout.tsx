import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit, Playfair_Display, JetBrains_Mono } from "next/font/google"; // Import Google fonts
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { UIProvider } from "@/context/UIContext";
import { ToastProvider } from "@/components/ToastProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "QaytarMe - Yo'qolgan va Topilgan narsalar",
  description: "Telegram Mini App for Lost & Found items",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className={`${plusJakartaSans.variable} ${outfit.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} min-h-screen font-sans bg-background text-foreground antialiased overflow-x-hidden selection:bg-primary/30`}>
        <ErrorBoundary>
          <UIProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ToastProvider>
                  <div className="relative z-0 min-h-screen flex flex-col">
            {/* Background Ambient Effect - subtle blend */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
              {/* We rely on Background3D primarily, this is a fallback backbone */}
              <div className="absolute inset-0 bg-background" />
            </div>
            
            <main className="flex-1 w-full">
              {children}
            </main>
            
            <BottomNav />
          </div>
                </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </UIProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
