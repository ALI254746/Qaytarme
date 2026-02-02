# Telegram Session Xatolikni Hal Qilish

## Muammo: AUTH_KEY_DUPLICATED

Agar quyidagi xatolikni ko'rsangiz:
```
RPCError: 406: AUTH_KEY_DUPLICATED
```

Bu shuni anglatadiki, bir xil session key bir necha joyda ishlatilmoqda.

## Yechimlar

### 1. Yangi Session Yaratish (Tavsiya etiladi)

#### QR Code orqali (Oson usul):
```bash
cd backend
node generate-session.js
```

Bu skript QR kod yaratadi. Telegram ilovangizda:
1. Settings → Devices → Link Desktop Device
2. QR kodni skanerlang
3. Terminalda ko'rsatilgan session string'ni nusxalang
4. `.env` faylida `TELEGRAM_SESSION` ni yangilang

#### Telefon raqam orqali:
```bash
cd backend
node session-gen.js
```

Bu skript telefon raqam va kod so'raydi.

### 2. Eski Session'ni Tozalash

Agar bir nechta backend instance ishlatayotgan bo'lsangiz:
1. Barcha backend instance'larni to'xtating
2. Yangi session yarating
3. Faqat bitta instance'da ishlating

### 3. Production'da

Production'da (Render, Railway va h.k.):
1. Local'da yangi session yarating
2. Session string'ni environment variable sifatida qo'shing
3. Faqat bitta production instance ishlatishni ta'minlang

## Qadamlar

1. **Yangi session yarating:**
   ```bash
   cd backend
   node generate-session.js
   ```

2. **Session string'ni nusxalang** (terminalda ko'rsatiladi)

3. **`.env` faylini yangilang:**
   ```env
   TELEGRAM_SESSION=yangi_session_string_bu_yerga
   ```

4. **Backend'ni qayta ishga tushiring:**
   ```bash
   npm run start:dev
   ```

## Eslatmalar

- ✅ Har bir backend instance uchun alohida session yarating
- ✅ Session string'ni xavfsiz saqlang
- ✅ `.env` faylini GitHub'ga yuklamang
- ✅ Production'da faqat bitta instance ishlatishni ta'minlang

## Xatoliklar

Agar xatolik davom etsa:
1. Barcha backend instance'larni to'xtating
2. 5-10 daqiqa kutib turing
3. Yangi session yarating
4. Qayta ishga tushiring
