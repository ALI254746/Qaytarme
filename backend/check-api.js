
const http = require('http');

http.get('http://localhost:4000/api/ariza?limit=5', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.arizalar) {
        parsed.arizalar.forEach(a => {
            console.log(`ID: ${a._id}, Type: ${a.itemType}, Category: '${a.category}'`);
        });
    } else {
        console.log(data);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
