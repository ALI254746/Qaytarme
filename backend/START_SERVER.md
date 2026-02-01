# Backend Servisni Ishga Tushirish

## Terminalda ishga tushirish

### 1. Backend papkasiga o'ting:
```bash
cd backend
```

### 2. Development mode'da ishga tushiring:
```bash
npm run start:dev
```

### 3. Yoki Production mode'da:
```bash
npm run build
npm run start:prod
```

## Servisni tekshirish

Servis ishga tushgandan keyin, boshqa terminal oynasida:

```bash
cd backend
node check-service.js
```

Yoki brauzerda oching:
```
http://localhost:4000/api/ariza?limit=5
```

## Xatoliklar

Agar xatolik bo'lsa:
1. `.env` fayl mavjudligini tekshiring
2. `MONGODB_URI` o'zgaruvchisi to'g'ri ekanligini tekshiring
3. `node_modules` o'rnatilganligini tekshiring: `npm install`
