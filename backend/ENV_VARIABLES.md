# Backend Environment Variables

Backend servisini ishga tushirish uchun quyidagi environment o'zgaruvchilar kerak:

## 📋 Majburiy O'zgaruvchilar

### Database
```env
MONGODB_URI=mongodb://localhost:27017/lostfound
# Yoki MongoDB Atlas uchun:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound
```

### Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Google Generative AI (Gemini)
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### Telegram API
```env
TELEGRAM_API_ID=your-telegram-api-id
TELEGRAM_API_HASH=your-telegram-api-hash
TELEGRAM_SESSION=your-telegram-session-string
```

### Cloudinary (Image Upload)
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## 🔧 Ixtiyoriy O'zgaruvchilar

### Server Configuration
```env
PORT=4000
CLIENT_URL=http://localhost:3000
```

### Email Configuration
```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@qaytarme.uz
```

### Google Cloud Translation
```env
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

### Google Maps API (Places/Geocoding) - Optional
```env
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```
**Note:** If not provided, the system will use hardcoded coordinates for known locations only.

### Push Notifications (VAPID)
```env
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 📝 To'liq .env Fayl Namunasi

```env
# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/lostfound

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Generative AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key-here

# Telegram API
TELEGRAM_API_ID=21944518
TELEGRAM_API_HASH=your-telegram-api-hash
TELEGRAM_SESSION=your-telegram-session-string

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=4000
CLIENT_URL=http://localhost:3000

# Email Configuration (Optional)
# RESEND_API_KEY=your-resend-api-key
# EMAIL_FROM=noreply@qaytarme.uz

# Google Cloud Translation (Optional)
# GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# Push Notifications (Optional)
# VAPID_PUBLIC_KEY=your-vapid-public-key
# VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 🔑 API Key'larni Qanday Olish

### 1. Gemini API Key (Bepul)
**Variant 1: Google AI Studio (Eng oson)**
- [Google AI Studio](https://aistudio.google.com/app/apikey) ga kiring
- Google hisobingiz bilan kirish
- "Get API Key" yoki "Create API Key" tugmasini bosing
- API kalitni ko'chirib `.env` fayliga qo'shing

**Variant 2: Google Cloud Console**
- [Google Cloud Console](https://console.cloud.google.com) ga kiring
- Yangi loyiha yarating
- "APIs & Services" > "Library" ga kiring
- "Generative Language API" ni qidiring va "Enable" qiling
- "APIs & Services" > "Credentials" > "Create Credentials" > "API Key"
- API kalitni ko'chirib `.env` fayliga qo'shing

**Eslatma:** Agar API kalit bo'lmasa, tizim AI siz ham ishlaydi (asosiy matn analizi bilan)

### 2. Google Maps API Key (Ixtiyoriy - Joylashuv koordinatalari uchun)
- [Google Cloud Console](https://console.cloud.google.com) ga kiring
- Loyihangizni tanlang yoki yangi yarating
- "APIs & Services" > "Library" ga kiring
- "Geocoding API" ni qidiring va "Enable" qiling
- "Places API" ni ham qidiring va "Enable" qiling (ixtiyoriy, lekin tavsiya etiladi)
- "APIs & Services" > "Credentials" > "Create Credentials" > "API Key"
- API kalitni ko'chirib `.env` fayliga qo'shing: `GOOGLE_MAPS_API_KEY=your-key-here`

**Eslatma:** Agar API kalit bo'lmasa, tizim faqat hardcoded joylar uchun koordinatalarni ishlatadi (bakatoshi pitak, Chilonzor va boshqalar)

### 3. Telegram API
- [my.telegram.org](https://my.telegram.org) ga kiring
- API development tools bo'limiga o'ting
- API ID va API Hash oling

### 3. Cloudinary
- [Cloudinary](https://cloudinary.com) ga ro'yxatdan o'ting
- Dashboard'dan Cloud Name, API Key va API Secret oling

### 4. MongoDB Atlas
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ga ro'yxatdan o'ting
- Cluster yarating va Connection String oling

## ⚠️ Eslatmalar

- `.env` faylini **hech qachon** GitHub'ga yuklamang!
- Production'da barcha o'zgaruvchilarni to'ldirishni unutmang
- `JWT_SECRET` ni kuchli va maxfiy qiling
- `TELEGRAM_SESSION` ni xavfsiz saqlang
