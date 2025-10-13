# MineScheduler - MERN Stack Application

A full-stack MERN (MongoDB, Express, React, Node.js) boilerplate application with authentication.

## Features

- ✅ MongoDB database connection (configurable via environment variables)
- ✅ Express.js REST API
- ✅ React frontend with React Router
- ✅ JWT authentication
- ✅ User registration and login
- ✅ Protected routes
- ✅ Role-based authorization (user/admin)
- ✅ Environment-based configuration

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB installed locally OR MongoDB Atlas account
- npm or yarn package manager

## Installation

### 1. Install Server Dependencies

```bash
npm install
```

### 2. Install Client Dependencies

```bash
cd client
npm install
cd ..
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. A `.env` file has been created with default settings for local development.

**Current Configuration (.env):**
- `NODE_ENV=development`
- `PORT=5000`
- `MONGO_URI=mongodb://localhost:27017/minescheduler` (Local MongoDB)
- `JWT_SECRET=minescheduler_dev_secret_key_2024`
- `JWT_EXPIRE=30d`
- `CLIENT_URL=http://localhost:3000`

### Switching to MongoDB Atlas (Cloud)

To use MongoDB Atlas instead of local MongoDB:

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Update the `.env` file:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/minescheduler?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

## Running the Application

### Start MongoDB Locally (if using local MongoDB)

Make sure MongoDB is running on your machine:

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start manually
mongod
```

### Run in Development Mode

**Option 1: Run both server and client concurrently**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Start the server:
```bash
npm run server
```

Terminal 2 - Start the client:
```bash
npm run client
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Protected)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Admin only)

## Project Structure

```
MineScheduler/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── context/        # React context
│       └── App.js          # Main app component
├── config/                 # Server configuration
│   └── db.js               # Database connection
├── middleware/             # Express middleware
│   └── auth.js             # Authentication middleware
├── models/                 # Mongoose models
│   └── User.js             # User model
├── routes/                 # API routes
│   ├── auth.js             # Auth routes
│   └── users.js            # User routes
├── utils/                  # Utility functions
│   └── jwt.js              # JWT utilities
├── .env                    # Environment variables
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore file
├── package.json            # Server dependencies
├── server.js               # Express server entry point
└── README.md               # This file
```

## Testing the API

You can test the API using tools like Postman or curl:

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Production Build

To create a production build:

```bash
npm run build
```

This will create an optimized production build of the client in the `client/build` folder.

## Notes

- The JWT secret in the `.env` file should be changed for production
- Make sure MongoDB is running before starting the server
- The client is configured with a proxy to the backend server
- All passwords are hashed using bcrypt before storing in the database

## License

ISC
