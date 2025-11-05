# 🏛️ Municipality Issue Log System - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Configuration](#database-configuration)
5. [ImageKit Setup](#imagekit-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

### Verify Installation
```bash
node --version  # Should show v16+
npm --version   # Should show v8+
mysql --version # Should show v8.0+
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` file in the `backend` folder:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=municipality_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Initialize Database
```bash
npm run init-db
```

Expected output:
```
📦 Connected to MySQL server
✅ Database 'municipality_db' created/verified
✅ Database schema initialized successfully
🎉 Database setup complete!
```

### Step 5: Start Backend Server
```bash
npm run dev
```

Server should start on: `http://localhost:5000`

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd ../frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` file in the `frontend` folder:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
REACT_APP_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### Step 4: Start Frontend Server
```bash
npm start
```

Application should open at: `http://localhost:3000`

---

## Database Configuration

### MySQL Setup

1. **Start MySQL Service**
```bash
   # Windows
   net start MySQL80
   
   # Mac (using Homebrew)
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
```

2. **Login to MySQL**
```bash
   mysql -u root -p
```

3. **Verify Database Creation** (after running init-db)
```sql
   SHOW DATABASES;
   USE municipality_db;
   SHOW TABLES;
```

### Database Schema Overview
- **users** - Stores citizen and official user data
- **issues** - Stores all reported issues
- **issue_updates** - Tracks all status changes and updates

---

## ImageKit Setup

### Step 1: Create Account
1. Go to [ImageKit.io](https://imagekit.io/)
2. Sign up for a free account
3. Verify your email

### Step 2: Get Credentials
1. Login to ImageKit Dashboard
2. Go to **Developer Options**
3. Copy the following:
   - Public Key
   - Private Key
   - URL Endpoint

### Step 3: Configure
Add these credentials to both backend and frontend `.env` files

### Step 4: Verify Connection
After starting the server, test image upload by reporting an issue with photos.

---

## Running the Application

### Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## Testing

### Create Test Accounts

1. **Register as Citizen**
   - Go to http://localhost:3000/register
   - Fill in details with role = "Citizen"
   - Login with created credentials

2. **Register as Official**
   - Register with role = "Official"
   - Add department information

### Test Workflow

1. **As Citizen:**
   - Report a new issue with images
   - View "My Issues"
   - Check issue status
   - Update profile

2. **As Official:**
   - View all pending issues
   - Update issue status
   - Add resolution notes
   - Assign issues

### Demo Credentials
After running the database initialization, you can manually create demo users:
```sql
USE municipality_db;

-- Citizen Demo Account
INSERT INTO users (name, email, password, role) VALUES 
('Demo Citizen', 'citizen@demo.com', '$2a$10$YourHashedPassword', 'citizen');

-- Official Demo Account
INSERT INTO users (name, email, password, role, department) VALUES 
('Demo Official', 'official@demo.com', '$2a$10$YourHashedPassword', 'official', 'Public Works');
```

Password: `demo123` (You'll need to hash it using bcrypt)

---

## Deployment

### Backend Deployment (Railway/Heroku)

1. **Railway:**
```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   
   # Add MySQL database
   railway add
   
   # Deploy
   railway up
```

2. **Update Environment Variables:**
   - Add all .env variables in Railway dashboard
   - Update DATABASE credentials
   - Update CORS_ORIGIN to frontend URL

### Frontend Deployment (Vercel/Netlify)

1. **Vercel:**
```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd frontend
   vercel
```

2. **Update Environment Variables:**
   - Add REACT_APP_API_URL pointing to deployed backend
   - Add ImageKit credentials

### Post-Deployment Checklist
- [ ] Update CORS_ORIGIN in backend
- [ ] Update API_URL in frontend
- [ ] Test all features in production
- [ ] Setup database backups
- [ ] Monitor error logs

---

## Troubleshooting

### Common Issues

#### 1. MySQL Connection Failed
**Error:** `ER_ACCESS_DENIED_ERROR`

**Solution:**
```bash
# Reset MySQL password
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
```

#### 2. Port Already in Use
**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### 3. CORS Errors
**Error:** `Access-Control-Allow-Origin`

**Solution:**
- Check CORS_ORIGIN in backend .env
- Ensure it matches frontend URL
- Restart backend server

#### 4. ImageKit Upload Failed
**Error:** `ImageKit authentication failed`

**Solution:**
- Verify all three credentials (public key, private key, endpoint)
- Check if keys are properly added to .env
- Restart servers after updating .env

#### 5. Database Schema Issues
**Error:** `Table doesn't exist`

**Solution:**
```bash
# Re-initialize database
cd backend
npm run init-db
```

### Debug Mode

Enable detailed logging:

**Backend:**
```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log('Request:', req.method, req.path, req.body);
  next();
});
```

**Frontend:**
```javascript
// Add to api.js
api.interceptors.request.use(config => {
  console.log('API Request:', config);
  return config;
});
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [ImageKit Documentation](https://docs.imagekit.io/)
- [JWT Documentation](https://jwt.io/)

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/vinayavr/Citysolve360/issues
- Email: support@yourdomain.com

---

## License

MIT License - See LICENSE file for details

---
