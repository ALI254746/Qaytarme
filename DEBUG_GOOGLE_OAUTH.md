# 🔍 Google OAuth Debug Qo'llanmasi

## Muammo: redirect_uri_mismatch hali ham bor

Agar Google Console'da barcha URL'larni qo'shgan bo'lsangiz ham xatolik davom etsa, quyidagilarni tekshiring:

---

## 1️⃣ Vercel Environment Variables Tekshirish

### Qadam 1: Vercel Dashboard'ga Kirish

1. [Vercel Dashboard](https://vercel.com) ga kiring
2. Loyihangizni tanlang
3. **Settings** → **Environment Variables**

### Qadam 2: NEXTAUTH_URL Tekshirish

**MUHIM**: `NEXTAUTH_URL` qaysi URL'ga teng?

- Agar preview deployment bo'lsa: `https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app`
- Agar production bo'lsa: `https://www.qaytarme.uz`

⚠️ **Eslatma**: `NEXTAUTH_URL` browser'da ochilgan URL bilan mos kelishi kerak!

### Qadam 3: Environment Variable Qo'shish/Yangilash

Agar `NEXTAUTH_URL` yo'q bo'lsa yoki noto'g'ri bo'lsa:

1. **Add New** tugmasini bosing
2. **Key**: `NEXTAUTH_URL`
3. **Value**: Browser'da ko'rsatilgan URL (masalan: `https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app`)
4. **Environment**: **Production, Preview, Development** (uchalasini tanlang)
5. **Save** tugmasini bosing

---

## 2️⃣ Google Console'da URL'lar Tekshirish

### Qadam 1: Google Cloud Console'ga Kirish

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. **APIs & Services** → **Credentials**
3. OAuth 2.0 Client ID ni tanlang va **Edit** tugmasini bosing

### Qadam 2: Authorized redirect URIs Ro'yxatini Tekshirish

**Authorized redirect URIs** bo'limida quyidagilar bo'lishi kerak:

```
https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
https://www.qaytarme.uz/api/auth/callback/google
https://qaytarme.uz/api/auth/callback/google
https://qaytarme.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

⚠️ **MUHIM**: 
- Har bir URL alohida qator bo'lishi kerak
- Oxirida `/api/auth/callback/google` bo'lishi kerak
- `https://` yoki `http://` bilan boshlanishi kerak
- Oxirida `/` bo'lmasligi kerak

### Qadam 3: Authorized JavaScript origins Tekshirish

**Authorized JavaScript origins** bo'limida quyidagilar bo'lishi kerak:

```
https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app
https://www.qaytarme.uz
https://qaytarme.uz
https://qaytarme.vercel.app
http://localhost:3000
```

⚠️ **MUHIM**: 
- Oxirida `/` bo'lmasligi kerak
- Faqat domain nomi

---

## 3️⃣ Browser'da Debug Qilish

### Qadam 1: Browser Console'da Tekshirish

1. Saytga kiring (qaysi URL'dan login qilmoqchi bo'lsangiz)
2. F12 → **Console** tab
3. Quyidagilarni yozing:

```javascript
console.log('Current URL:', window.location.href);
console.log('Origin:', window.location.origin);
```

4. Bu URL Google Console'dagi ro'yxatda bo'lishi kerak!

### Qadam 2: Network Tab'da Tekshirish

1. F12 → **Network** tab
2. **Google Login** tugmasini bosing
3. `/api/auth/signin/google` so'rovini toping
4. **Request URL** ni ko'ring va `redirect_uri` parametrini tekshiring
5. Bu URL Google Console'dagi ro'yxatda bo'lishi kerak!

---

## 4️⃣ Vercel'ni Redeploy Qilish

Environment variable o'zgargandan keyin **majburiy** redeploy qilish kerak!

### Qadam 1: Manual Redeploy

1. Vercel Dashboard → Project
2. **Deployments** tab
3. Eng so'nggi deployment'ning **...** tugmasini bosing
4. **Redeploy** ni tanlang
5. **Redeploy** tugmasini bosing

### Qadam 2: Yangi Commit (Ixtiyoriy)

Yoki GitHub'ga yangi commit qiling, Vercel avtomatik deploy qiladi.

---

## 5️⃣ Tekshirish Checklist

- [ ] Vercel'da `NEXTAUTH_URL` environment variable mavjudmi?
- [ ] `NEXTAUTH_URL` browser'dagi URL bilan mos keladimi?
- [ ] Google Console'da **Authorized redirect URIs** ga barcha URL'lar qo'shilganmi?
- [ ] Google Console'da **Authorized JavaScript origins** ga barcha URL'lar qo'shilganmi?
- [ ] Vercel'ni redeploy qildingizmi? (Environment variable o'zgargandan keyin)
- [ ] Browser'da yangi tab ochib, cache'ni tozalab test qildingizmi?

---

## 6️⃣ Keng Tarqalgan Xatoliklar

### Xatolik 1: NEXTAUTH_URL Noto'g'ri

**Belgilar**: Browser'da boshqa URL, lekin Vercel'da boshqa `NEXTAUTH_URL`

**Yechim**: Vercel'da `NEXTAUTH_URL` ni browser'dagi URL bilan moslashtiring

### Xatolik 2: Preview URL Har Safar O'zgaradi

**Belgilar**: Har safar yangi preview URL yaratiladi va xatolik chiqadi

**Yechim**: Production domain sozlang (`www.qaytarme.uz`) va faqat production URL'ni Google Console'ga qo'shing

### Xatolik 3: Cache Muammosi

**Belgilar**: Barcha sozlamalar to'g'ri, lekin hali ham xatolik

**Yechim**: 
- Browser cache'ni tozalang (Ctrl+Shift+Delete)
- Incognito mode'da test qiling
- Vercel'ni redeploy qiling

---

## 7️⃣ Production Domain Sozlash (Tavsiya)

Agar preview URL'lardan foydalanmoqchi bo'lmasangiz:

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. **Add Domain** tugmasini bosing
3. `www.qaytarme.uz` yoki `qaytarme.uz` ni kiriting
4. DNS sozlamalarini qiling
5. Google Console'ga faqat production URL qo'shing
6. Vercel'da `NEXTAUTH_URL` ni `https://www.qaytarme.uz` ga o'rnating

---

## 📞 Yordam

Agar muammo hal bo'lmasa, quyidagi ma'lumotlarni yuboring:

1. Browser'dagi URL (qaysi URL'dan login qilmoqchi bo'lsangiz)
2. Vercel'da `NEXTAUTH_URL` qiymati (screenshot)
3. Google Console'dan **Authorized redirect URIs** ro'yxati (screenshot)
4. Browser Console'dan xatoliklar (agar bor bo'lsa)
5. Network Tab'dan `/api/auth/signin/google` so'rovi (screenshot)
