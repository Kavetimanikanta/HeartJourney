const fs = require('fs');
const path = require('path');
const fetch = require('node:fetch');
const file = path.join(process.cwd(), 'test-screenshot.png');
fs.writeFileSync(file, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9VPwA0sAAAAASUVORK5CYII=', 'base64'));
(async () => {
  try {
    const formData = new FormData();
    formData.append('orderId', 'test123');
    formData.append('name', 'Test User');
    formData.append('phone', '9999999999');
    formData.append('email', 'test@example.com');
    formData.append('whatsapp', '919999999999');
    formData.append('screenshot', fs.createReadStream(file));
    const res = await fetch('http://localhost:3000/api/orders', { method: 'POST', body: formData });
    console.log('STATUS', res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  } finally {
    fs.unlinkSync(file);
  }
})();
