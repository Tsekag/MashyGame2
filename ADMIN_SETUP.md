# Admin Panel Setup Instructions

This guide will help you set up and run the Mashup Game Admin Panel.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **XAMPP** (for MySQL database)
3. **Git** (to clone the repository)

## Database Setup

1. **Start XAMPP**
   - Start Apache and MySQL services in XAMPP Control Panel

2. **Create Database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `mashup_game`
   - Set collation to `utf8mb4_unicode_ci`

3. **Environment Configuration**
   - Copy the environment variables below to a `.env` file in the `server` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mashup_game

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Admin User**
   ```bash
   npm run setup-admin
   ```

3. **Start the Application**
   ```bash
   npm run dev:full
   ```

   This will start both the backend server (port 3001) and frontend (port 5173).

## Accessing the Admin Panel

1. **Open your browser** and go to: `http://localhost:5173/admin/login`

2. **Login with admin credentials:**
   - Email: `admin@mashupgame.com`
   - Password: `admin123`

3. **Change the default password** after first login for security.

## Admin Panel Features

### Genres Management
- ✅ View all genres in a grid layout
- ✅ Add new genres
- ✅ Edit existing genres
- ✅ Delete genres
- ✅ Search and sort genres
- ✅ Toggle active/inactive status

### Characters Management
- ✅ View all characters with genre information
- ✅ Add new characters with image upload
- ✅ Edit characters (including image updates)
- ✅ Delete characters (removes associated images)
- ✅ Search and sort characters
- ✅ Toggle active/inactive status
- ✅ Assign characters to genres

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/signup` - User registration

### Admin Genres
- `GET /api/admin/genres` - List all genres
- `POST /api/admin/genres` - Create new genre
- `PUT /api/admin/genres/:id` - Update genre
- `DELETE /api/admin/genres/:id` - Delete genre

### Admin Characters
- `GET /api/admin/characters` - List all characters
- `POST /api/admin/characters` - Create new character (with image upload)
- `PUT /api/admin/characters/:id` - Update character
- `DELETE /api/admin/characters/:id` - Delete character

## File Structure

```
server/
├── config/
│   └── database.js          # Database connection
├── middleware/
│   └── auth.js              # JWT authentication & admin middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   └── admin.js             # Admin CRUD routes
├── uploads/                 # Character images storage
├── server.js                # Main server file
└── setup-admin.js           # Admin user setup script

src/
├── components/
│   └── ProtectedRoute.tsx   # Route protection component
├── layouts/
│   └── AdminLayout.tsx      # Admin panel layout
├── pages/
│   ├── LoginPage.tsx        # Admin login page
│   ├── AdminDashboard.tsx   # Main admin dashboard
│   ├── GenresPage.tsx       # Genres management
│   └── CharactersPage.tsx   # Characters management
└── services/
    └── adminApi.ts          # API client for admin operations
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure XAMPP MySQL is running
   - Check database credentials in `.env` file
   - Verify database `mashup_game` exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes using the port

3. **Image Upload Issues**
   - Check `uploads` directory permissions
   - Ensure multer configuration is correct

4. **JWT Token Errors**
   - Verify JWT_SECRET is set in `.env`
   - Check token expiration settings

### Development Commands

```bash
# Start only backend
npm run server

# Start only frontend
npm run dev

# Start both (recommended)
npm run dev:full

# Setup admin user
npm run setup-admin

# Build for production
npm run build
```

## Security Notes

- Change default admin password immediately
- Use strong JWT_SECRET in production
- Implement proper CORS settings for production
- Add rate limiting for production use
- Use HTTPS in production environment

## Support

If you encounter any issues, check the console logs for error messages and ensure all prerequisites are properly installed and configured.

