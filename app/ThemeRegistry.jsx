import { CacheProvider } from "@emotion/react";
import createEmotionCache from "./emotionCache";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const clientSideEmotionCache = createEmotionCache();

export default function ThemeRegistry({ children }) {
  const theme = createTheme({
    // Bu joyda istasang o'zingning MUI temangni sozlashing mumkin
  });

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
