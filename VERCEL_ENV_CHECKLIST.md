# Vercel Environment Variables Checklist

## ✅ Hozirgi Holat

Sizda quyidagi o'zgaruvchi mavjud:
- ✅ `NEXT_PUBLIC_API_URL` = `https://qaytarme-production.up.railway.app/api`

## ❌ Qo'shish Kerak Bo'lgan O'zgaruvchilar

Vercel Dashboard → Settings → Environment Variables → **"Add Environment Variable"** tugmasini bosing va quyidagilarni qo'shing:

### 1. NextAuth Configuration

```env
NEXTAUTH_URL=https://www.qaytarme.uz
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
```

**Eslatma:** `NEXTAUTH_SECRET` kamida 32 belgi bo'lishi kerak. Random string yarating:
```bash
openssl rand -base64 32
```

### 2. Google OAuth

```env
GOOGLE_CLIENT_ID=your-google-client-id-from-google-cloud-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-google-cloud-console
```

**Qayerdan olish:**
- Google Cloud Console → APIs & Services → Credentials
- OAuth 2.0 Client ID'ni tanlang
- Client ID va Client Secret'ni nusxalang

### 3. Google Maps (Agar ishlatilsa)

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 📋 To'liq Ro'yxat

Vercel'da quyidagi barcha o'zgaruvchilar bo'lishi kerak:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://qaytarme-production.up.railway.app/api` | All |
| `NEXTAUTH_URL` | `https://www.qaytarme.uz` | Production |
| `NEXTAUTH_SECRET` | `your-secret-key-32-chars-min` | All |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` | All |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | All |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `your-maps-key` | All (optional) |

## 🔧 Qo'shish Qadamlari

1. **Vercel Dashboard'da:**
   - Settings → Environment Variables
   - "Add Environment Variable" tugmasini bosing

2. **Har bir o'zgaruvchi uchun:**
   - Name: `NEXTAUTH_URL` (masalan)
   - Value: `https://www.qaytarme.uz`
   - Environment: "Production" yoki "All Environments"
   - "Save" tugmasini bosing

3. **Barcha o'zgaruvchilarni qo'shgandan keyin:**
   - Deployments → Eng so'nggi deployment
   - "Redeploy" tugmasini bosing

## ⚠️ Muhim Eslatmalar

- **NEXTAUTH_URL** production uchun frontend domain'ingiz bo'lishi kerak
- **NEXTAUTH_SECRET** xavfsiz va uzun bo'lishi kerak (min 32 belgi)
- **GOOGLE_CLIENT_ID** va **GOOGLE_CLIENT_SECRET** Google Cloud Console'dan olinadi
- Barcha o'zgaruvchilar "All Environments" uchun qo'shilishi tavsiya etiladi

## ✅ Tekshirish

Barcha o'zgaruvchilarni qo'shgandan keyin:

1. **Redeploy qiling**
2. **Browser Console'da tekshiring:**
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
   console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
   ```
3. **Google OAuth login'ni sinab ko'ring**
