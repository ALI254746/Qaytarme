# 502 Bad Gateway Xatolikni Hal Qilish

## Muammo

Google OAuth login paytida quyidagi xatolik:
```
Social Login Failed (Backend: 502): Application failed to respond.
```

## Sabablar

502 xatolik quyidagi sabablarga ko'ra yuzaga kelishi mumkin:

1. **Backend ishlamayapti** - Railway'da backend down bo'lishi mumkin
2. **Backend timeout** - Backend javob bermayapti (15 soniyadan ko'p)
3. **Network muammosi** - Frontend va backend o'rtasida ulanish muammosi
4. **CORS muammosi** - Backend CORS sozlamalari noto'g'ri
5. **Environment variable muammosi** - `NEXT_PUBLIC_API_URL` noto'g'ri yoki mavjud emas

## Tekshirish Qadamlari

### 1. Backend Status (Railway)

Railway Dashboard'da tekshiring:
- ✅ Backend **Online** bo'lishi kerak
- ✅ Logs'da xatoliklar bo'lmasligi kerak
- ✅ Domain: `qaytarme-production.up.railway.app`

### 2. Backend URL Tekshirish

Browser Console'da (F12):
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

Natija quyidagicha bo'lishi kerak:
```
https://qaytarme-production.up.railway.app/api
```

### 3. Network Tab'da Tekshirish

Browser DevTools → Network:
1. Google OAuth login'ni sinab ko'ring
2. `/api/auth/social-login` so'rovini toping
3. Status code'ni tekshiring:
   - **502** - Backend ishlamayapti
   - **404** - Endpoint topilmadi
   - **CORS error** - CORS muammosi
   - **Timeout** - Backend javob bermayapti

### 4. Backend Logs Tekshirish

Railway Dashboard → Logs:
- `/api/auth/social-login` endpoint'iga so'rov kelayotganini tekshiring
- Xatoliklar bor-yo'qligini ko'ring

## Yechimlar

### Yechim 1: Backend'ni Qayta Ishga Tushirish

Railway Dashboard'da:
1. Service → **Restart** tugmasini bosing
2. Yoki **Redeploy** qiling

### Yechim 2: Environment Variables Tekshirish

Vercel'da quyidagilar bo'lishi kerak:
```env
NEXT_PUBLIC_API_URL=https://qaytarme-production.up.railway.app/api
NEXTAUTH_URL=https://www.qaytarme.uz
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Yechim 3: CORS Sozlamalari

Backend'da (`backend/src/main.ts`) CORS to'g'ri sozlanganligini tekshiring:
- Frontend domain'lariga ruxsat berilgan
- `credentials: true` sozlangan

### Yechim 4: Backend Health Check

Backend'ga to'g'ridan-to'g'ri so'rov yuborib tekshiring:
```bash
curl https://qaytarme-production.up.railway.app/api
```

Yoki brauzerda:
```
https://qaytarme-production.up.railway.app/api
```

## Tekshirish Skripti

Browser Console'da quyidagi kodni ishga tushiring:

```javascript
// Backend health check
fetch('https://qaytarme-production.up.railway.app/api')
  .then(res => res.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend Error:', err));

// API URL tekshirish
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

// Social login endpoint test
fetch('https://qaytarme-production.up.railway.app/api/auth/social-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    name: 'Test User',
    avatar: null
  })
})
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
```

## Keyingi Qadamlar

1. ✅ Backend Railway'da Online ekanligini tasdiqlang
2. ✅ Vercel'da `NEXT_PUBLIC_API_URL` to'g'ri ekanligini tekshiring
3. ✅ Browser Console'da xatoliklarni ko'ring
4. ✅ Network Tab'da so'rovlarni tekshiring
5. ✅ Backend Logs'da xatoliklarni ko'ring

Agar muammo davom etsa, Railway Logs'ni yuboring.
