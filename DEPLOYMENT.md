# Deployment Guide for MashyT

## 1) Recommended hosting setup
- Frontend: Vercel
- Backend: Render
- Database: MySQL-compatible host (Railway, Aiven, or another MySQL provider)

> Supabase is possible, but this project is currently built for MySQL/MariaDB. The SQL and connection layer use MySQL syntax, so a drop-in switch to Supabase would require schema migration and query changes.

## 2) What changed for deployment
The frontend no longer uses hard-coded localhost URLs. It now reads:
- VITE_BACKEND_URL
- VITE_API_BASE_URL

The backend now accepts:
- FRONTEND_URL
- VERCEL_URL

## 3) Environment variables
### Backend (.env on Render)
```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=mashup_game
JWT_SECRET=replace-with-a-long-random-secret
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel env vars)
```env
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

## 4) Files involved
- server/config/database.js -> uses env-based DB settings
- server/server.js -> CORS for deployed frontend
- src/config/api.ts -> central URL config
- src/services/api.ts -> frontend API client
- src/services/adminApi.ts -> admin API client
- src/components/CommunityGallery.tsx -> image URL handling
- src/components/Dashboard.tsx -> image URL handling
- src/pages/CharactersPage.tsx -> image URL handling
- package.json -> added start script
- vercel.json -> SPA rewrite config

## 5) Render backend deployment
- Create a new Web Service on Render
- Connect this repository
- Root directory: MashyT
- Build command: npm install
- Start command: npm start
- Add environment variables from above
- Deploy

## 6) Vercel frontend deployment
- Create a new Vercel project
- Connect this repository
- Set root directory to MashyT
- Build command: npm run build
- Output directory: dist
- Add frontend env vars
- Deploy

## 7) Database setup
- Create your MySQL database
- Ensure the tables are created automatically when the backend starts
- Optionally run the admin setup script after deploy

## 8) Important note about uploads
The app stores uploaded images on the local server filesystem. On Render, local files may not persist after deploy/restart. For production, use Cloudflare R2, S3, or another object storage provider.
