const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); 
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    const val = values.join('=').trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = val;
                    }
                }
            });
            console.log("Loaded .env from", envPath);
        }
    } catch (e) {
        console.log("Error loading .env", e);
    }
}

loadEnv();

const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;

if (!API_ID || !API_HASH) {
    console.error("Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in backend/.env file.");
    process.exit(1);
}

(async () => {
    console.log("Telegram Sessiyasini yaratish (Kod orqali)...");
    console.log(`API ID: ${API_ID}`);
    
    const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, {
        connectionRetries: 5,
    });
    
    await client.start({
        phoneNumber: async () => await input.text("Telefon raqamingizni kiriting (+998...): "),
        password: async () => await input.text("Parolingizni kiriting (agar 2FA bo'lsa): "),
        phoneCode: async () => await input.text("Sizga kelgan kodni kiriting: "),
        onError: (err) => console.log(err),
    });
    
    console.log("\n-----------------------------------------------------------");
    console.log("Sessiya kodi muvaffaqiyatli yaratildi!");
    console.log("Iltimos, quyidagi kodni nusxalab oling va backend/.env fayliga TELEGRAM_SESSION=... sifatida joylashtiring:");
    console.log("-----------------------------------------------------------");
    console.log(client.session.save()); 
    console.log("-----------------------------------------------------------");
    
    try {
        await client.sendMessage("me", { message: "Musodara/QaytarMe: Sessiya yaratildi!" });
    } catch (e) {}
    
    process.exit(0);
})();
