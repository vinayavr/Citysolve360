# Municipality Issue Log System - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Git

## Backend Setup

### 1. Clone Repository
```bash
git clone https://github.com/vinayavr/Citysolve360.git
cd Citysolve360
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create `.env` file in backend folder:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=municipality_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

CORS_ORIGIN=http://localhost:3000
```

### 4. Initialize Database
```bash
npm run init-db
```

### 5. Start Backend Server
```bash
npm run dev
```

Server will run on: http://localhost:5000

## Frontend Setup

### 1. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create `.env` file in frontend folder:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
REACT_APP_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### 3. Start Frontend Server
```bash
npm start
```

Application will run on: http://localhost:3000

## ImageKit.io Setup

1. Sign up at https://imagekit.io (Free tier available)
2. Get your credentials from Dashboard:
   - Public Key
   - Private Key
   - URL Endpoint
3. Add these to your .env files

## Testing

### Demo Credentials (After DB initialization)
- **Citizen**: citizen@demo.com / demo123
- **Official**: official@demo.com / demo123

## Folder Structure Created
```
municipality-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        ├── context/
        └── styles/
```

## Next Steps
1. Complete backend routes (issueController.js, routes/)
2. Build dashboard and issue management pages
3. Implement image upload with ImageKit
4. Add real-time notifications
5. Deploy to production

## Troubleshooting

### MySQL Connection Issues
- Ensure MySQL service is running
- Check credentials in .env
- Verify database exists: `SHOW DATABASES;`

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors
- Ensure CORS_ORIGIN in backend .env matches frontend URL
- Check if backend server is running

## Support
For issues, check: https://github.com/vinayavr/Citysolve360/issues