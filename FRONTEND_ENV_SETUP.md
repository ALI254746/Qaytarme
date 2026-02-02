# Frontend Environment Variables Setup

## Muammo: 502 Bad Gateway

Agar Google OAuth login paytida quyidagi xatolikni ko'rsangiz:
```
Social Login Failed (Backend: 502): Application failed to respond. Check NEXT_PUBLIC_API_URL.
```

Bu shuni anglatadiki, frontend backend'ga ulanmayapti.

## Yechim: Vercel Environment Variables

Vercel'da quyidagi environment variable'larni sozlashingiz kerak:

### 1. Vercel Dashboard'ga kiring
1. [Vercel Dashboard](https://vercel.com/dashboard) ga kiring
2. Loyihangizni tanlang (`qaytarme` yoki frontend loyiha nomi)
3. **Settings** → **Environment Variables** ga o'ting

### 2. Quyidagi o'zgaruvchilarni qo'shing:

```env
# Backend API URL (Railway)
NEXT_PUBLIC_API_URL=https://qaytarme-production.up.railway.app/api

# NextAuth Configuration
NEXTAUTH_URL=https://www.qaytarme.uz
NEXTAUTH_SECRET=your-super-secret-key-here-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps (agar ishlatilsa)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Muhim Eslatmalar:

#### NEXT_PUBLIC_API_URL Format:
- ✅ **To'g'ri:** `https://qaytarme-production.up.railway.app/api`
- ❌ **Noto'g'ri:** `https://qaytarme-production.up.railway.app` (oxirida `/api` yo'q)
- ❌ **Noto'g'ri:** `https://qaytarme-production.up.railway.app:4000/api` (port kerak emas)

#### NEXTAUTH_URL:
- Production uchun: `https://www.qaytarme.uz`
- Yoki: `https://qaytarme.uz`
- **Eslatma:** Bu frontend domain'ingiz bo'lishi kerak

### 4. Environment Variables'ni qo'shgandan keyin:

1. **Redeploy qiling:**
   - Vercel Dashboard'da **Deployments** ga o'ting
   - Eng so'nggi deployment'ni toping
   - **⋯** (three dots) → **Redeploy** ni bosing

2. **Yoki yangi commit push qiling:**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

## Tekshirish

Deploy tugagach, quyidagilarni tekshiring:

1. **Browser Console'da:**
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
   ```

2. **Network tab'da:**
   - Google OAuth login paytida
   - `/api/auth/social-login` so'rovini tekshiring
   - Request URL to'g'ri bo'lishi kerak: `https://qaytarme-production.up.railway.app/api/auth/social-login`

3. **Backend Logs'da (Railway):**
   - `/api/auth/social-login` endpoint'iga so'rov kelayotganini tekshiring

## Qo'shimcha Tekshirishlar

### Backend CORS Sozlamalari
Backend'da CORS to'g'ri sozlanganligini tekshiring:
- `backend/src/main.ts` faylida frontend domain'lariga ruxsat berilgan

### Railway Backend Status
Railway'da backend ishlayotganini tekshiring:
- Status: **Online** ✅
- Domain: `qaytarme-production.up.railway.app`
- Port: `4000`

## Xatoliklar

Agar xatolik davom etsa:

1. **Browser Cache'ni tozalang:**
   - Ctrl+Shift+Delete
   - Cache va cookies'ni tozalang

2. **Hard Refresh:**
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

3. **Backend Logs'ni tekshiring:**
   - Railway Dashboard → Logs
   - Xatoliklar bor-yo'qligini tekshiring

4. **Network Tab'da tekshiring:**
   - Browser DevTools → Network
   - Failed request'larni ko'ring
   - Response'ni tekshiring
