# 🔧 Google Console Redirect URI Muammosini Hal Qilish

## Muammo

Vercel preview deployment URL'idan login qilishda xatolik:
```
Error 400: redirect_uri_mismatch
redirect_uri=https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
```

## Yechim 1: Preview URL Pattern Qo'shish (Tezkor)

Vercel har bir branch uchun yangi preview URL yaratadi. Barcha preview URL'larni qo'llab-quvvatlash uchun:

### Qadam 1: Google Cloud Console'ga Kirish

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. Loyihangizni tanlang
3. **APIs & Services** → **Credentials**
4. OAuth 2.0 Client ID ni tanlang va **Edit** tugmasini bosing

### Qadam 2: Authorized redirect URIs ga Qo'shish

**Authorized redirect URIs** bo'limiga quyidagi URL'larni qo'shing:

```
https://www.qaytarme.uz/api/auth/callback/google
https://qaytarme.uz/api/auth/callback/google
https://qaytarme.vercel.app/api/auth/callback/google
https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

⚠️ **MUHIM**: Har bir URL alohida qator bo'lishi kerak!

### Qadam 3: Wildcard Pattern (Ixtiyoriy)

Agar barcha Vercel preview URL'larini qo'llab-quvvatlamoqchi bo'lsangiz, har bir yangi preview URL uchun qo'shish kerak bo'ladi. Bu noqulay, shuning uchun **Yechim 2** ni tavsiya qilamiz.

---

## Yechim 2: Production Domain'dan Foydalanish (Tavsiya Etiladi)

Eng yaxshi yechim - production domain'dan foydalanish:

### Qadam 1: Vercel'da Custom Domain Sozlash

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. **Add Domain** tugmasini bosing
3. `www.qaytarme.uz` yoki `qaytarme.uz` ni kiriting
4. DNS sozlamalarini qiling (Vercel ko'rsatadi)

### Qadam 2: Google Console'ga Production URL Qo'shish

1. Google Cloud Console → Credentials → OAuth 2.0 Client ID → Edit
2. **Authorized redirect URIs** ga qo'shing:

```
https://www.qaytarme.uz/api/auth/callback/google
https://qaytarme.uz/api/auth/callback/google
```

### Qadam 3: Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

```env
NEXTAUTH_URL=https://www.qaytarme.uz
```

⚠️ **MUHIM**: Preview deployment'larda ham bu ishlashi uchun, Vercel'da environment variable'ni **Production, Preview, Development** uchun sozlang.

---

## Yechim 3: Vercel Preview URL'larni Bloklash

Agar preview URL'lardan login qilishni xohlamasangiz:

### NextAuth.js'da Production Check Qo'shish

`lib/authOptions.js` faylida:

```javascript
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Faqat production'da ishlashini ta'minlash
      ...(process.env.NODE_ENV === 'production' && {
        authorization: {
          params: {
            // Production URL'ni majburiy qilish
          }
        }
      })
    }),
    // ...
  ],
  // ...
}
```

---

## Tezkor Yechim (Hozirgi Muammo Uchun)

**Hozirgi muammoni hal qilish uchun:**

1. Google Cloud Console → Credentials → OAuth 2.0 Client ID → Edit
2. **Authorized redirect URIs** ga quyidagini qo'shing:

```
https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
```

3. **Save** tugmasini bosing
4. 2-3 daqiqa kutib turing
5. Qayta login qiling

⚠️ **Eslatma**: Har safar yangi preview URL yaratilganda, uni Google Console'ga qo'shish kerak bo'ladi. Shuning uchun **Yechim 2** (production domain) ni tavsiya qilamiz.

---

## Checklist

- [ ] Google Cloud Console'ga kirdim
- [ ] OAuth 2.0 Client ID ni topdim va Edit qildim
- [ ] Authorized redirect URIs ga preview URL qo'shdim
- [ ] Save tugmasini bosdim
- [ ] 2-3 daqiqa kutdim
- [ ] Qayta login qildim va test qildim

---

## Qo'shimcha Ma'lumot

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
