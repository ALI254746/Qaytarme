/**
 * MongoDB Category Fix Script
 * 
 * Bu skript bazadagi noto'g'ri kategoriyalarni to'g'rilaydi
 * 
 * EHTIYOT: Bu skript bazani o'zgartiradi!
 * Backup olishni tavsiya qilamiz.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const VALID_CATEGORIES = [
  'tech', 'pets', 'keys', 'wallet', 'docs', 'clothing', 
  'jewelry', 'vehicle', 'home', 'sports', 'toys', 'books', 'tools', 'food'
];

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

async function fixCategories() {
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
    
    let fixedCount = 0;
    let addedCount = 0;
    
    console.log('🔄 Kategoriyalarni to\'g\'rilash...\n');
    
    for (const ariza of allArizas) {
      const currentCategory = ariza.category;
      const normalizedCategory = normalizeCategory(currentCategory);
      
      // Agar category yo'q bo'lsa yoki noto'g'ri bo'lsa
      if (!currentCategory || String(currentCategory).toLowerCase().trim() !== normalizedCategory) {
        await collection.updateOne(
          { _id: ariza._id },
          { $set: { category: normalizedCategory } }
        );
        
        if (!currentCategory) {
          addedCount++;
          console.log(`  ✅ ID: ${ariza._id} - Category qo'shildi: "${normalizedCategory}"`);
        } else {
          fixedCount++;
          console.log(`  ✅ ID: ${ariza._id} - "${currentCategory}" → "${normalizedCategory}"`);
        }
      }
    }
    
    console.log('\n' + '─'.repeat(50));
    console.log(`📊 Natijalar:`);
    console.log(`  To'g'rilangan: ${fixedCount} ta`);
    console.log(`  Qo'shilgan: ${addedCount} ta`);
    console.log(`  Jami o'zgartirilgan: ${fixedCount + addedCount} ta`);
    console.log('─'.repeat(50) + '\n');
    
    if (fixedCount === 0 && addedCount === 0) {
      console.log('✅ Barcha kategoriyalar allaqachon to\'g\'ri formatda!');
    } else {
      console.log('✅ Barcha kategoriyalar muvaffaqiyatli to\'g\'rilandi!');
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

// Confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  EHTIYOT: Bu skript bazani o\'zgartiradi!');
console.log('   Backup olishni tavsiya qilamiz.\n');

rl.question('Davom etishni xohlaysizmi? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    fixCategories();
  } else {
    console.log('❌ Bekor qilindi');
    rl.close();
    process.exit(0);
  }
});
