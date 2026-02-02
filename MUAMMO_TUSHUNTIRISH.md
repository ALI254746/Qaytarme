# 📋 Muammo Tushuntirish

## Sizning Holatingiz

✅ **Backend**: Railway.app'da ishlayapti (AWS'dan ko'chirilgan)
✅ **Frontend**: Vercel'da ishlayapti
❌ **Muammo**: Google Login ishlamayapti

---

## Muammo Nima?

Google Login muammosi **backend bilan bog'liq emas**. Bu **frontend (Vercel)** va **Google Console** sozlamalari bilan bog'liq.

### Nima Bo'lyapti?

1. **Frontend (Vercel)** → Google'ga login so'rovi yuboradi
2. **Google** → Foydalanuvchini autentifikatsiya qiladi
3. **Google** → Frontend'ga qaytadi (callback URL orqali)
4. **Muammo**: Google qaytayotgan URL Google Console'da ro'yxatdan o'tmagan ❌

---

## Qayerda Muammo?

### 1. Vercel Environment Variables

**Vercel Dashboard** → **Settings** → **Environment Variables**:

- `NEXTAUTH_URL` = `https://www.qaytarme.uz` ✅ (production uchun to'g'ri)
- Lekin siz preview URL'dan login qilmoqchisiz: `https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app` ❌

### 2. Google Console

**Google Cloud Console** → **Credentials** → **OAuth 2.0 Client ID**:

- **Authorized redirect URIs** ro'yxatida preview URL yo'q ❌
- Faqat production URL bor: `https://www.qaytarme.uz/api/auth/callback/google` ✅

---

## Yechim

### Variant 1: Production Domain'dan Foydalanish (Eng Oson)

Agar `www.qaytarme.uz` ishlayotgan bo'lsa:

1. Browser'da `https://www.qaytarme.uz` ga kiring
2. U yerdan Google Login qiling
3. ✅ Ishlasligi kerak

**Sabab**: `NEXTAUTH_URL` va Google Console'da allaqachon `www.qaytarme.uz` sozlangan.

---

### Variant 2: Preview URL uchun Sozlash

Agar preview URL'dan login qilmoqchi bo'lsangiz:

#### Qadam 1: Vercel'da Preview Environment Variable

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. `NEXTAUTH_URL` ni **Edit** qiling
3. **Environment** dropdown'da **Preview** ni tanlang
4. **Value** ni quyidagiga o'zgartiring:
   ```
   https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app
   ```
5. **Save** tugmasini bosing

⚠️ **MUHIM**: **Production** uchun `https://www.qaytarme.uz` ni saqlab qo'ying!

#### Qadam 2: Google Console'da Preview URL Qo'shish

1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. **APIs & Services** → **Credentials**
3. OAuth 2.0 Client ID ni tanlang va **Edit** tugmasini bosing
4. **Authorized redirect URIs** ga quyidagini qo'shing:
   ```
   https://qaytarme-csrp-git-main-ali254746s-projects.vercel.app/api/auth/callback/google
   ```
5. **Save** tugmasini bosing

#### Qadam 3: Redeploy

1. **Vercel Dashboard** → **Deployments**
2. Eng so'nggi deployment'ning **...** tugmasini bosing
3. **Redeploy** ni tanlang

---

## Qisqacha

**Backend (Railway)** ✅ - Muammo yo'q
**Frontend (Vercel)** ❌ - `NEXTAUTH_URL` preview uchun sozlanmagan
**Google Console** ❌ - Preview URL ro'yxatdan o'tmagan

**Yechim**: 
- Yoki production domain'dan foydalaning (`www.qaytarme.uz`)
- Yoki preview URL uchun sozlang (yuqorida ko'rsatilgan)

---

## Tekshirish

1. **Backend ishlayaptimi?**
   - Browser'da: `https://YOUR-RAILWAY-URL/api/health`
   - Agar javob qaytsa ✅

2. **Frontend ishlayaptimi?**
   - Browser'da: `https://www.qaytarme.uz` yoki preview URL
   - Agar sayt ochilsa ✅

3. **Google Login ishlayaptimi?**
   - Browser'da Google Login tugmasini bosing
   - Agar xatolik bo'lmasa ✅

---

## Qaysi Variantni Tanlash Kerak?

- **Production domain ishlayaptimi?** (`www.qaytarme.uz`)
  - ✅ Ha → **Variant 1** (production'dan foydalanish)
  - ❌ Yo'q → **Variant 2** (preview URL uchun sozlash)
