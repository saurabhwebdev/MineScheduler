require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('./config/passport');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Seed default data on startup
const { seedDefaultConstants } = require('./controllers/constantsController');
const seedUoms = require('./utils/seedUoms');

// Initialize default data after DB connection
setTimeout(async () => {
  try {
    await seedUoms();
    await seedDefaultConstants(null); // null userId for system-seeded constants
    console.log('Default data initialization complete');
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
}, 1000);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://minescheduler.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/oauth')); // OAuth routes
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/uoms', require('./routes/uoms'));
app.use('/api/delays', require('./routes/delays'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/equipment-types', require('./routes/equipmentTypes'));
app.use('/api/constants', require('./routes/constants'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/snapshots', require('./routes/snapshots'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/maintenance-logs', require('./routes/maintenanceLogs'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    database: 'connected'
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to MineScheduler API' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
