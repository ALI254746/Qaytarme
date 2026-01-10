
import { useEffect, useState } from 'react';

export function useTelegram() {
    const [tg, setTg] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            setTg(webApp);
            
            // Expand strictly on mount
            // webApp.expand();
            
            // Get user data
            if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
                setUser(webApp.initDataUnsafe.user);
            }
        }
    }, []);

    const onClose = () => {
        tg?.close();
    };

    const onToggleButton = () => {
        if (tg?.MainButton.isVisible) {
            tg.MainButton.hide();
        } else {
            tg?.MainButton.show();
        }
    };

    return {
        onClose,
        onToggleButton,
        tg,
        user,
        queryId: tg?.initDataUnsafe?.query_id,
    };
}
