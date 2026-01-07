// app/providers.jsx
"use client";

import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SessionProvider } from "next-auth/react";
import theme from "./theme";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";

import { LanguageProvider } from "@/context/LanguageContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <CustomThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </CustomThemeProvider>
      </MUIThemeProvider>
    </SessionProvider>
  );
}
