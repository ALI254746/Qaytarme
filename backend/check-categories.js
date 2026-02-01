/**
 * MongoDB Category Check Script
 * 
 * Bu skript bazadagi barcha arizalarni tekshiradi va:
 * 1. Category field'larini ko'rsatadi
 * 2. Noto'g'ri kategoriyalarni aniqlaydi
 * 3. Category statistikasini ko'rsatadi
 * 4. Noto'g'ri kategoriyalarni normalize qilish imkoniyatini beradi
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const VALID_CATEGORIES = [
  'tech', 'pets', 'keys', 'wallet', 'docs', 'clothing', 
  'jewelry', 'vehicle', 'home', 'sports', 'toys', 'books', 'tools', 'food'
];

// Category mapping
const CATEGORY_MAP = {
  'phone': 'tech',
  'smartphone': 'tech',
  'laptop': 'tech',
  'computer': 'tech',
  'tablet': 'tech',
  'electronics': 'tech',
  'electronic': 'tech',
  'dog': 'pets',
  'cat': 'pets',
  'pet': 'pets',
  'animal': 'pets',
  'animals': 'pets',
  'key': 'keys',
  'keychain': 'keys',
  'purse': 'wallet',
  'bag': 'wallet',
  'backpack': 'wallet',
  'handbag': 'wallet',
  'document': 'docs',
  'passport': 'docs',
  'id card': 'docs',
  'idcard': 'docs',
  'certificate': 'docs',
  'shirt': 'clothing',
  'shoes': 'clothing',
  'shoe': 'clothing',
  'glasses': 'clothing',
  'sunglasses': 'clothing',
  'ring': 'jewelry',
  'watch': 'jewelry',
  'necklace': 'jewelry',
  'earring': 'jewelry',
  'earrings': 'jewelry',
  'accessories': 'jewelry',
  'accessory': 'jewelry',
  'bicycle': 'vehicle',
  'bike': 'vehicle',
  'scooter': 'vehicle',
  'motorcycle': 'vehicle',
  'automotive': 'vehicle',
  'car parts': 'vehicle',
  'carparts': 'vehicle',
  'furniture': 'home',
  'chair': 'home',
  'table': 'home',
  'appliance': 'home',
  'appliances': 'home',
  'sport': 'sports',
  'ball': 'sports',
  'racket': 'sports',
  'equipment': 'sports',
  'toy': 'toys',
  'doll': 'toys',
  'game': 'toys',
  'book': 'books',
  'notebook': 'books',
  'journal': 'books',
  'magazine': 'books',
  'tool': 'tools',
  'hammer': 'tools',
  'saw': 'tools',
  'drink': 'food',
  'beverage': 'food',
  'product': 'food',
  'products': 'food',
};

function normalizeCategory(category) {
  if (!category) return 'tech';
  const normalized = String(category).toLowerCase().trim();
  
  if (VALID_CATEGORIES.includes(normalized)) {
    return normalized;
  }
  
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }
  
  return 'tech'; // Default
}

async function checkDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/lostfound";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ MongoDB ga ulandi\n');
    
    const db = client.db('lostfound');
    const collection = db.collection('arizas');
    
    // Barcha arizalarni olish
    const allArizas = await collection.find({}).toArray();
    const total = allArizas.length;
    
    console.log(`📊 Jami arizalar soni: ${total}\n`);
    
    if (total === 0) {
      console.log('⚠️  Bazada arizalar topilmadi');
      return;
    }
    
    // Category statistikasi
    const categoryStats = {};
    const invalidCategories = [];
    const missingCategories = [];
    
    allArizas.forEach(ariza => {
      const category = ariza.category;
      
      if (!category) {
        missingCategories.push({
          id: ariza._id,
          itemType: ariza.itemType || 'Noma\'lum',
          status: ariza.status || 'Noma\'lum'
        });
        return;
      }
      
      const normalized = String(category).toLowerCase().trim();
      
      if (VALID_CATEGORIES.includes(normalized)) {
        categoryStats[normalized] = (categoryStats[normalized] || 0) + 1;
      } else {
        invalidCategories.push({
          id: ariza._id,
          category: category,
          normalized: normalizeCategory(category),
          itemType: ariza.itemType || 'Noma\'lum',
          status: ariza.status || 'Noma\'lum'
        });
        // Normalized category'ni ham statistikaga qo'shish
        const normalizedCat = normalizeCategory(category);
        categoryStats[normalizedCat] = (categoryStats[normalizedCat] || 0) + 1;
      }
    });
    
    // Natijalarni ko'rsatish
    console.log('📈 Category statistikasi:');
    console.log('─'.repeat(50));
    VALID_CATEGORIES.forEach(cat => {
      const count = categoryStats[cat] || 0;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      console.log(`  ${cat.padEnd(15)} : ${String(count).padStart(4)} (${percentage}%)`);
    });
    console.log('─'.repeat(50));
    console.log(`  ${'JAMI'.padEnd(15)} : ${String(total).padStart(4)} (100%)\n`);
    
    // Noto'g'ri kategoriyalar
    if (invalidCategories.length > 0) {
      console.log(`⚠️  Noto'g'ri kategoriyalar: ${invalidCategories.length} ta\n`);
      console.log('Dastlabki 10 ta noto\'g\'ri kategoriya:');
      invalidCategories.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}`);
        console.log(`     Eski: "${item.category}" → Yangi: "${item.normalized}"`);
        console.log(`     Item: ${item.itemType} (${item.status})`);
        console.log('');
      });
      
      if (invalidCategories.length > 10) {
        console.log(`  ... va yana ${invalidCategories.length - 10} ta\n`);
      }
    } else {
      console.log('✅ Barcha kategoriyalar to\'g\'ri formatda!\n');
    }
    
    // Category yo'q bo'lganlar
    if (missingCategories.length > 0) {
      console.log(`⚠️  Category yo'q bo'lgan arizalar: ${missingCategories.length} ta\n`);
      console.log('Dastlabki 10 ta:');
      missingCategories.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}`);
        console.log(`     Item: ${item.itemType} (${item.status})`);
        console.log('');
      });
      
      if (missingCategories.length > 10) {
        console.log(`  ... va yana ${missingCategories.length - 10} ta\n`);
      }
    } else {
      console.log('✅ Barcha arizalarda category mavjud!\n');
    }
    
    // Normalize qilish imkoniyati
    if (invalidCategories.length > 0 || missingCategories.length > 0) {
      console.log('💡 Maslahat:');
      console.log('   Noto\'g\'ri kategoriyalarni to\'g\'rilash uchun quyidagi buyruqni ishlatishingiz mumkin:');
      console.log('   node fix-categories.js\n');
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 MongoDB server ishlamayapti. Iltimos, MongoDB ni ishga tushiring.');
    }
  } finally {
    await client.close();
    console.log('✅ Ulanish yopildi');
  }
}

checkDatabase();
