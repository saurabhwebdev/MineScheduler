# Mine Scheduler - Deployment Guide

## Overview
This guide covers deploying the Mine Scheduler application to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Domain & SSL](#domain--ssl)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Software
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Git
- PM2 (for process management)
- Nginx (for reverse proxy)

### Cloud Provider Options
- AWS (EC2, MongoDB Atlas)
- DigitalOcean (Droplets, Managed MongoDB)
- Heroku
- Vercel (Frontend only)
- Render

---

## Environment Setup

### 1. Server Environment Variables

Create `/server/.env` file:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/minescheduler?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
CLIENT_URL=https://your-frontend-domain.com

# SSO Configuration (Optional)
ENABLE_SSO=false
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=https://your-api-domain.com/api/auth/microsoft/callback
```

### 2. Client Environment Variables

Create `/client/.env.production` file:

```env
# Backend API URL
REACT_APP_API_URL=https://your-api-domain.com/api

# App Environment
REACT_APP_ENV=production

# SSO Configuration (Optional)
REACT_APP_ENABLE_SSO=false
REACT_APP_SSO_PROVIDERS=google,microsoft
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Configure Database**
   ```
   - Create database: minescheduler
   - Create user with read/write permissions
   - Whitelist your server IP or use 0.0.0.0/0 for all IPs
   ```

3. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/minescheduler
   ```

### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use minescheduler
> db.createUser({
    user: "scheduler_user",
    pwd: "strong_password",
    roles: [{ role: "readWrite", db: "minescheduler" }]
  })
```

---

## Backend Deployment

### Option 1: PM2 (Node.js Apps)

```bash
# Install PM2 globally
npm install -g pm2

# Navigate to server directory
cd /path/to/MineScheduler

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name "minescheduler-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 2: Docker

Create `Dockerfile` in server directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t minescheduler-api .
docker run -d -p 5000:5000 --env-file .env minescheduler-api
```

### Option 3: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create minescheduler-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

### Option 2: Nginx + Build

```bash
# Build production files
cd client
npm run build

# Copy to web server
sudo cp -r build/* /var/www/minescheduler/

# Configure Nginx
sudo nano /etc/nginx/sites-available/minescheduler
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/minescheduler;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/minescheduler /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd client
npm run build
netlify deploy --prod --dir=build
```

---

## Domain & SSL

### Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Update CORS

Update server `.env`:
```env
CLIENT_URL=https://your-domain.com
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View logs
pm2 logs minescheduler-api

# Monitor resources
pm2 monit

# Restart app
pm2 restart minescheduler-api

# Stop app
pm2 stop minescheduler-api
```

### Health Checks

Create a health check endpoint in your backend:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

### Backup Database

```bash
# MongoDB Atlas - Automated backups enabled by default

# Self-hosted backup
mongodump --uri="mongodb://localhost:27017/minescheduler" --out=/backup/$(date +%Y%m%d)

# Setup cron for daily backups
0 2 * * * mongodump --uri="mongodb://localhost:27017/minescheduler" --out=/backup/$(date +%Y%m%d)
```

---

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB connection failed**
   - Check connection string
   - Verify IP whitelist in MongoDB Atlas
   - Ensure MongoDB service is running

3. **CORS errors**
   - Verify CLIENT_URL in server .env
   - Check frontend API URL configuration

4. **Build fails**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong MongoDB passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Implement rate limiting
- [ ] Enable MongoDB authentication
- [ ] Regular security updates
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Set up monitoring and alerts

---

## Performance Optimization

### Backend
- Enable gzip compression
- Implement caching (Redis)
- Database indexing
- Load balancing for high traffic

### Frontend
- Enable CDN
- Optimize images
- Code splitting
- Browser caching

---

## Support

For deployment issues:
- Check logs: `pm2 logs`
- Review documentation
- Contact support team

---

**Last Updated:** 2025-10-10
**Version:** 1.0.0
