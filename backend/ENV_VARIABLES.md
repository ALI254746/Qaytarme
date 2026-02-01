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

### 1. Gemini API Key
- [Google AI Studio](https://makersuite.google.com/app/apikey) ga kiring
- Yangi API key yarating

### 2. Telegram API
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
