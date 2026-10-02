import "./globals.css";
import React from "react";
import Providers from "./providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Buyum Qidiruv — yo‘qolgan va topilgan buyumlar",
  description: "Buyum Qidiruv orqali yo‘qolgan va topilgan buyumlarni izlang, e’lon bering va egasiga qaytaring.",
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-512.png', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${outfit.className} antialiased bg-[var(--color-ivory)] text-[var(--color-obsidian)]`}
      >
        <AppRouterCacheProvider options={{ key: "css" }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
