# 🔧 Railway Backend Troubleshooting Guide

## 502 Error - Backend Not Responding

Agar sizda 502 xatolik bo'lsa, quyidagi qadamlarni tekshiring:

---

## 1️⃣ Railway URL'ni Topish

1. Railway Dashboard'ga kiring: https://railway.app
2. Loyihangizni tanlang
3. **Settings** → **Networking** bo'limiga o'ting
4. **Public Domain** yoki **Custom Domain** ni ko'ring
5. URL shunday ko'rinadi: `https://qaytarme-production.up.railway.app`

⚠️ **MUHIM**: URL oxirida `/api` bo'lmasligi kerak! Faqat base URL kerak.

---

## 2️⃣ Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://qaytarme-production.up.railway.app/api
```

⚠️ **Eslatma**: 
- URL oxiriga `/api` qo'shing
- `https://` bilan boshlanishi kerak
- `http://` ishlamaydi (HTTPS kerak)

---

## 3️⃣ Backend Health Check

Backend ishlayotganini tekshirish:

### Browser'da:
```
https://qaytarme-production.up.railway.app/api/health
```

Yoki:

```
https://qaytarme-production.up.railway.app/api
```

**Kutilayotgan javob:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T...",
  "uptime": 123.45,
  "environment": "production"
}
```

Agar 404 yoki 502 qaytsa, backend ishlamayapti.

---

## 4️⃣ Railway Environment Variables

Railway Dashboard → Project → Variables:

**Majburiy o'zgaruvchilar:**

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
TELEGRAM_API_ID=21944518
TELEGRAM_API_HASH=your-hash
TELEGRAM_SESSION=your-session-string
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=https://www.qaytarme.uz
PORT=4000
NODE_ENV=production
```

---

## 5️⃣ Railway Build Settings

Railway Dashboard → Project → Settings → Build:

- **Root Directory**: `backend` (agar backend papkada bo'lsa)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

---

## 6️⃣ Railway Logs

Backend xatoliklarini ko'rish:

1. Railway Dashboard → Project
2. **Deployments** → Eng so'nggi deployment
3. **View Logs** tugmasini bosing

**Qidirish kerak bo'lgan xatolar:**
- `Error: Cannot connect to MongoDB`
- `Error: Missing environment variable`
- `Error: Port already in use`
- `Error: AUTH_KEY_DUPLICATED` (Telegram session muammosi)

---

## 7️⃣ CORS Muammosi

Agar CORS xatolik bo'lsa:

1. `backend/src/main.ts` faylida CORS sozlamalari to'g'ri ekanligini tekshiring
2. Frontend URL Railway'da `CLIENT_URL` da mavjudligini tekshiring
3. Railway'ni redeploy qiling

---

## 8️⃣ Browser Console'da Tekshirish

Frontend'da (F12 → Console):

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

Agar `undefined` ko'rsatilsa, Vercel'da `NEXT_PUBLIC_API_URL` sozlanmagan.

---

## 9️⃣ Network Tab'da Tekshirish

1. Browser'da F12 → **Network** tab
2. Google Login qiling
3. `/api/auth/social-login` so'rovini toping
4. **Request URL** ni tekshiring:
   - To'g'ri: `https://qaytarme-production.up.railway.app/api/auth/social-login`
   - Noto'g'ri: `http://localhost:4000/api/auth/social-login`

---

## 🔟 Quick Fix Checklist

- [ ] Railway'da backend ishlayaptimi? (Logs'da "Nest application successfully started")
- [ ] Railway URL to'g'rimi? (Browser'da `/api/health` ochiladimi?)
- [ ] Vercel'da `NEXT_PUBLIC_API_URL` sozlanmaganmi?
- [ ] Vercel'da `NEXT_PUBLIC_API_URL` oxirida `/api` bormi?
- [ ] Railway'da barcha environment variables mavjudmi?
- [ ] Vercel'ni redeploy qildingizmi? (Environment variable o'zgargandan keyin)
- [ ] Railway'ni redeploy qildingizmi? (CORS o'zgargandan keyin)

---

## 🆘 Hali ham ishlamasa

1. **Railway Logs** ni to'liq ko'rib chiqing
2. **Vercel Logs** ni ko'ring (Deployments → View Function Logs)
3. **Browser Console** da barcha xatoliklarni ko'ring
4. **Network Tab** da so'rovlar va javoblarni tekshiring

---

## 📞 Yordam

Agar muammo hal bo'lmasa, quyidagi ma'lumotlarni yuboring:

1. Railway URL
2. Vercel URL
3. Browser Console xatoliklari
4. Network Tab'dan `/api/auth/social-login` so'rovi (screenshot)
5. Railway Logs (so'nggi 50 qator)
