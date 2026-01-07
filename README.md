# 🔍 QaytarMe - Yo'qolgan buyumlarni topish platformasi

**QaytarMe** — bu yo'qolgan buyumlarni topish va egalariga qaytarishga yordam beruvchi zamonaviy veb-ilova.

## 🌟 Asosiy Imkoniyatlar

*   **📱 Mobil va Desktop:** Har qanday qurilma uchun moslashtirilgan interfeys.
*   **🌍 Ko'p tilli:** O'zbek, Rus, Ingliz, Qozoq, Qirg'iz va Qoraqalpoq tillarini qo'llab-quvvatlaydi.
*   **📍 Xarita integratsiyasi:** Buyum yo'qolgan yoki topilgan joyni xaritada belgilash.
*   **🤖 Smart Qidiruv:** Yo'qolgan va topilgan buyumlarni avtomatik solishtirish (AI matching).
*   **💬 Chat va Bildirishnomalar:** Foydalanuvchilar o'rtasida xavfsiz muloqot.
*   **🎨 Zamonaviy Dizayn:** "Mint/Ivory/Obsidian" ranglar palitrasi va chiroyli animatsiyalar.

## 🛠 Texnologiyalar

Ushbu loyiha eng zamonaviy texnologiyalar asosida qurilgan:

**Frontend:**
*   **Next.js 15** (App Router)
*   **Tailwind CSS** (Styling)
*   **Framer Motion** (Animatsiyalar)
*   **NextAuth.js** (Autentifikatsiya)
*   **Context API** (State Management)

**Backend:**
*   **NestJS** (Node.js Framework)
*   **MongoDB & Mongoose** (Database)
*   **JWT** (Xavfsizlik)
*   **Socket.io** (Real-vaqt yangilanishlar)

## 🚀 O'rnatish va Ishga tushirish

Loyihani o'z kompyuteringizda ishga tushirish uchun quyidagi qadamlarni bajaring:

### 1. Klonlash
```bash
git clone <REPOSITORY_URL>
cd musodara--master
```

### 2. Backend (Server) ni sozlash
```bash
cd backend
npm install
```
`.env` faylini yarating va kerakli o'zgaruvchilarni kiriting (MongoDB URI, JWT Secret va h.k).

Serverni ishga tushirish:
```bash
npm run start:dev
```

### 3. Frontend (Mijoz) ni sozlash
Yangi terminalda loyiha asosiy papkasiga qayting:
```bash
cd ..
npm install
```
Appni ishga tushirish:
```bash
npm run dev
```
Brauzerda [http://localhost:3000](http://localhost:3000) manziliga kiring.

## 🌐 Deploy (Internetga joylash)

Loyihani internetga joylash (Vercel va Render) bo'yicha to'liq qo'llanma bilan [**DEPLOYMENT_GUIDE_UZ.md**](./DEPLOYMENT_GUIDE_UZ.md) faylida tanishishingiz mumkin.

---
© 2024 QaytarMe Inc. Barcha huquqlar himoyalangan.
