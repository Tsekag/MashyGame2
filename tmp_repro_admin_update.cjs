const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

(async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mashupgame.com', password: 'admin123' }),
    });
    const loginText = await loginRes.text();
    console.log('LOGIN STATUS', loginRes.status, loginText);
    const loginJson = JSON.parse(loginText);
    const token = loginJson.token;
    if (!token) {
      console.error('No token received');
      return;
    }

    const form = new FormData();
    form.append('name', 'Repro Genre Update');
    form.append('is_active', 'true');
    form.append('image', fs.createReadStream(path.resolve('server/uploads/mashup-1757093647895-529936198.jfif')));

    const response = await fetch('http://localhost:3001/api/admin/genres/35', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const text = await response.text();
    console.log('PUT STATUS', response.status, text);
  } catch (err) {
    console.error('ERROR', err);
  }
})();
