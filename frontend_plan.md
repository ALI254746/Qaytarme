# QaytarMe - Frontend Amalgami Plani

## 1. Navbatdagi Bosqichlar (To-Do)

### 🟢 A. Avtentifikatsiya va Ro'yxatdan o'tish (Hozirgi ustuvorlik)
- [ ] **Register Page Re-design**: O'chirilgan ro'yxatdan o'tish sahifasini yangi Mint/Ivory dizaynida qayta tiklash.
- [ ] **Verify Page**: Emailga kelgan kodni kiritish interfeysini zamonaviy dizaynda (OTP input) qayta tiklash.
- [ ] **Auth Middleware**: `/mainpage` va `/admin` yo'nalishlarini himoya qilish (faqat login qilganlar kirishi uchun).

### 🟡 B. Asosiy Dashboard (Main Feed)
- [ ] **Real API Integration**: E'lonlarni mock ma'lumotdan real ma'lumotlar bazasiga o'tkazish.
- [ ] **Infinite Scroll**: E'lonlar ko'payganda ularni sahifalab yuklash tizimi.
- [ ] **Advanced Filtering**: Kategoriya, shahar va holat (lost/found) bo'yicha qidiruvni API darajasida ulash.

### 🔴 C. E'lon berish (Ariza sahifasi)
- [ ] **Multi-step Form Polish**: Hozirgi `app/ariza` sahifasini `/mainpage/add` ga ko'chirish va dizaynni yakunlash.
- [ ] **Image Upload**: Rasmlarni Cloudinary yoki S3 ga yuklash tizimi.
- [ ] **Map Localization**: Xaritadan joy tanlanganda manzilni avtomatik aniqlash (Reverse Geocoding).

### 🟣 D. Admin Panel (Backend ulanishi)
- [ ] **Moderation Logic**: "Approve" va "Reject" tugmalarini API ga ulash.
- [ ] **User Management**: Foydalanuvchilarni bloklash va ularning e'lonlari ustidan nazorat.
- [ ] **Live Stats**: Statistikani bazadagi ma'lumotlar asosida hisoblash.

### 🔵 E. Aloqa va Bildirishnomalar
- [ ] **Real-time Chat**: Pusher yoki Socket.io yordamida jonli muloqot tizimi.
- [ ] **In-app Notifications**: Kimdir buyumingizni topgani haqida xabar borsa, push-notification ko'rsatish.

---

## 2. Dizayn Tizimi (Design Tokens)
- **Primary**: Mint (#A9D3C9)
- **Secondary**: Ivory (#F7F6E2)
- **Background (Dark)**: #0A0A0A (Neutral 950)
- **Radius**: Large (2.5rem / 40px)
- **Typography**: Oswald (Sarlavhalar), Inter/Segoe UI (Matnlar)

---

## 3. Texnologik Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State**: React Context / Hooks
- **Auth**: NextAuth.js
- **Database**: MongoDB (Mongoose)
- **Animations**: Framer Motion
