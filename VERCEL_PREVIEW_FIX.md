# 🔧 Vercel Preview Deployment uchun NEXTAUTH_URL Sozlash

## Muammo

`NEXTAUTH_URL` faqat production domain'ga sozlangan:
```
NEXTAUTH_URL=https://www.qaytarme.uz
```

Lekin preview deployment URL'dan login qilmoqchisiz:
```
https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app
```

## Yechim 1: Preview Environment uchun Alohida NEXTAUTH_URL

### Qadam 1: Vercel Dashboard'da

1. **Settings** → **Environment Variables**
2. `NEXTAUTH_URL` ni toping va **Edit** tugmasini bosing
3. **Environment** dropdown'da **Preview** ni tanlang
4. **Value** ni preview URL'ga o'zgartiring:
   ```
   https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app
   ```
5. **Save** tugmasini bosing

⚠️ **MUHIM**: Production uchun `https://www.qaytarme.uz` ni saqlab qo'ying!

### Qadam 2: Google Console'da

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. **APIs & Services** → **Credentials** → OAuth 2.0 Client ID → **Edit**
3. **Authorized redirect URIs** ga quyidagini qo'shing:
   ```
   https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
   ```
4. **Save** tugmasini bosing

### Qadam 3: Redeploy

1. Vercel Dashboard → **Deployments**
2. Eng so'nggi deployment'ning **...** tugmasini bosing
3. **Redeploy** ni tanlang

---

## Yechim 2: Production Domain'dan Foydalanish (Tavsiya)

Agar `www.qaytarme.uz` production'da ishlayotgan bo'lsa:

1. Browser'da `https://www.qaytarme.uz` ga kiring
2. U yerdan Google Login qiling
3. Bu ishlashi kerak, chunki `NEXTAUTH_URL` allaqachon `https://www.qaytarme.uz` ga sozlangan

---

## Yechim 3: Dynamic NEXTAUTH_URL (Kod O'zgarishi)

Agar har safar yangi preview URL yaratilganda muammo bo'lsa, kodda dynamic qilish mumkin:

`lib/authOptions.js` faylida:

```javascript
export const authOptions = {
  // ...
  // Dynamic NEXTAUTH_URL
  ...(process.env.NEXTAUTH_URL && {
    // Use environment variable if set
  }),
  // Or use request headers to determine URL
  callbacks: {
    // ...
  },
}
```

Lekin bu murakkab va NextAuth.js'ning default xatti-harakatiga mos kelmaydi.

---

## Tezkor Yechim (Hozirgi Muammo Uchun)

**Hozirgi muammoni hal qilish uchun:**

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. `NEXTAUTH_URL` ni **Edit** qiling
3. **Environment** dropdown'da **Preview** ni tanlang
4. **Value** ni quyidagiga o'zgartiring:
   ```
   https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app
   ```
5. **Save** tugmasini bosing
6. **Google Console**'da preview URL'ni qo'shing (yuqorida ko'rsatilgan)
7. **Redeploy** qiling
8. Test qiling

---

## Checklist

- [ ] Vercel'da `NEXTAUTH_URL` Preview environment uchun preview URL'ga sozlandi
- [ ] Google Console'da preview URL qo'shildi
- [ ] Vercel redeploy qilindi
- [ ] Browser'da test qilindi
