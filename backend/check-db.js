
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function check() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/musodara";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const arizas = await db.collection('arizas').find().sort({createdAt: -1}).limit(5).toArray();
    
    console.log("Last 5 items:");
    arizas.forEach(a => {
      console.log(`ID: ${a._id}, Type: ${a.itemType}, Status: ${a.status}, Category: '${a.category}'`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

check();
