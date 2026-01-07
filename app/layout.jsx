import "./globals.css";
import React from "react";
import Providers from "./providers";

import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "QaytarMe - Topilmalar Byurosi",
  description: "Yo'qolgan buyumlarni topish va qaytarish uchun yagona platforma.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${outfit.className} antialiased bg-[var(--color-ivory)] text-[var(--color-obsidian)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
