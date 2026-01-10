"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTelegram } from "@/app/hooks/useTelegram";

export default function TelegramLogic() {
  const { data: session } = useSession();
  const { user: tgUser, tg } = useTelegram();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!tg) return;

    // --- 1. Auto Login ---
    if (tgUser && !session && !isAuthenticating) {
      const loginWithTelegram = async () => {
        setIsAuthenticating(true);
        try {
          const telegramData = JSON.stringify(tgUser);
          const result = await signIn('credentials', {
            redirect: false,
            telegramData: telegramData
          });
          
          if (result?.error) {
            console.error("BG Telegram Login Error:", result.error);
          } else {
            console.log("BG Telegram Login Success");
            // Refresh router to update session state if needed
            router.refresh(); 
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsAuthenticating(false);
        }
      };
      loginWithTelegram();
    }

    // --- 2. Platform Redirect (Mobile vs Desktop) ---
    // If we are inside Telegram, we can check tg.platform
    // Platforms: 'android', 'ios', 'tdesktop', 'macos', 'web', 'weba', 'unknown'
    
    if (tg.platform) {
        const isDesktopTg = ['tdesktop', 'macos', 'web', 'weba'].includes(tg.platform);
        
        // If user is on Desktop Telegram but viewing Mobile Page -> Go to Desktop
        if (isDesktopTg && pathname.startsWith('/mobile')) {
            console.log("Redirecting Desktop Telegram user to Desktop UI...");
            router.replace('/desktop');
        }

        // If user is on Mobile Telegram but viewing Desktop Page -> Go to Mobile
        // (This is less likely if Bot URL is /mobile, but good for safety)
        if (!isDesktopTg && pathname.startsWith('/desktop')) {
             console.log("Redirecting Mobile Telegram user to Mobile UI...");
             router.replace('/mobile');
        }
    }

  }, [tg, tgUser, session, isAuthenticating, pathname, router]);

  return null; // This component renders nothing
}
