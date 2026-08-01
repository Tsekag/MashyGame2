import fs from 'fs';
import path from 'path';

const genreId = process.argv[2] || '29';
const imagePath = process.argv[3] || 'server/uploads/mashup-1757093647895-529936198.jfif';

try {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mashupgame.com', password: 'admin123' }),
  });
  const loginText = await loginRes.text();
  console.log('LOGIN', loginRes.status, loginText);
  const loginJson = JSON.parse(loginText);
  const token = loginJson.token;
  if (!token) {
    console.error('No token received');
    process.exit(1);
  }

  const form = new FormData();
  form.append('name', `Debug Genre Update ${genreId}`);
  form.append('is_active', 'true');

  if (fs.existsSync(path.resolve(imagePath))) {
    form.append('image', fs.createReadStream(path.resolve(imagePath)));
  } else {
    console.log('No image file found at', imagePath);
  }

  const response = await fetch(`http://localhost:3001/api/admin/genres/${genreId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    console.log('PUT', response.status, JSON.stringify(json, null, 2));
  } else {
    const text = await response.text();
    console.log('PUT', response.status, text);
  }
} catch (err) {
  console.error('ERROR', err);
}
