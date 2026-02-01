"use client";

export type Language = "uz" | "ru" | "en";

export interface Translations {
  [key: string]: {
    uz: string;
    ru: string;
    en: string;
  };
}

export const translations: Translations = {
  // Common
  "common.home": {
    uz: "Bosh sahifa",
    ru: "Главная",
    en: "Home",
  },
  "common.search": {
    uz: "Qidirish",
    ru: "Поиск",
    en: "Search",
  },
  "common.settings": {
    uz: "Sozlamalar",
    ru: "Настройки",
    en: "Settings",
  },
  "common.profile": {
    uz: "Profil",
    ru: "Профиль",
    en: "Profile",
  },
  "common.matches": {
    uz: "Mosliklar",
    ru: "Совпадения",
    en: "Matches",
  },
  "common.add": {
    uz: "Qo'shish",
    ru: "Добавить",
    en: "Add",
  },
  "common.close": {
    uz: "Yopish",
    ru: "Закрыть",
    en: "Close",
  },
  "common.save": {
    uz: "Saqlash",
    ru: "Сохранить",
    en: "Save",
  },
  "common.cancel": {
    uz: "Bekor qilish",
    ru: "Отмена",
    en: "Cancel",
  },
  "common.delete": {
    uz: "O'chirish",
    ru: "Удалить",
    en: "Delete",
  },
  "common.edit": {
    uz: "Tahrirlash",
    ru: "Редактировать",
    en: "Edit",
  },
  "common.share": {
    uz: "Ulashish",
    ru: "Поделиться",
    en: "Share",
  },
  "common.report": {
    uz: "Shikoyat qilish",
    ru: "Пожаловаться",
    en: "Report",
  },
  "common.favorite": {
    uz: "Sevimli",
    ru: "Избранное",
    en: "Favorite",
  },
  "common.loading": {
    uz: "Yuklanmoqda...",
    ru: "Загрузка...",
    en: "Loading...",
  },
  "common.error": {
    uz: "Xatolik yuz berdi",
    ru: "Произошла ошибка",
    en: "An error occurred",
  },
  "common.success": {
    uz: "Muvaffaqiyatli",
    ru: "Успешно",
    en: "Success",
  },
  "common.retry": {
    uz: "Qayta urinish",
    ru: "Повторить",
    en: "Retry",
  },

  // Home Page
  "home.greeting": {
    uz: "Salom",
    ru: "Привет",
    en: "Hi",
  },
  "home.searchPlaceholder": {
    uz: "Narsalarni qidirish...",
    ru: "Поиск предметов...",
    en: "Search items...",
  },
  "home.iLostIt": {
    uz: "Men yo'qotdim",
    ru: "Я потерял",
    en: "I Lost It",
  },
  "home.iFoundIt": {
    uz: "Men topdim",
    ru: "Я нашел",
    en: "I Found It",
  },
  "home.recent": {
    uz: "So'nggi",
    ru: "Недавние",
    en: "Recent",
  },
  "home.sortedBy": {
    uz: "Saralangan",
    ru: "Отсортировано",
    en: "Sorted by",
  },
  "home.newest": {
    uz: "Yangi",
    ru: "Новые",
    en: "Newest",
  },
  "home.closest": {
    uz: "Yaqin",
    ru: "Близкие",
    en: "Closest",
  },
  "home.noItems": {
    uz: "Hech narsa topilmadi",
    ru: "Ничего не найдено",
    en: "No items found",
  },

  // Profile Page
  "profile.found": {
    uz: "Topilgan",
    ru: "Найдено",
    en: "Found",
  },
  "profile.returned": {
    uz: "Qaytarilgan",
    ru: "Возвращено",
    en: "Returned",
  },
  "profile.karma": {
    uz: "Karma",
    ru: "Карма",
    en: "Karma",
  },
  "profile.activePosts": {
    uz: "Faol postlar",
    ru: "Активные посты",
    en: "Active Posts",
  },
  "profile.history": {
    uz: "Tarix",
    ru: "История",
    en: "History",
  },
  "profile.newAlert": {
    uz: "Yangi e'lon",
    ru: "Новое объявление",
    en: "New Alert",
  },
  "profile.memberSince": {
    uz: "A'zo bo'lgan sana",
    ru: "Участник с",
    en: "Member since",
  },

  // Settings Page
  "settings.language": {
    uz: "Til",
    ru: "Язык",
    en: "Language",
  },
  "settings.darkMode": {
    uz: "Qorong'i rejim",
    ru: "Темный режим",
    en: "Dark Mode",
  },
  "settings.notifications": {
    uz: "Bildirishnomalar",
    ru: "Уведомления",
    en: "Notifications",
  },
  "settings.sound": {
    uz: "Ovoz",
    ru: "Звук",
    en: "Sound",
  },
  "settings.location": {
    uz: "Joylashuv",
    ru: "Местоположение",
    en: "Location",
  },
  "settings.showLocation": {
    uz: "Joylashuvni ko'rsatish",
    ru: "Показывать местоположение",
    en: "Show Location",
  },

  // Matches Page
  "matches.allMatches": {
    uz: "Barcha mosliklar",
    ru: "Все совпадения",
    en: "All Matches",
  },
  "matches.highMatch": {
    uz: "Yuqori moslik",
    ru: "Высокое совпадение",
    en: "High Match",
  },
  "matches.medium": {
    uz: "O'rtacha",
    ru: "Среднее",
    en: "Medium",
  },
  "matches.contact": {
    uz: "Aloqa",
    ru: "Связаться",
    en: "Contact",
  },
  "matches.moreDetails": {
    uz: "Batafsil",
    ru: "Подробнее",
    en: "More Details",
  },
  "matches.lessDetails": {
    uz: "Kamroq",
    ru: "Меньше",
    en: "Less Details",
  },
  "matches.noMatches": {
    uz: "Mosliklar topilmadi",
    ru: "Совпадения не найдены",
    en: "No matches found",
  },

  // Add Page
  "add.lost": {
    uz: "Yo'qotdim",
    ru: "Потерял",
    en: "Lost",
  },
  "add.found": {
    uz: "Topdim",
    ru: "Нашел",
    en: "Found",
  },
  "add.title": {
    uz: "Sarlavha",
    ru: "Заголовок",
    en: "Title",
  },
  "add.description": {
    uz: "Tavsif",
    ru: "Описание",
    en: "Description",
  },
  "add.location": {
    uz: "Joylashuv",
    ru: "Местоположение",
    en: "Location",
  },
  "add.date": {
    uz: "Sana",
    ru: "Дата",
    en: "Date",
  },
  "add.time": {
    uz: "Vaqt",
    ru: "Время",
    en: "Time",
  },
  "add.submit": {
    uz: "Yuborish",
    ru: "Отправить",
    en: "Submit",
  },
  "add.selectImage": {
    uz: "Rasm tanlash",
    ru: "Выбрать изображение",
    en: "Select Image",
  },

  // Item Detail
  "detail.description": {
    uz: "Tavsif",
    ru: "Описание",
    en: "Description",
  },
  "detail.location": {
    uz: "Joylashuv",
    ru: "Местоположение",
    en: "Location",
  },
  "detail.date": {
    uz: "Sana",
    ru: "Дата",
    en: "Date",
  },
  "detail.tags": {
    uz: "Teglar",
    ru: "Теги",
    en: "Tags",
  },
  "detail.contact": {
    uz: "Aloqa",
    ru: "Контакты",
    en: "Contact",
  },
  "detail.contactViaTelegram": {
    uz: "Telegram orqali aloqa",
    ru: "Связаться через Telegram",
    en: "Contact via Telegram",
  },

  // Search Page
  "search.allCategories": {
    uz: "Barcha kategoriyalar",
    ru: "Все категории",
    en: "All Categories",
  },
  "search.electronics": {
    uz: "Elektronika",
    ru: "Электроника",
    en: "Electronics",
  },
  "search.pets": {
    uz: "Hayvonlar",
    ru: "Животные",
    en: "Pets",
  },
  "search.keys": {
    uz: "Kalitlar",
    ru: "Ключи",
    en: "Keys",
  },
  "search.walletBags": {
    uz: "Hamyon va sumkalar",
    ru: "Кошельки и сумки",
    en: "Wallet & Bags",
  },
  "search.documents": {
    uz: "Hujjatlar",
    ru: "Документы",
    en: "Documents",
  },
  "search.loadingMap": {
    uz: "Xarita yuklanmoqda...",
    ru: "Загрузка карты...",
    en: "Loading Map...",
  },
  "search.street": {
    uz: "Ko'cha",
    ru: "Улица",
    en: "Street",
  },
  "search.satellite": {
    uz: "Sun'iy yo'ldosh",
    ru: "Спутник",
    en: "Satellite",
  },

  // Matches Page
  "matches.highMatchLabel": {
    uz: "Yuqori moslik",
    ru: "Высокое совпадение",
    en: "High Match",
  },
  "matches.mediumMatch": {
    uz: "O'rtacha moslik",
    ru: "Среднее совпадение",
    en: "Medium Match",
  },
  "matches.lowMatch": {
    uz: "Past moslik",
    ru: "Низкое совпадение",
    en: "Low Match",
  },
  "matches.found": {
    uz: "topildi",
    ru: "найдено",
    en: "found",
  },
  "matches.matchesYour": {
    uz: "Sizning",
    ru: "Соответствует вашему",
    en: "Matches your",
  },

  // Add Page
  "add.pleaseFillAll": {
    uz: "Iltimos, barcha maydonlarni to'ldiring",
    ru: "Пожалуйста, заполните все поля",
    en: "Please fill in all required fields",
  },
  "add.titleRequired": {
    uz: "Sarlavha majburiy",
    ru: "Заголовок обязателен",
    en: "Title is required",
  },
  "add.uploadPhoto": {
    uz: "Iltimos, rasm yuklang",
    ru: "Пожалуйста, загрузите фото",
    en: "Please upload a photo",
  },
  "add.selectLocation": {
    uz: "Iltimos, joylashuvni tanlang",
    ru: "Пожалуйста, выберите местоположение",
    en: "Please select a location",
  },
  "add.dateRequired": {
    uz: "Sana majburiy",
    ru: "Дата обязательна",
    en: "Date is required",
  },
  "add.postCreated": {
    uz: "Post muvaffaqiyatli yaratildi!",
    ru: "Пост успешно создан!",
    en: "Post created successfully!",
  },
  "add.pets": {
    uz: "Hayvonlar",
    ru: "Животные",
    en: "Pets",
  },
  "add.tech": {
    uz: "Texnika",
    ru: "Техника",
    en: "Tech",
  },
  "add.keys": {
    uz: "Kalitlar",
    ru: "Ключи",
    en: "Keys",
  },
  "add.wallet": {
    uz: "Hamyon",
    ru: "Кошелек",
    en: "Wallet",
  },
  "add.docs": {
    uz: "Hujjatlar",
    ru: "Документы",
    en: "Docs",
  },
  "add.other": {
    uz: "Boshqa",
    ru: "Другое",
    en: "Other",
  },

  // Home Page
  "home.viewAll": {
    uz: "Barchasini ko'rish",
    ru: "Посмотреть все",
    en: "View All",
  },
  "home.createFirstPost": {
    uz: "Birinchi post yaratish",
    ru: "Создать первый пост",
    en: "Create First Post",
  },
  "home.noItemsInCategory": {
    uz: "Bu kategoriyada hali hech narsa yo'q",
    ru: "В этой категории пока ничего нет",
    en: "No items in this category yet",
  },

  // Profile Page
  "profile.memberSince": {
    uz: "A'zo bo'lgan sana",
    ru: "Участник с",
    en: "Member since",
  },

  // Additional
  "add.category": {
    uz: "Kategoriya",
    ru: "Категория",
    en: "Category",
  },
  "add.createAlert": {
    uz: "E'lon yaratish",
    ru: "Создать объявление",
    en: "Create alert",
  },
  "add.publishing": {
    uz: "Nashr qilinmoqda...",
    ru: "Публикация...",
    en: "Publishing...",
  },
  "add.whatHappened": {
    uz: "Nima bo'ldi?",
    ru: "Что случилось?",
    en: "What happened?",
  },
  "add.startReport": {
    uz: "Hisobotni boshlash",
    ru: "Начать отчет",
    en: "Start a report",
  },
};

export function getTranslation(key: string, language: Language): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translation[language] || translation.uz;
}
