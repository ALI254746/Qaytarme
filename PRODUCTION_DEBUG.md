# 🔍 Production Domain Google Login Debug

## Muammo: www.qaytarme.uz dan Google Login ishlamayapti

Keling, batafsil tekshiramiz:

---

## 1️⃣ Browser'da Xatolikni Ko'rish

### Qadam 1: Browser Console'da Tekshirish

1. `https://www.qaytarme.uz` ga kiring
2. F12 → **Console** tab
3. Google Login tugmasini bosing
4. Qanday xatolik ko'rsatilmoqda?

**Mumkin bo'lgan xatoliklar:**
- `redirect_uri_mismatch` → Google Console muammosi
- `502 Bad Gateway` → Backend (Railway) muammosi
- `Network Error` → Backend ulanish muammosi

### Qadam 2: Network Tab'da Tekshirish

1. F12 → **Network** tab
2. Google Login tugmasini bosing
3. `/api/auth/signin/google` so'rovini toping
4. **Request URL** ni ko'ring va `redirect_uri` parametrini tekshiring

**Kutilayotgan redirect_uri:**
```
https://www.qaytarme.uz/api/auth/callback/google
```

Agar boshqa URL ko'rsatilsa, muammo shu yerda!

---

## 2️⃣ Google Console'da Tekshirish

### Qadam 1: Google Cloud Console'ga Kirish

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. **APIs & Services** → **Credentials**
3. OAuth 2.0 Client ID ni tanlang va **Edit** tugmasini bosing

### Qadam 2: Authorized redirect URIs Tekshirish

**Authorized redirect URIs** bo'limida quyidagi URL bo'lishi kerak:

```
https://www.qaytarme.uz/api/auth/callback/google
```

⚠️ **MUHIM**: 
- Oxirida `/api/auth/callback/google` bo'lishi kerak
- `https://` bilan boshlanishi kerak
- Oxirida `/` bo'lmasligi kerak
- `www.` bilan boshlanishi kerak (agar `www.qaytarme.uz` ishlatilsa)

### Qadam 3: Ikkala Variantni Qo'shish

Agar `www.qaytarme.uz` va `qaytarme.uz` ikkalasi ham ishlatilsa, ikkalasini ham qo'shing:

```
https://www.qaytarme.uz/api/auth/callback/google
https://qaytarme.uz/api/auth/callback/google
```

### Qadam 4: Authorized JavaScript origins Tekshirish

**Authorized JavaScript origins** bo'limida quyidagilar bo'lishi kerak:

```
https://www.qaytarme.uz
https://qaytarme.uz
```

⚠️ **MUHIM**: 
- Oxirida `/` bo'lmasligi kerak
- Faqat domain nomi

---

## 3️⃣ Vercel Environment Variables Tekshirish

### Qadam 1: Vercel Dashboard'ga Kirish

1. [Vercel Dashboard](https://vercel.com) ga kiring
2. Loyihangizni tanlang
3. **Settings** → **Environment Variables**

### Qadam 2: NEXTAUTH_URL Tekshirish

`NEXTAUTH_URL` quyidagiga teng bo'lishi kerak:

```
https://www.qaytarme.uz
```

⚠️ **MUHIM**: 
- `https://` bilan boshlanishi kerak
- Oxirida `/` bo'lmasligi kerak
- `www.` bilan boshlanishi kerak (agar `www.qaytarme.uz` ishlatilsa)

### Qadam 3: NEXTAUTH_SECRET Tekshirish

`NEXTAUTH_SECRET` mavjudmi va bo'sh emasmi?

### Qadam 4: GOOGLE_CLIENT_ID va GOOGLE_CLIENT_SECRET Tekshirish

Ikkalasi ham mavjudmi va to'g'rimi?

---

## 4️⃣ Backend (Railway) Tekshirish

### Qadam 1: Backend Health Check

Browser'da quyidagi URL'ni oching:

```
https://YOUR-RAILWAY-URL/api/health
```

**Kutilayotgan javob:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45,
  "environment": "production"
}
```

Agar 404 yoki 502 qaytsa, backend ishlamayapti!

### Qadam 2: Backend CORS Tekshirish

Backend `www.qaytarme.uz` dan kelgan so'rovlarni qabul qiladimi?

`backend/src/main.ts` faylida CORS sozlamalarini tekshiring.

---

## 5️⃣ Vercel Redeploy

Agar environment variable o'zgargandan keyin redeploy qilmagan bo'lsangiz:

1. **Vercel Dashboard** → **Deployments**
2. Eng so'nggi deployment'ning **...** tugmasini bosing
3. **Redeploy** ni tanlang
4. **Redeploy** tugmasini bosing

---

## 6️⃣ Browser Cache Tozalash

1. Ctrl + Shift + Delete
2. **Cached images and files** ni tanlang
3. **Clear data** tugmasini bosing
4. Yoki **Incognito mode**'da test qiling

---

## 7️⃣ Tekshirish Checklist

- [ ] Browser Console'da xatolik ko'rdim
- [ ] Network Tab'da `redirect_uri` parametrini tekshirdim
- [ ] Google Console'da `www.qaytarme.uz/api/auth/callback/google` qo'shilgan
- [ ] Vercel'da `NEXTAUTH_URL` = `https://www.qaytarme.uz`
- [ ] Vercel'da `NEXTAUTH_SECRET` mavjud
- [ ] Vercel'da `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` mavjud
- [ ] Backend (Railway) ishlayapti (`/api/health` javob qaytaradi)
- [ ] Vercel redeploy qildim
- [ ] Browser cache'ni tozaladim

---

## 8️⃣ Keng Tarqalgan Xatoliklar

### Xatolik 1: redirect_uri_mismatch

**Sabab**: Google Console'da URL qo'shilmagan yoki noto'g'ri

**Yechim**: 
- Google Console → Credentials → OAuth 2.0 Client ID → Edit
- Authorized redirect URIs ga `https://www.qaytarme.uz/api/auth/callback/google` qo'shing
- Save tugmasini bosing

### Xatolik 2: 502 Bad Gateway

**Sabab**: Backend (Railway) ishlamayapti yoki CORS muammosi

**Yechim**:
- Railway'da backend ishlayotganini tekshiring
- `backend/src/main.ts` faylida CORS sozlamalarini tekshiring
- Railway URL'ni Vercel'da `NEXT_PUBLIC_API_URL` ga qo'shing

### Xatolik 3: Network Error

**Sabab**: Backend URL noto'g'ri yoki backend ishlamayapti

**Yechim**:
- Vercel'da `NEXT_PUBLIC_API_URL` ni tekshiring
- Railway'da backend ishlayotganini tekshiring

---

## 📞 Yordam

Agar muammo hal bo'lmasa, quyidagi ma'lumotlarni yuboring:

1. Browser Console'dan xatolik (screenshot)
2. Network Tab'dan `/api/auth/signin/google` so'rovi (screenshot)
3. Google Console'dan **Authorized redirect URIs** ro'yxati (screenshot)
4. Vercel'dan environment variables (screenshot)
5. Railway'dan backend logs (agar 502 bo'lsa)
