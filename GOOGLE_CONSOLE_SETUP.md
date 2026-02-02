# 🔐 Google Console OAuth Sozlash Qo'llanmasi

## Google OAuth 2.0 Client ID Sozlash

Google Login ishlashi uchun Google Cloud Console'da to'g'ri sozlamalar kerak.

---

## 1️⃣ Google Cloud Console'ga Kirish

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. Loyihangizni tanlang yoki yangi loyiha yarating

---

## 2️⃣ OAuth Consent Screen Sozlash

1. **APIs & Services** → **OAuth consent screen**
2. **User Type** ni tanlang:
   - **External** (umumiy foydalanuvchilar uchun)
   - **Internal** (faqat tashkilot ichida)
3. **App information** to'ldiring:
   - **App name**: `QaytarMe` (yoki istalgan nom)
   - **User support email**: Sizning emailingiz
   - **Developer contact information**: Sizning emailingiz
4. **Scopes** → **Add or Remove Scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. **Test users** (agar External tanlagan bo'lsangiz):
   - Test rejimida faqat test foydalanuvchilar kirishi mumkin
   - Production'ga o'tish uchun verification kerak
6. **Save and Continue** tugmasini bosing

---

## 3️⃣ OAuth 2.0 Client ID Yaratish

1. **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: **Web application**
4. **Name**: `QaytarMe Web Client` (yoki istalgan nom)

### ⚠️ MUHIM: Authorized JavaScript origins

Quyidagi URL'larni qo'shing:

```
https://www.qaytarme.uz
https://qaytarme.uz
https://qaytarme.vercel.app
http://localhost:3000
```

**Format:**
- `https://` yoki `http://` bilan boshlanishi kerak
- Oxirida `/` bo'lmasligi kerak
- Port raqami bo'lsa, ko'rsatilishi kerak (`localhost:3000`)

### ⚠️ MUHIM: Authorized redirect URIs

Quyidagi URL'larni qo'shing:

```
https://www.qaytarme.uz/api/auth/callback/google
https://qaytarme.uz/api/auth/callback/google
https://qaytarme.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**Format:**
- `https://` yoki `http://` bilan boshlanishi kerak
- Oxirida `/api/auth/callback/google` bo'lishi kerak
- NextAuth.js avtomatik shu URL'ni ishlatadi

5. **CREATE** tugmasini bosing

---

## 4️⃣ Client ID va Secret ni Olish

1. Yaratilgan OAuth client'ni oching
2. **Client ID** ni nusxalang
3. **Client Secret** ni nusxalang (yoki **Show** tugmasini bosing)

⚠️ **Eslatma**: Client Secret faqat bir marta ko'rsatiladi! Uni saqlab qo'ying!

---

## 5️⃣ Environment Variables'ga Qo'shish

### Vercel'da:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Quyidagilarni qo'shing:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=https://www.qaytarme.uz
NEXTAUTH_SECRET=your-random-secret-key-here
```

### Local Development (.env.local):

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
```

---

## 6️⃣ Tekshirish

### Browser Console'da:

1. Saytga kiring: `https://www.qaytarme.uz`
2. F12 → Console
3. Quyidagilarni yozing:

```javascript
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
```

⚠️ **Eslatma**: `NEXT_PUBLIC_` bilan boshlanadigan o'zgaruvchilar browser'da ko'rinadi. `GOOGLE_CLIENT_ID` server-side'da ishlatiladi, shuning uchun browser'da ko'rinmaydi.

### Google Login Test:

1. Saytga kiring
2. **Google orqali kirish** tugmasini bosing
3. Google login sahifasi ochilishi kerak
4. Hisobni tanlang
5. Muvaffaqiyatli kirish bo'lishi kerak

---

## ❌ Keng Tarqalgan Xatoliklar

### 1. "Error 400: redirect_uri_mismatch"

**Sabab**: Redirect URI Google Console'da ro'yxatdan o'tmagan.

**Yechim**:
- Google Console → Credentials → OAuth client → Edit
- **Authorized redirect URIs** ga to'g'ri URL qo'shing:
  ```
  https://www.qaytarme.uz/api/auth/callback/google
  ```

### 2. "Error 401: invalid_client"

**Sabab**: Client ID yoki Secret noto'g'ri.

**Yechim**:
- Vercel'da `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` ni tekshiring
- Google Console'dan yangi Client ID yarating (agar kerak bo'lsa)
- Redeploy qiling

### 3. "Error 403: access_denied"

**Sabab**: OAuth Consent Screen'da test rejimida va foydalanuvchi test ro'yxatida yo'q.

**Yechim**:
- Google Console → OAuth consent screen → Test users
- Foydalanuvchi email'ini qo'shing
- Yoki Production'ga o'ting (verification kerak)

### 4. "Error: This app isn't verified"

**Sabab**: OAuth Consent Screen verification qilinmagan.

**Yechim**:
- Test rejimida ishlatish uchun: Test users ro'yxatiga qo'shing
- Production uchun: Verification jarayonini boshlang (qiyin va uzoq)

---

## 🔍 Debug Qilish

### 1. Browser Network Tab:

1. F12 → Network
2. Google Login qiling
3. `/api/auth/signin/google` so'rovini toping
4. **Request URL** ni tekshiring:
   - To'g'ri: `https://accounts.google.com/o/oauth2/v2/auth?...`
   - `redirect_uri` parametrini tekshiring

### 2. Server Logs:

Vercel Dashboard → Deployments → View Function Logs:

```
Sending social-login request to: https://...
NEXT_PUBLIC_API_URL: https://...
```

### 3. Google Console Logs:

Google Cloud Console → APIs & Services → OAuth consent screen → **View logs**

---

## ✅ Checklist

- [ ] Google Cloud Console'da loyiha yaratildi
- [ ] OAuth consent screen sozlandi
- [ ] OAuth 2.0 Client ID yaratildi
- [ ] Authorized JavaScript origins qo'shildi (4 ta URL)
- [ ] Authorized redirect URIs qo'shildi (4 ta URL)
- [ ] Client ID va Secret nusxalandi
- [ ] Vercel'da environment variables qo'shildi
- [ ] Vercel redeploy qilindi
- [ ] Google Login test qilindi

---

## 📞 Yordam

Agar muammo hal bo'lmasa:

1. Browser Console xatoliklari (screenshot)
2. Network Tab'dan `/api/auth/signin/google` so'rovi (screenshot)
3. Google Console'dan OAuth client sozlamalari (screenshot)
4. Vercel environment variables (Client ID va Secret'ni yashirib)

---

## 🔗 Foydali Havolalar

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
