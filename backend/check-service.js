/**
 * Backend Service Check Script
 * 
 * Bu skript backend servisini tekshiradi va holatini ko'rsatadi
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 4000;
const API_URL = `http://localhost:${PORT}/api`;

function checkService() {
  console.log(`🔍 Backend servisni tekshiryapman...`);
  console.log(`   URL: ${API_URL}\n`);

  // Health check endpoint
  const healthUrl = `${API_URL.replace('/api', '')}/api`; // Try root first
  
  http.get(`${API_URL}/ariza?limit=1`, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Backend servis ISHLAYAPTI!\n');
        console.log('📊 API javobi:');
        
        if (parsed.arizalar) {
          console.log(`   Jami arizalar: ${parsed.total || parsed.arizalar.length}`);
          console.log(`   Birinchi ariza: ${parsed.arizalar[0]?.itemType || 'N/A'}`);
          console.log(`   Category: ${parsed.arizalar[0]?.category || 'N/A'}`);
        } else {
          console.log('   API javob:', JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        console.log('✅ Backend servis ISHLAYAPTI!');
        console.log('   (Javob JSON formatida emas)');
        console.log('   Javob:', data.substring(0, 200));
      }
    });

  }).on("error", (err) => {
    console.log('❌ Backend servis ISHLAMAYAPTI!\n');
    console.log('   Xatolik:', err.message);
    console.log('\n💡 Maslahat:');
    console.log('   Backend servisni ishga tushirish uchun:');
    console.log('   cd backend');
    console.log('   npm run start:dev');
    console.log('\n   Yoki production uchun:');
    console.log('   npm run build');
    console.log('   npm run start:prod');
  });
}

// Check if port is in use
const net = require('net');
const server = net.createServer();

server.listen(PORT, () => {
  server.close(() => {
    console.log(`⚠️  Port ${PORT} bo'sh (servis ishlamayapti)\n`);
    checkService();
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`✅ Port ${PORT} ishlatilmoqda (servis ishlayotgan bo'lishi mumkin)\n`);
    checkService();
  } else {
    console.log('❌ Xatolik:', err.message);
  }
});
