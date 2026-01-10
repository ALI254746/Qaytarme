const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
require('dotenv').config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

(async () => {
    console.log("🚀 Telegramga ulanish boshlandi...");
    console.log("VPN yoniqligiga ishonch hosil qiling!");

    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
        // useWSS: true, // O'chirib turamiz
        deviceModel: "Desktop",
        systemVersion: "Windows 10",
        appVersion: "4.16.8",
        langCode: "en",
    });
    
    await client.start({
        phoneNumber: async () => await input.text("Telefon raqamingiz (+998xxxxxxxxx): "),
        password: async () => await input.text("Ikki bosqichli parol (agar bo'lsa): "),
        phoneCode: async () => await input.text("Telegramga kelgan kod: "),
        onError: (err) => console.log("Xatolik:", err),
    });
    
    console.log("\n✅ TABRIKLAYMAN! Sessiya olindi!");
    console.log("Quyidagi kodni nusxalab, .env fayliga TELEGRAM_SESSION= dan keyin qo'ying:\n");
    console.log(client.session.save());
    console.log("\n");
    
    await client.disconnect();
    process.exit(0);
})();
