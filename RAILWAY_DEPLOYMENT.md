# Railway Backend Deployment Qo'llanmasi

## ✅ Backend Railway'da Ishga Tushgan

Log'lardan ko'rinib turibdiki, backend muvaffaqiyatli ishga tushgan:
- ✅ NestJS aplikatsiyasi ishga tushdi
- ✅ MongoDB ulandi
- ✅ Barcha route'lar mapp qilindi
- ✅ Telegram servis ishlayapti
- ✅ Domain: `qaytarme-production.up.railway.app`

## 🔧 Railway Environment Variables

Railway Dashboard → Settings → Variables bo'limida quyidagi o'zgaruvchilar bo'lishi kerak:

### Majburiy O'zgaruvchilar:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Google Generative AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key

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
CLIENT_URL=https://www.qaytarme.uz
```

### Ixtiyoriy O'zgaruvchilar:

```env
# Email (Optional)
RESEND_API_KEY=your-resend-api-key

# Google Cloud Translation (Optional)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

## 📋 Railway Sozlamalari

### Build & Deploy Settings:

- **Root Directory:** `backend` (⚠️ Muhim!)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`
- **Node Version:** 20.x (yoki 18.x)

### Port Configuration:

Railway avtomatik `PORT` environment variable'ni o'rnatadi. Kodda:
```typescript
await app.listen(process.env.PORT || 4000);
```

Bu shuni anglatadiki:
- Railway `PORT` ni avtomatik o'rnatadi
- Agar yo'q bo'lsa, default 4000 ishlatiladi

## 🌐 Frontend Sozlamalari (Vercel)

Vercel'da quyidagi environment variable'lar bo'lishi kerak:

```env
NEXT_PUBLIC_API_URL=https://qaytarme-production.up.railway.app/api
NEXTAUTH_URL=https://www.qaytarme.uz
NEXTAUTH_SECRET=your-secret-key-32-chars-min
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**⚠️ Muhim:** `NEXT_PUBLIC_API_URL` oxirida `/api` bo'lishi kerak!

## 🔍 Tekshirish

### 1. Backend Health Check:

Brauzerda yoki terminalda:
```bash
curl https://qaytarme-production.up.railway.app/api
```

Yoki brauzerda oching:
```
https://qaytarme-production.up.railway.app/api
```

### 2. Frontend'da Tekshirish:

Browser Console'da (F12):
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
fetch('https://qaytarme-production.up.railway.app/api')
  .then(res => res.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend Error:', err));
```

## 🐛 Muammolarni Hal Qilish

### Muammo 1: 502 Bad Gateway

**Sabab:** Frontend backend'ga ulanmayapti

**Yechim:**
1. Vercel'da `NEXT_PUBLIC_API_URL` to'g'ri ekanligini tekshiring
2. Railway'da backend Online ekanligini tekshiring
3. Redeploy qiling

### Muammo 2: CORS Error

**Sabab:** Backend CORS sozlamalari noto'g'ri

**Yechim:**
- Backend'da (`backend/src/main.ts`) frontend domain'lariga ruxsat berilgan
- Railway'da `CLIENT_URL` to'g'ri sozlanganligini tekshiring

### Muammo 3: Environment Variables Yo'q

**Sabab:** Railway'da environment variables sozlanmagan

**Yechim:**
- Railway Dashboard → Settings → Variables
- Barcha kerakli o'zgaruvchilarni qo'shing
- Redeploy qiling

## 📝 Keyingi Qadamlar

1. ✅ Railway'da barcha environment variables'ni tekshiring
2. ✅ Vercel'da `NEXT_PUBLIC_API_URL` ni yangilang
3. ✅ Redeploy qiling
4. ✅ Browser Console'da tekshiring

## 🔗 Foydali Linklar

- Railway Dashboard: https://railway.app
- Vercel Dashboard: https://vercel.com
- Backend URL: https://qaytarme-production.up.railway.app
- Frontend URL: https://www.qaytarme.uz
