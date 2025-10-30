<div align="center">

# ⛏️ MineScheduler

### Advanced Mining Operations Scheduling & Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Azure Ready](https://img.shields.io/badge/Azure-Ready-0078D4.svg)](https://azure.microsoft.com/)

**A comprehensive MERN stack application for managing mining operations, equipment, schedules, and maintenance workflows.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [User Roles & Permissions](#-user-roles--permissions)
- [Internationalization](#-internationalization)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**MineScheduler** is a full-stack web application designed to streamline mining operations management. Built with the MERN stack (MongoDB, Express.js, React, Node.js), it provides a robust platform for scheduling, equipment tracking, maintenance management, and operational analytics.

### 🎯 Purpose

- **Optimize Resource Allocation**: Efficiently manage equipment, personnel, and tasks
- **Real-time Monitoring**: Track operations, delays, and maintenance schedules
- **Data-Driven Decisions**: Analytics dashboard for operational insights
- **Multi-Site Management**: Handle multiple mining sites from a single platform
- **Compliance Ready**: Audit trails and comprehensive logging

---

## ✨ Key Features

### 📊 **Dashboard & Analytics**
- Real-time operational metrics and KPIs
- Visual charts and graphs (Recharts integration)
- Equipment utilization tracking
- Performance analytics and trends
- Customizable dashboard widgets

### 👥 **User Management**
- Role-based access control (Admin, Manager, Operator, Viewer)
- OAuth 2.0 authentication (Google & Microsoft)
- JWT-based secure authentication
- User profile management with avatars (Dicebear)
- Activity tracking and audit logs

### 📅 **Schedule Management**
- Shift planning and management
- Task assignment and tracking
- Drag-and-drop interface
- Calendar views (daily, weekly, monthly)
- Conflict detection and resolution
- Schedule snapshots and versioning

### 🚜 **Equipment Management**
- Equipment registry and profiles
- Equipment type categorization
- Real-time status tracking
- Utilization reports
- Assignment history
- QR code generation for equipment

### 🔧 **Maintenance Management**
- Preventive maintenance scheduling
- Maintenance logs and history
- Service reminders and notifications
- Spare parts inventory tracking
- Maintenance cost analysis
- Equipment downtime tracking

### ⏱️ **Delay & Incident Management**
- Delay reason tracking and categorization
- Incident reporting
- Root cause analysis
- Impact assessment
- Resolution workflows

### 🏗️ **Site Management**
- Multi-site operations support
- Site-specific configurations
- Resource allocation per site
- Site performance comparison
- Geographic location tracking

### 📱 **Task Management**
- Task creation and assignment
- Priority levels and status tracking
- Progress monitoring
- Task dependencies
- Recurring tasks support
- File attachments and notes

### 📊 **Reporting & Analytics**
- Custom report generation
- Excel export functionality
- Historical data analysis
- Performance benchmarking
- Compliance reports

### 🌍 **Internationalization (i18n)**
- Multi-language support
- Language detection and switching
- Localized date/time formats
- Currency localization
- RTL language support ready

### 🔐 **Security Features**
- End-to-end encryption
- Role-based access control (RBAC)
- Secure password hashing (bcrypt)
- JWT token authentication
- OAuth 2.0 integration
- CORS protection
- Input validation and sanitization
- XSS protection
- CSRF protection

---

## 🛠️ Technology Stack

### **Frontend**
```
React 18.x          - UI Framework
Ant Design 5.x      - Component Library
React Router 7.x    - Navigation & Routing
Axios               - HTTP Client
Recharts            - Data Visualization
i18next             - Internationalization
Framer Motion       - Animations
Moment.js           - Date/Time Handling
Lucide React        - Modern Icons
```

### **Backend**
```
Node.js 20.x        - Runtime Environment
Express.js 4.x      - Web Framework
MongoDB 8.x         - Database
Mongoose            - ODM
Passport.js         - Authentication
JWT                 - Token Management
Multer              - File Uploads
Express Validator   - Input Validation
```

### **Authentication**
```
JWT                 - Token-based Auth
Passport Google     - Google OAuth 2.0
Passport Microsoft  - Microsoft OAuth 2.0
Bcrypt.js           - Password Hashing
```

### **DevOps & Deployment**
```
Git                 - Version Control
GitHub Actions      - CI/CD
Azure App Service   - Hosting (Recommended)
Azure Cosmos DB     - Cloud Database
Docker              - Containerization (Optional)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           React SPA (Port 3000/Production)           │    │
│  │  • Ant Design UI  • React Router  • State Mgmt     │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Express.js API Server (Port 5000)           │    │
│  │  • REST Endpoints  • Authentication  • Validation   │    │
│  │  • Passport OAuth  • JWT Middleware  • CORS         │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MongoDB / Cosmos DB                     │    │
│  │  Collections: Users, Tasks, Equipment, Sites,       │    │
│  │  Schedules, Maintenance, Delays, Audit, etc.        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### **Key Components**

- **Client**: React SPA with component-based architecture
- **Server**: RESTful API with MVC pattern
- **Database**: MongoDB with Mongoose schemas
- **Auth**: Multi-strategy authentication (Local, Google, Microsoft)
- **File Storage**: Local/cloud storage for uploads
- **Caching**: Redis (optional for production)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or v20.x LTS) - [Download](https://nodejs.org/)
- **npm** (v9.x or higher) - Comes with Node.js
- **MongoDB** (v6.x or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/downloads)

**Optional:**
- **Azure Account** - For cloud deployment
- **Google Cloud Account** - For Google OAuth
- **Microsoft Azure AD** - For Microsoft OAuth

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/saurabhwebdev/MineScheduler.git
   cd MineScheduler
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

### Configuration

1. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   
   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/minescheduler
   # For MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/minescheduler

   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=30d

   # Client URL (for CORS)
   CLIENT_URL=http://localhost:3000

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # Microsoft OAuth (Optional)
   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback
   ```

3. **Set Up MongoDB**

   **Option A: Local MongoDB**
   ```bash
   # Start MongoDB service
   # Windows:
   net start MongoDB
   
   # macOS:
   brew services start mongodb-community
   
   # Linux:
   sudo systemctl start mongod
   ```

   **Option B: MongoDB Atlas** (Recommended for development)
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string and update `MONGO_URI` in `.env`

### Running the Application

#### Development Mode (with hot reload)

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Development Server:**
```bash
npm run client
```

**Or run both concurrently:**
```bash
npm run dev
```

#### Production Mode (locally)

1. **Build the React frontend:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Open your browser and navigate to: `http://localhost:5000`

### Default Admin Account

After the first run, the system seeds a default admin account:

```
Email: admin@minescheduler.com
Password: admin123

⚠️ Change this password immediately after first login!
```

---

## 🌐 Deployment

### Azure Cloud Deployment (Recommended)

We provide a comprehensive step-by-step guide for deploying to Microsoft Azure:

📘 **[Complete Azure Deployment Guide](docs/AZURE_DEPLOYMENT_GUIDE.md)**

This guide includes:
- ✅ Azure App Service setup
- ✅ Azure Cosmos DB (MongoDB API) configuration
- ✅ Environment variables configuration
- ✅ OAuth setup (Google & Microsoft)
- ✅ Custom domain & SSL certificate
- ✅ CI/CD with GitHub Actions
- ✅ Monitoring & maintenance
- ✅ Troubleshooting guide
- ✅ Cost optimization tips

**Quick Deploy to Azure:**

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/)

### Other Deployment Options

<details>
<summary><strong>Heroku Deployment</strong></summary>

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create minescheduler-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main

# Open app
heroku open
```

</details>

<details>
<summary><strong>Docker Deployment</strong></summary>

**Create Dockerfile:**

```dockerfile
# Coming soon
```

**Docker Compose:**
```yaml
# Coming soon
```

</details>

<details>
<summary><strong>AWS Deployment</strong></summary>

- Use AWS Elastic Beanstalk for Node.js
- Configure MongoDB Atlas or AWS DocumentDB
- Set up environment variables in EB configuration
- Deploy using EB CLI or AWS Console

</details>

---

## 📁 Project Structure

```
MineScheduler/
├── 📁 client/                    # React frontend
│   ├── 📁 public/                # Public assets
│   └── 📁 src/
│       ├── 📁 components/        # React components
│       ├── 📁 contexts/          # React contexts
│       ├── 📁 locales/           # i18n translations
│       ├── 📁 pages/             # Page components
│       ├── 📁 services/          # API services
│       ├── 📁 utils/             # Utility functions
│       ├── App.js                # Main App component
│       ├── i18n.js               # i18n configuration
│       └── index.js              # Entry point
│
├── 📁 config/                    # Configuration files
│   ├── db.js                     # Database connection
│   └── passport.js               # Passport strategies
│
├── 📁 controllers/               # Route controllers
│   ├── authController.js         # Authentication logic
│   ├── tasksController.js        # Tasks logic
│   ├── equipmentController.js    # Equipment logic
│   ├── scheduleController.js     # Schedule logic
│   └── ...                       # Other controllers
│
├── 📁 middleware/                # Express middleware
│   ├── auth.js                   # Auth middleware
│   ├── errorHandler.js           # Error handling
│   └── validation.js             # Input validation
│
├── 📁 models/                    # Mongoose models
│   ├── User.js                   # User model
│   ├── Task.js                   # Task model
│   ├── Equipment.js              # Equipment model
│   ├── Schedule.js               # Schedule model
│   └── ...                       # Other models
│
├── 📁 routes/                    # API routes
│   ├── auth.js                   # Auth routes
│   ├── tasks.js                  # Tasks routes
│   ├── equipment.js              # Equipment routes
│   └── ...                       # Other routes
│
├── 📁 utils/                     # Utility functions
│   ├── logger.js                 # Logging utility
│   ├── validators.js             # Validators
│   └── ...                       # Other utilities
│
├── 📁 docs/                      # Documentation
│   ├── AZURE_DEPLOYMENT_GUIDE.md # Azure deployment guide
│   └── API.md                    # API documentation
│
├── 📄 .env.example               # Environment template
├── 📄 .gitignore                 # Git ignore rules
├── 📄 package.json               # Backend dependencies
├── 📄 server.js                  # Express server entry
├── 📄 build.sh                   # Build script
└── 📄 README.md                  # This file
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production:  https://your-domain.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/updateprofile` | Update profile | Yes |
| POST | `/auth/changepassword` | Change password | Yes |
| GET | `/auth/google` | Google OAuth login | No |
| GET | `/auth/microsoft` | Microsoft OAuth login | No |

### Task Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/tasks` | Get all tasks | Yes |
| POST | `/tasks` | Create new task | Yes |
| GET | `/tasks/:id` | Get task by ID | Yes |
| PUT | `/tasks/:id` | Update task | Yes |
| DELETE | `/tasks/:id` | Delete task | Yes |

### Equipment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/equipment` | Get all equipment | Yes |
| POST | `/equipment` | Create equipment | Yes (Admin) |
| GET | `/equipment/:id` | Get equipment by ID | Yes |
| PUT | `/equipment/:id` | Update equipment | Yes (Admin) |
| DELETE | `/equipment/:id` | Delete equipment | Yes (Admin) |

### Schedule Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/schedule` | Get schedules | Yes |
| POST | `/schedule` | Create schedule | Yes |
| PUT | `/schedule/:id` | Update schedule | Yes |
| DELETE | `/schedule/:id` | Delete schedule | Yes |
| POST | `/schedule/snapshot` | Create snapshot | Yes |

<details>
<summary><strong>View More Endpoints</strong></summary>

### Site Endpoints
- GET `/sites` - Get all sites
- POST `/sites` - Create site
- GET `/sites/:id` - Get site by ID
- PUT `/sites/:id` - Update site
- DELETE `/sites/:id` - Delete site

### Maintenance Endpoints
- GET `/maintenance` - Get maintenance records
- POST `/maintenance` - Create maintenance
- PUT `/maintenance/:id` - Update maintenance
- DELETE `/maintenance/:id` - Delete maintenance

### Dashboard Endpoints
- GET `/dashboard/stats` - Get dashboard statistics
- GET `/dashboard/charts` - Get chart data

</details>

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, system configuration |
| **Manager** | Create/edit schedules, manage equipment, view reports, manage team |
| **Supervisor** | View schedules, assign tasks, update status, basic reporting |
| **Operator** | View assigned tasks, update task status, log delays |
| **Viewer** | Read-only access to dashboards and reports |

### Permission Matrix

| Feature | Admin | Manager | Supervisor | Operator | Viewer |
|---------|-------|---------|------------|----------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Schedule | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Schedule | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Equipment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update Task Status | ✅ | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🌍 Internationalization

MineScheduler supports multiple languages:

- 🇺🇸 English (Default)
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇵🇹 Portuguese
- 🇮🇳 Hindi

### Adding New Languages

1. Create translation file: `client/src/locales/[language-code].json`
2. Add translations for all keys
3. Import in `client/src/i18n.js`
4. Test language switching

---

## 📸 Screenshots

<details>
<summary><strong>View Application Screenshots</strong></summary>

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Real-time operational metrics and analytics*

### Schedule Management
![Schedule](docs/screenshots/schedule.png)
*Drag-and-drop schedule planning*

### Equipment Tracking
![Equipment](docs/screenshots/equipment.png)
*Comprehensive equipment management*

### Task Management
![Tasks](docs/screenshots/tasks.png)
*Task assignment and tracking*

### Mobile Responsive
![Mobile](docs/screenshots/mobile.png)
*Fully responsive mobile interface*

</details>

---

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run with coverage
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 MineScheduler Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🆘 Support

### Documentation
- 📘 [Azure Deployment Guide](docs/AZURE_DEPLOYMENT_GUIDE.md)
- 📗 [API Documentation](docs/API.md)
- 📙 [User Guide](docs/USER_GUIDE.md)

### Community
- 💬 [GitHub Discussions](https://github.com/saurabhwebdev/MineScheduler/discussions)
- 🐛 [Issue Tracker](https://github.com/saurabhwebdev/MineScheduler/issues)
- 📧 Email: support@minescheduler.com

### FAQ

<details>
<summary><strong>How do I reset the admin password?</strong></summary>

Connect to MongoDB and update the admin user:
```javascript
db.users.updateOne(
  { email: "admin@minescheduler.com" },
  { $set: { password: /* hashed password */ } }
)
```
</details>

<details>
<summary><strong>Can I use a different database?</strong></summary>

Currently, MineScheduler is optimized for MongoDB. Support for other databases may be added in future releases.
</details>

<details>
<summary><strong>How do I enable OAuth?</strong></summary>

Follow the OAuth setup instructions in the [Azure Deployment Guide](docs/AZURE_DEPLOYMENT_GUIDE.md#part-7-setting-up-oauth-google--microsoft).
</details>

---

## 🗺️ Roadmap

### Version 2.0 (Q2 2025)
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics with AI/ML
- [ ] Offline mode support
- [ ] Integration with IoT sensors

### Version 2.1 (Q3 2025)
- [ ] Multi-tenancy support
- [ ] Advanced reporting engine
- [ ] Video conferencing integration
- [ ] Document management system
- [ ] Blockchain for audit trails

### Version 3.0 (Q4 2025)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Advanced AI predictions
- [ ] VR/AR support for site visualization
- [ ] Integration marketplace

---

## 👏 Acknowledgments

- **Ant Design** - For the amazing UI component library
- **React Team** - For the excellent framework
- **MongoDB** - For the flexible database
- **Azure** - For cloud infrastructure
- **Open Source Community** - For countless libraries and tools

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/saurabhwebdev/MineScheduler?style=social)
![GitHub forks](https://img.shields.io/github/forks/saurabhwebdev/MineScheduler?style=social)
![GitHub issues](https://img.shields.io/github/issues/saurabhwebdev/MineScheduler)
![GitHub pull requests](https://img.shields.io/github/issues-pr/saurabhwebdev/MineScheduler)
![GitHub last commit](https://img.shields.io/github/last-commit/saurabhwebdev/MineScheduler)

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

**Built with ❤️ by the MineScheduler Team**

[Website](https://minescheduler.com) • [Documentation](https://docs.minescheduler.com) • [Blog](https://blog.minescheduler.com)

© 2025 MineScheduler. All rights reserved.

</div>
