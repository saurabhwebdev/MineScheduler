# Quick Start Guide - MineScheduler

## ✅ Installation Complete!

Your MERN Stack boilerplate has been successfully installed with all dependencies.

## 🚀 How to Run

### Prerequisites
Make sure MongoDB is running on your local machine:

```powershell
# If MongoDB is installed as a Windows service:
net start MongoDB

# Or if you need to start it manually:
# Navigate to your MongoDB bin folder and run:
# mongod
```

### Option 1: Run Both Server & Client Together (Recommended)

```powershell
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- React frontend on http://localhost:3000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```powershell
npm run server
```

**Terminal 2 - Frontend:**
```powershell
npm run client
```

## 📝 What's Configured

### Environment Variables (.env)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/minescheduler  ← Local MongoDB
JWT_SECRET=minescheduler_dev_secret_key_2024
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

### Database
- **Current:** MongoDB localhost (mongodb://localhost:27017/minescheduler)
- **To switch to MongoDB Atlas:** Simply update the `MONGO_URI` in `.env` file

Example for Atlas:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/minescheduler
```

## 🎯 Features Ready to Use

✅ User Registration & Login
✅ JWT Authentication
✅ Protected Routes
✅ Role-based Authorization (user/admin)
✅ React Router Setup
✅ API Integration with Axios
✅ Context API for State Management
✅ Beautiful UI with Custom CSS

## 🔗 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 📦 Project Structure

```
MineScheduler/
├── server.js              ← Express server entry point
├── .env                   ← Environment configuration
├── package.json           ← Server dependencies
│
├── config/
│   └── db.js              ← MongoDB connection
│
├── models/
│   └── User.js            ← User model with bcrypt
│
├── routes/
│   ├── auth.js            ← Authentication routes
│   └── users.js           ← User management routes
│
├── middleware/
│   └── auth.js            ← JWT authentication middleware
│
├── utils/
│   └── jwt.js             ← JWT helper functions
│
└── client/                ← React frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── components/
        │   └── Navbar.js
        ├── pages/
        │   ├── Home.js
        │   ├── Login.js
        │   ├── Register.js
        │   └── Dashboard.js
        ├── services/
        │   └── api.js     ← Axios API calls
        └── context/
            └── AuthContext.js
```

## 🧪 Test the Setup

1. **Start MongoDB** (if not running)
2. **Run the app:** `npm run dev`
3. **Open browser:** http://localhost:3000
4. **Register a new user** and test the authentication

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Protected)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Admin only)

## 🔄 Switching Databases

### From Local MongoDB to MongoDB Atlas:

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/minescheduler
   ```
5. Restart server

### From MongoDB Atlas to Local:

1. Update `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/minescheduler
   ```
2. Restart server

## 🎨 Next Steps

Now you can start building your MineScheduler features:

1. Add more models (Schedules, Tasks, etc.)
2. Create new API routes
3. Build new React components
4. Customize the UI/UX
5. Add more features as needed

## 💡 Tips

- All passwords are automatically hashed with bcrypt
- JWT tokens are stored in localStorage
- CORS is configured for development
- The React app proxies API requests to the backend
- Check `README.md` for detailed documentation

## 🆘 Troubleshooting

**MongoDB connection error?**
- Make sure MongoDB is running
- Check the connection string in `.env`

**Port already in use?**
- Change the PORT in `.env` file
- Make sure nothing else is running on ports 3000 or 5000

**npm install issues?**
- Try deleting `node_modules` and `package-lock.json`
- Run `npm install` again

---

Happy Coding! 🚀
