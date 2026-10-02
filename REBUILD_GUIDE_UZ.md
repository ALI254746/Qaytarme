# QaytarMe — yangilangan loyiha

## Ishga tushirish

Asosiy papkada: `npm run dev` — http://localhost:3001/desktop
Backend papkasida: `npm run start:dev` — http://localhost:4002/api
Xabarlar uchun realtime xizmatini ham ishga tushiring.
Frontend webpack bilan ishlaydi; eski Turbopack keshi zaxira papkada saqlangan.

## Ishlaydigan asosiy oqim

Ochiq e’lonlar → qidiruv va filtr → tafsilot / asl Telegram posti → moslik → aloqa → ikki tomon tasdig‘i.
Xaritada faqat mavjud va O‘zbekiston chegaralariga mos koordinatali e’lonlar ko‘rsatiladi. Joyi aniqlanmagan e’lonlarga tasodifiy nuqta qo‘yilmaydi.

Admin bo‘limida haqiqiy e’lonlar, moderatsiya, shikoyatlar, foydalanuvchilar, kategoriyalar, Telegram manbalari, audit va umumiy sozlamalar mavjud. Admin hisob bilan kirish talab qilinadi. Kategoriyalar ro‘yxati va foydalanuvchilar profili ko‘rish uchun; dinamik kategoriya tahriri va hisob bloklash qo‘shilmagan.
Moderatsiya qarori izoh talab qiladi. Tasdiqlash moslik qidiruvini ishga tushiradi. Hujjat, karta va raqam tasvirlari ochiq sahifada moderator ruxsatigacha yashiriladi. Manba posti havolasi saqlanadi. Audit yozuvlarini interfeysdan o‘chirish yo‘q.
Bildirishnoma sozlamalari hisobda saqlanadi. Saqlangan e’lonlar shu brauzerda saqlanadi.

## Telegram ulash

Backend muhit sozlamalarida `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION` kerak. Kalitlar va sessiyani chatga yubormang.
Admin → Telegram manbalari orqali kanal username qo‘shing. Yig‘uvchi ulangan faol kanallardagi yangi postlarni kuzatadi; sinov importi oxirgi 30 postni tekshiradi. Bir albom bir e’lon sifatida olinadi, alohida postlar bir-biriga aralashtirilmaydi. Takroriy import bir xil e’lonni qayta yaratmaydi.
O‘zbekistondagi barcha kanallar avtomatik kashf qilinmaydi: kuzatiladigan kanallar ro‘yxati kiritilishi kerak.
Telegram API ma’lumotlari mavjud bo‘lmasa, interfeys yig‘uvchi ulanmaganini ko‘rsatadi.
`GEMINI_API_KEY` — ixtiyoriy AI ajratish; `GOOGLE_MAPS_API_KEY` — geokodlash; Google Vision — rasm mosligi. Kalitlar bo‘lmasa tegishli imkoniyatlar cheklangan.

## Tekshiruv

Frontend ishlab chiqarish yig‘ilishi alohida `.next-check` papkasida tekshiriladi (`QAYTARME_BUILD_DIR=.next-check`), ishlayotgan rivojlantirish keshini buzmaydi.
Backend yig‘ilishi va 7 to‘plamdagi 43 sinov tekshirildi: moderatsiya huquqlari, qarorlar, moslik hisoblash, post/albom chegaralari, maxfiylik va takrorlarni aniqlash.
Admin sahifalarini brauzerda tekshirish uchun haqiqiy admin hisob kerak; tekshiruv uchun kirish himoyasi chetlab o‘tilmagan.
