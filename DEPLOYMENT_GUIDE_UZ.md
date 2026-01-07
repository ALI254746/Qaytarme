# 🚀 Loyihani Deploy Qilish bo'yicha Qo'llanma

Ushbu qo'llanma orqali siz **QaytarMe** loyihasini to'liq internetga joylaysiz.

---

## 1-qadam: GitHub-ga yuklash

Loyihangizni GitHub-ga yuklashingiz kerak (agar hali qilmagan bo'lsangiz).
1. [GitHub.com](https://github.com) da yangi **Repository** oching.
2. Loyiha papkasida terminalni ochib quyidagi buyruqlarni bering:

```bash
git init
git add .
git commit -m "Deployga tayyor versiya"
git branch -M main
git remote add origin <SIZNING_GITHUB_REPO_LINKINGIZ>
git push -u origin main
```

---

## 2-qadam: Backend-ni Deploy qilish (Render.com)

Backend doim ishlab turishi kerak, shuning uchun **Render** platformasidan foydalanamiz (bepul varianti bor).

1. [Render.com](https://render.com) ga kiring va ro'yxatdan o'ting (GitHub orqali kirsangiz osonroq).
2. **"New +"** tugmasini bosib, **"Web Service"** ni tanlang.
3. **"Build and deploy from a Git repository"** ni tanlang va GitHub dagi loyihangizni topib, **"Connect"** ni bosing.

**Sozlamalarni quyidagicha to'ldiring:**

*   **Name:** `musodara-backend` (yoki istalgan nom)
*   **Region:** Frankfurt (yoki o'zingizga yaqin joy)
*   **Branch:** `main`
*   **Root Directory:** `backend` (⚠️ Juda muhim! Chunki sizning backend kodingiz shu papkada)
*   **Runtime:** `Node`
*   **Build Command:** `npm install && npm run build`
*   **Start Command:** `npm run start:prod`

4. **Environment Variables** (Pastki qismida) bo'limiga o'ting va `backend/.env` faylingizdagi narsalarni qo'shing:

   *   `MONGO_URI`: (Sizning MongoDB Atlas havolangiz - `mongodb+srv://...`)
   *   `JWT_SECRET`: (Istalgan maxfiy so'z)
   *   `CLOUDINARY_CLOUD_NAME`: (...)
   *   `CLOUDINARY_API_KEY`: (...)
   *   `CLOUDINARY_API_SECRET`: (...)
   *   `PORT`: `10000` (Render avtomatik beradi, lekin yozib qo'ygan yaxshi)

5. **"Create Web Service"** tugmasini bosing.
   *   Render backendni qurishni boshlaydi. 
   *   Jarayon tugagach, tepadagi sarlavhada sizga **havola (URL)** beriladi (masalan: `https://musodara-backend.onrender.com`).
   *   Bu havolani nusxalab oling!

---

## 3-qadam: Frontend-ni Deploy qilish (Vercel)

Frontend Next.js bo'lgani uchun **Vercel** eng yaxshi tanlov.

1. [Vercel.com](https://vercel.com) ga kiring va ro'yxatdan o'ting (GitHub orqali).
2. **"Add New..."** -> **"Project"** ni bosing.
3. GitHub dagi loyihangizni tanlang va **"Import"** ni bosing.

**Sozlamalarni to'ldiring:**

*   **Framework Preset:** `Next.js` (avtomatik tanlanadi).
*   **Root Directory:** `./` (o'zgartirish shart emas, asosiy papka).
*   **Environment Variables:**
    Bu yerda juda muhim o'zgarish qilish kerak. `NEXT_PUBLIC_API_URL` endi `localhost` bo'lmaydi!

    *   `NEXT_PUBLIC_API_URL`: **`https://musodara-backend.onrender.com/api`** (2-qadamda olgan backend havolangiz oxiriga `/api` qo'shing).
    *   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: (Google Maps kalitingiz)
    *   `NEXTAUTH_URL`: (Vercel sizga `https://loyihangiz.vercel.app` degan domen beradi, o'shani yozasiz. Hozircha bo'sh qoldirsangiz, deploy bo'lgandan keyin o'zgartirib Redeploy qilsa bo'ladi, yoki `http://localhost:3000` deb turavering avtomatik to'g'irlaydi).
    *   `NEXTAUTH_SECRET`: (Istalgan maxfiy so'z).

4. **"Deploy"** tugmasini bosing.
5. Vercel loyihani quradi va sizga tayyor sayt linkini beradi (masalan: `https://musodara-frontend.vercel.app`).

---

## 4-qadam: So'nggi Sozlamalar

1. **MongoDB Atlas (Database):**
   *   MongoDB saytiga kiring.
   *   **Network Access** bo'limiga o'ting.
   *   IP Address qo'shish joyiga `0.0.0.0/0` (Allow Access from Anywhere) ni qo'shing. Bu Render serveri bazaga ulanishi uchun kerak.

2. **Google Cloud Console (Login & Maps):**
   *   Agar Google Login ishlatgan bo'lsangiz, Google Cloud Console ga kirib, OAuth sozlamalarida "Authorized redirect URIs" ga yangi Vercel domenini qo'shishingiz kerak:
     `https://sizning-sayt.vercel.app/api/auth/callback/google`

**Tabriklayman! Loyihangiz ishga tushdi!** 🎉
