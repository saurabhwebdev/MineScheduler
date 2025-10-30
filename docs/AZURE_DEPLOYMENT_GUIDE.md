# MineScheduler - Azure Deployment Guide

## Complete Step-by-Step Guide to Deploy on Azure App Service

This document provides a comprehensive, hand-holding guide to deploy the MineScheduler MERN application on Microsoft Azure using Azure App Service and Azure Cosmos DB.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Part 1: Setting Up Azure Cosmos DB (MongoDB)](#part-1-setting-up-azure-cosmos-db-mongodb)
4. [Part 2: Preparing the Application for Deployment](#part-2-preparing-the-application-for-deployment)
5. [Part 3: Creating Azure App Service](#part-3-creating-azure-app-service)
6. [Part 4: Configuring Environment Variables](#part-4-configuring-environment-variables)
7. [Part 5: Deploying the Application](#part-5-deploying-the-application)
8. [Part 6: Post-Deployment Configuration](#part-6-post-deployment-configuration)
9. [Part 7: Setting Up OAuth (Google & Microsoft)](#part-7-setting-up-oauth-google--microsoft)
10. [Part 8: Testing and Verification](#part-8-testing-and-verification)
11. [Part 9: Setting Up Custom Domain (Optional)](#part-9-setting-up-custom-domain-optional)
12. [Part 10: Monitoring and Maintenance](#part-10-monitoring-and-maintenance)
13. [Troubleshooting](#troubleshooting)
14. [Cost Estimation](#cost-estimation)

---

## Prerequisites

Before you begin, ensure you have:

### Required Accounts
- [ ] **Microsoft Azure Account** with active subscription
  - Sign up at: https://azure.microsoft.com/free/
  - New accounts get $200 free credits for 30 days
- [ ] **GitHub Account** (for deployment)
- [ ] **Google Cloud Console Account** (if using Google OAuth)
- [ ] **Microsoft Azure AD** (already available with Azure account for Microsoft OAuth)

### Required Software on Local Machine
- [ ] **Node.js** (v18.x or v20.x LTS)
  - Check: `node --version`
- [ ] **npm** (comes with Node.js)
  - Check: `npm --version`
- [ ] **Git**
  - Check: `git --version`
- [ ] **Azure CLI** (recommended but optional)
  - Download: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
  - Check: `az --version`

### Application Requirements
- [ ] Your MineScheduler application code ready
- [ ] Tested locally and working
- [ ] Git repository initialized

---

## Architecture Overview

**What We're Building:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Users                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Azure App Service    │
         │  (Node.js Runtime)     │
         │                        │
         │  ┌──────────────────┐  │
         │  │  Express Server   │  │ ← Backend API
         │  │  (Port 5000)      │  │
         │  └──────────────────┘  │
         │  ┌──────────────────┐  │
         │  │  React Build      │  │ ← Frontend (Static)
         │  │  (Served by       │  │
         │  │   Express)        │  │
         │  └──────────────────┘  │
         └───────────┬────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Azure Cosmos DB      │
         │  (MongoDB API)        │
         │  Database Storage     │
         └───────────────────────┘
```

**Key Points:**
- Single App Service hosts both frontend and backend
- React app builds to static files served by Express
- Cosmos DB provides MongoDB-compatible database
- OAuth providers for authentication

---

## Part 1: Setting Up Azure Cosmos DB (MongoDB)

### Step 1.1: Sign in to Azure Portal

1. Go to **https://portal.azure.com**
2. Sign in with your Microsoft account
3. You should see the Azure Portal dashboard

### Step 1.2: Create a Resource Group

A resource group is a container for all related Azure resources.

1. Click **"Resource groups"** in the left sidebar (or search for it)
2. Click **"+ Create"** button
3. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource group name**: `minescheduler-rg`
   - **Region**: Choose closest to your users (e.g., `East US`, `West Europe`, `Southeast Asia`)
4. Click **"Review + create"**
5. Click **"Create"**

### Step 1.3: Create Azure Cosmos DB Account

1. Click **"+ Create a resource"** (top left)
2. Search for **"Azure Cosmos DB"**
3. Click **"Create"** on the Azure Cosmos DB card
4. Select **"Azure Cosmos DB for MongoDB"**
5. Click **"Create"**

### Step 1.4: Configure Cosmos DB Settings

Fill in the following details:

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource Group**: `minescheduler-rg` (select the one you created)
- **Account Name**: `minescheduler-db` (must be globally unique)
  - If taken, try: `minescheduler-db-[yourname]` or `minescheduler-db-[random]`
- **Location**: Same as your resource group
- **Capacity mode**: 
  - **Serverless** (recommended for start - pay per use, no minimum)
  - OR **Provisioned throughput** (predictable performance)
- **Version**: Select **"4.2"** or latest available

**Global Distribution Tab:**
- **Geo-Redundancy**: Disable (can enable later)
- **Multi-region Writes**: Disable (can enable later)

**Networking Tab:**
- **Connectivity method**: 
  - Select **"All networks"** (simplest for initial setup)
  - OR **"Public endpoint (selected networks)"** (more secure - recommended)
    - If selected, you'll add Azure App Service IP later

**Backup Policy Tab:**
- Leave defaults (Periodic backup)

**Encryption Tab:**
- Leave defaults

**Tags Tab:**
- Optionally add:
  - Key: `Environment`, Value: `Production`
  - Key: `Application`, Value: `MineScheduler`

6. Click **"Review + create"**
7. Review all settings
8. Click **"Create"**
9. **Wait 5-10 minutes** for deployment to complete
10. Click **"Go to resource"** when ready

### Step 1.5: Get MongoDB Connection String

This is critical - you'll need this for your application.

1. In your Cosmos DB account, click **"Connection strings"** in the left menu (under Settings)
2. You'll see a connection string like:
   ```
   mongodb://minescheduler-db:[password]@minescheduler-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@minescheduler-db@
   ```
3. **IMPORTANT**: Copy the **"PRIMARY CONNECTION STRING"**
4. **SAVE THIS SECURELY** - you'll need it for environment variables
   - Consider using a password manager
   - DO NOT commit this to Git
5. Also note down:
   - **HOST**: `minescheduler-db.mongo.cosmos.azure.com`
   - **PORT**: `10255`
   - **USERNAME**: `minescheduler-db`
   - **PRIMARY PASSWORD**: (shown on the page)

### Step 1.6: Configure Cosmos DB Firewall (If Using Selected Networks)

If you chose "selected networks" in networking:

1. In Cosmos DB account, go to **"Networking"** (left menu under Settings)
2. Under **"Firewall"**, click **"+ Add my current IP address"**
3. This allows you to connect from your local machine for testing
4. Click **"Save"**
5. **Note**: You'll add Azure App Service IP range later after creating the app service

---

## Part 2: Preparing the Application for Deployment

### Step 2.1: Verify Application Structure

Ensure your project has this structure:

```
MineScheduler/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── config/                  # Configuration files
├── controllers/             # Express controllers
├── middleware/              # Express middleware
├── models/                  # Mongoose models
├── routes/                  # Express routes
├── utils/                   # Utility functions
├── .env.example
├── .gitignore
├── package.json             # Backend package.json
├── server.js                # Main server file
└── build.sh                 # Build script
```

### Step 2.2: Update .gitignore

Ensure sensitive files are not tracked:

1. Open `.gitignore` in your editor
2. Verify it contains:
   ```
   node_modules/
   .env
   .env.local
   .env.production
   client/build/
   npm-debug.log*
   ```
3. Save if you made changes

### Step 2.3: Update package.json Scripts

Your root `package.json` should have these scripts (already configured):

```json
"scripts": {
  "start": "node server.js",
  "server": "nodemon server.js",
  "client": "npm start --prefix client",
  "dev": "concurrently \"npm run server\" \"npm run client\"",
  "install-client": "npm install --prefix client",
  "build": "npm run build --prefix client",
  "heroku-postbuild": "npm install --prefix client && npm run build --prefix client"
}
```

**Note**: Azure App Service will use the `start` script and can use `heroku-postbuild` for build process.

### Step 2.4: Create/Update Web.config (For Azure App Service)

Create a `web.config` file in your project root to configure IIS on Azure:

**File: `web.config`**
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Don't interfere with Node.js -->
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Redirect all requests to server.js -->
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    
    <!-- Security settings -->
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    
    <!-- Error handling -->
    <httpErrors existingResponse="PassThrough" />
    
    <!-- IISNode settings -->
    <iisnode 
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js;iisnode.yml"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectory="iisnode"
      debuggingEnabled="false"
      debugHeaderEnabled="false"
      debuggerPortRange="5058-6058"
      debuggerPathSegment="debug"
      maxLogFileSizeInKB="128"
      maxTotalLogFileSizeInKB="1024"
      maxLogFiles="20"
      devErrorsEnabled="false"
      flushResponse="false"
      enableXFF="true"
      promoteServerVars=""
      configOverrides="iisnode.yml"
    />
  </system.webServer>
</configuration>
```

### Step 2.5: Create .deployment File (Optional but Recommended)

This tells Azure which build command to run:

**File: `.deployment`**
```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Step 2.6: Update CORS Configuration in server.js

Ensure your `server.js` includes Azure domain in CORS (already configured):

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://minescheduler.onrender.com',
  process.env.CLIENT_URL  // Will be your Azure URL
].filter(Boolean);
```

**Note**: You'll add your Azure App Service URL to `CLIENT_URL` environment variable later.

### Step 2.7: Test Build Locally

Before deploying, test that the build works:

```bash
# Install all dependencies
npm install

# Build the React frontend
npm run build

# Test production mode locally
NODE_ENV=production npm start
```

Visit `http://localhost:5000` - you should see the React app served by Express.

If successful, stop the server (Ctrl+C).

### Step 2.8: Commit Changes to Git

```bash
# Check status
git status

# Add new files
git add web.config .deployment

# Commit
git commit -m "Add Azure deployment configuration"
```

---

## Part 3: Creating Azure App Service

### Step 3.1: Navigate to App Services

1. In Azure Portal, click **"+ Create a resource"**
2. Search for **"Web App"**
3. Click **"Create"** on the Web App card

### Step 3.2: Configure Web App Basics

**Basics Tab:**

- **Subscription**: Your subscription
- **Resource Group**: `minescheduler-rg` (same as before)
- **Name**: `minescheduler-app` (must be globally unique)
  - This will be your URL: `https://minescheduler-app.azurewebsites.net`
  - If taken, try: `minescheduler-app-[yourname]` or add random numbers
- **Publish**: **Code**
- **Runtime stack**: **Node 20 LTS** (or Node 18 LTS)
- **Operating System**: **Linux** (recommended) or Windows
- **Region**: Same as your Cosmos DB

**App Service Plan:**
- Click **"Create new"**
- **Name**: `minescheduler-plan`
- **Pricing Tier**: Click **"Explore pricing plans"**
  - **Development/Test**: 
    - **F1 Free** (for testing only - limited, sleeps after inactivity)
    - **B1 Basic** ($13/month - recommended minimum for production)
  - **Production**: 
    - **P1V2** ($88/month - better performance)
    - **P1V3** ($117/month - best performance)
  - For initial deployment: Choose **B1 Basic**
- Click **"Select"**

### Step 3.3: Configure Deployment

**Deployment Tab:**

- **GitHub Actions settings**: We'll set this up later manually
- For now, select **"Disable"** or skip

**Networking Tab:**
- Leave defaults (public access)

**Monitoring Tab:**
- **Enable Application Insights**: **Yes** (recommended)
- **Application Insights Name**: `minescheduler-insights` (auto-generated)
- **Region**: Same as app

**Tags Tab:**
- Optionally add:
  - Key: `Environment`, Value: `Production`
  - Key: `Application`, Value: `MineScheduler`

### Step 3.4: Create the App Service

1. Click **"Review + create"**
2. Review all settings
3. Click **"Create"**
4. Wait 2-3 minutes for deployment
5. Click **"Go to resource"**

### Step 3.5: Get App Service URL

1. In the App Service overview page, you'll see:
   - **URL**: `https://minescheduler-app.azurewebsites.net`
2. **Copy this URL** - you'll need it for environment variables
3. Try clicking it - you'll see a default Azure page (your app isn't deployed yet)

---

## Part 4: Configuring Environment Variables

### Step 4.1: Navigate to Configuration

1. In your App Service, click **"Configuration"** in the left menu (under Settings)
2. You'll see tabs: **Application settings**, **Connection strings**, etc.
3. Click **"Application settings"** tab

### Step 4.2: Add Environment Variables

Click **"+ New application setting"** for each of these:

**1. NODE_ENV**
- **Name**: `NODE_ENV`
- **Value**: `production`
- Click **"OK"**

**2. PORT**
- **Name**: `PORT`
- **Value**: `8080`
- Note: Azure App Service uses port 8080 by default on Linux
- Click **"OK"**

**3. MONGO_URI**
- **Name**: `MONGO_URI`
- **Value**: `[Your Cosmos DB connection string from Step 1.5]`
- Example: `mongodb://minescheduler-db:[password]@minescheduler-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@minescheduler-db@`
- **CRITICAL**: Make sure to paste the complete connection string
- Click **"OK"**

**4. JWT_SECRET**
- **Name**: `JWT_SECRET`
- **Value**: Generate a strong random string (32+ characters)
- Example: `your_super_secure_random_jwt_secret_key_change_this_in_production_xyz123`
- You can generate one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Click **"OK"**

**5. JWT_EXPIRE**
- **Name**: `JWT_EXPIRE`
- **Value**: `30d`
- Click **"OK"**

**6. CLIENT_URL**
- **Name**: `CLIENT_URL`
- **Value**: `https://minescheduler-app.azurewebsites.net`
- Use your actual App Service URL
- Click **"OK"**

**7. WEBSITE_NODE_DEFAULT_VERSION** (Important for Azure)
- **Name**: `WEBSITE_NODE_DEFAULT_VERSION`
- **Value**: `20-lts` (or `18-lts` matching your choice)
- Click **"OK"**

**8. SCM_DO_BUILD_DURING_DEPLOYMENT** (Important for building)
- **Name**: `SCM_DO_BUILD_DURING_DEPLOYMENT`
- **Value**: `true`
- Click **"OK"**

### Step 4.3: Add OAuth Environment Variables (If Using)

If you're using Google OAuth:

**GOOGLE_CLIENT_ID**
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: `[Your Google OAuth Client ID]` (we'll get this in Part 7)
- Click **"OK"**

**GOOGLE_CLIENT_SECRET**
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: `[Your Google OAuth Client Secret]`
- Click **"OK"**

**GOOGLE_CALLBACK_URL**
- **Name**: `GOOGLE_CALLBACK_URL`
- **Value**: `https://minescheduler-app.azurewebsites.net/api/auth/google/callback`
- Click **"OK"**

If you're using Microsoft OAuth:

**MICROSOFT_CLIENT_ID**
- **Name**: `MICROSOFT_CLIENT_ID`
- **Value**: `[Your Microsoft OAuth Client ID]` (we'll get this in Part 7)
- Click **"OK"**

**MICROSOFT_CLIENT_SECRET**
- **Name**: `MICROSOFT_CLIENT_SECRET`
- **Value**: `[Your Microsoft OAuth Client Secret]`
- Click **"OK"**

**MICROSOFT_CALLBACK_URL**
- **Name**: `MICROSOFT_CALLBACK_URL`
- **Value**: `https://minescheduler-app.azurewebsites.net/api/auth/microsoft/callback`
- Click **"OK"**

### Step 4.4: Save Configuration

1. After adding all environment variables, click **"Save"** at the top
2. Click **"Continue"** on the warning dialog
3. The app will restart (takes 30-60 seconds)

### Step 4.5: Verify Configuration

1. Click **"Application settings"** again to verify all variables are there
2. You should see all the variables you added

---

## Part 5: Deploying the Application

You have multiple deployment options. Choose the one that works best for you.

### Option A: Deploy from GitHub (Recommended)

This sets up automatic deployment whenever you push to GitHub.

#### Step 5A.1: Push Code to GitHub

If not already done:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Azure deployment"

# Create repository on GitHub.com first, then:
git remote add origin https://github.com/[your-username]/minescheduler.git

# Push to GitHub
git push -u origin main
```

#### Step 5A.2: Set Up Deployment Center

1. In your App Service, click **"Deployment Center"** (left menu)
2. Under **"Source"**, select **"GitHub"**
3. Click **"Authorize"** to connect your GitHub account
4. Select:
   - **Organization**: Your GitHub username
   - **Repository**: `minescheduler` (or your repo name)
   - **Branch**: `main` (or `master`)
5. **Build Provider**: 
   - Select **"GitHub Actions"** (recommended)
   - This creates a workflow file automatically
6. Click **"Save"**

#### Step 5A.3: Configure GitHub Actions Workflow

Azure creates a workflow file automatically. Let's verify and customize it:

1. In GitHub, go to your repository
2. Navigate to `.github/workflows/` folder
3. You'll see a file like `main_minescheduler-app.yml`
4. Edit it to ensure it has the build step:

```yaml
name: Build and deploy Node.js app to Azure Web App

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js version
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm install

      - name: Install client dependencies and build
        run: |
          cd client
          npm install
          npm run build
          cd ..

      - name: Zip artifact for deployment
        run: zip -r release.zip . -x "*.git*" "node_modules/*" "client/node_modules/*"

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v3
        with:
          name: node-app
          path: release.zip

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v3
        with:
          name: node-app

      - name: Unzip artifact for deployment
        run: unzip release.zip

      - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'minescheduler-app'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_XXXXX }}
          package: .
```

5. Commit this file if you made changes
6. The workflow will trigger automatically

#### Step 5A.4: Monitor Deployment

1. In GitHub, go to **"Actions"** tab
2. You'll see the workflow running
3. Click on it to see progress
4. Wait 5-10 minutes for build and deployment
5. If successful, you'll see green checkmarks

### Option B: Deploy from Local Git

#### Step 5B.1: Set Up Local Git

1. In App Service, go to **"Deployment Center"**
2. Select **"Local Git"**
3. Click **"Save"**
4. Copy the **Git Clone Uri**: 
   - Example: `https://minescheduler-app.scm.azurewebsites.net:443/minescheduler-app.git`

#### Step 5B.2: Set Up Deployment Credentials

1. In Deployment Center, click **"Local Git/FTPS credentials"** tab
2. Under **"User scope"**:
   - **Username**: Create one (e.g., `minescheduler-deploy`)
   - **Password**: Create a strong password
   - **Confirm password**: Repeat
3. Click **"Save"**
4. **Save these credentials securely**

#### Step 5B.3: Add Azure Remote and Push

```bash
# Add Azure as a remote
git remote add azure https://minescheduler-app.scm.azurewebsites.net:443/minescheduler-app.git

# Build the client first
npm run build

# Commit the build
git add client/build
git commit -m "Add production build"

# Push to Azure
git push azure main

# Enter your deployment credentials when prompted
```

#### Step 5B.4: Monitor Deployment

You can watch the deployment progress in the terminal output.

### Option C: Deploy via VS Code

#### Step 5C.1: Install Azure Extension

1. Open VS Code
2. Install **"Azure App Service"** extension
3. Reload VS Code

#### Step 5C.2: Deploy

1. Click Azure icon in sidebar
2. Sign in to Azure
3. Find your App Service under your subscription
4. Right-click **"minescheduler-app"**
5. Click **"Deploy to Web App..."**
6. Select your project folder
7. Confirm deployment
8. Wait 5-10 minutes

### Option D: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Build the application
npm run build

# Create a zip file
zip -r deploy.zip . -x "*.git*" "node_modules/*" "client/node_modules/*"

# Deploy
az webapp deployment source config-zip --resource-group minescheduler-rg --name minescheduler-app --src deploy.zip
```

---

## Part 6: Post-Deployment Configuration

### Step 6.1: Verify Deployment

1. Go to your App Service URL: `https://minescheduler-app.azurewebsites.net`
2. You should see your React application loading
3. If you see an error page, proceed to troubleshooting

### Step 6.2: Check Application Logs

1. In App Service, go to **"Log stream"** (left menu under Monitoring)
2. You'll see real-time logs
3. Look for:
   - `Server running in production mode on port 8080`
   - `MongoDB Connected: minescheduler-db.mongo.cosmos.azure.com`
   - `Database Name: minescheduler`
   - `Default data initialization complete`
4. If you see errors, note them down for troubleshooting

### Step 6.3: Enable Detailed Logging

1. Go to **"App Service logs"** (left menu under Monitoring)
2. Enable:
   - **Application logging**: **File System** (Level: **Information**)
   - **Web server logging**: **File System**
   - **Detailed error messages**: **On**
   - **Failed request tracing**: **On**
3. Click **"Save"**

### Step 6.4: Configure Startup Command (If Needed)

If the app doesn't start:

1. Go to **"Configuration"** → **"General settings"** tab
2. **Startup Command**: Add `npm start`
3. Click **"Save"**
4. App will restart

### Step 6.5: Update Cosmos DB Firewall for App Service

If you used "Selected networks" for Cosmos DB:

1. Go to your **Cosmos DB account**
2. Click **"Networking"** (left menu)
3. Under **"Firewall"**, add Azure services:
   - Check **"Allow access from Azure Portal"**
   - Check **"Allow access from Azure datacenters"**
4. Or add specific IP:
   - Get your App Service outbound IP:
     - Go to App Service → **"Properties"**
     - Copy **"Outbound IP addresses"**
   - Add each IP to Cosmos DB firewall
5. Click **"Save"**

### Step 6.6: Test Health Endpoint

1. Visit: `https://minescheduler-app.azurewebsites.net/api/health`
2. You should see:
   ```json
   {
     "status": "success",
     "message": "Server is running",
     "environment": "production",
     "database": "connected"
   }
   ```
3. If you see this, backend is working!

### Step 6.7: Test Frontend

1. Visit: `https://minescheduler-app.azurewebsites.net`
2. You should see the MineScheduler login page
3. Try to register a new account to test database connectivity

---

## Part 7: Setting Up OAuth (Google & Microsoft)

### Setting Up Google OAuth

#### Step 7.1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

#### Step 7.2: Create a Project (If Needed)

1. Click project dropdown (top left)
2. Click **"New Project"**
3. **Project name**: `MineScheduler`
4. Click **"Create"**
5. Select the project

#### Step 7.3: Enable Google+ API

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it
4. Click **"Enable"**

#### Step 7.4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"**
3. Click **"Create"**
4. Fill in:
   - **App name**: `MineScheduler`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. **Scopes**: Click **"Add or Remove Scopes"**
   - Select: `email`, `profile`, `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**
7. **Test users** (optional): Add your email for testing
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

#### Step 7.5: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. **Application type**: **Web application**
4. **Name**: `MineScheduler Web Client`
5. **Authorized JavaScript origins**:
   - Add: `https://minescheduler-app.azurewebsites.net`
6. **Authorized redirect URIs**:
   - Add: `https://minescheduler-app.azurewebsites.net/api/auth/google/callback`
7. Click **"Create"**
8. **Copy the Client ID and Client Secret**
9. Click **"OK"**

#### Step 7.6: Add to Azure Environment Variables

1. Go back to Azure Portal → Your App Service → **"Configuration"**
2. Add/Update:
   - **GOOGLE_CLIENT_ID**: `[paste your Client ID]`
   - **GOOGLE_CLIENT_SECRET**: `[paste your Client Secret]`
3. Click **"Save"**
4. App will restart

### Setting Up Microsoft OAuth

#### Step 7.7: Go to Azure AD App Registrations

1. In Azure Portal, search for **"Azure Active Directory"**
2. Click on it
3. Click **"App registrations"** (left menu)
4. Click **"+ New registration"**

#### Step 7.8: Register Application

1. **Name**: `MineScheduler`
2. **Supported account types**: 
   - Select **"Accounts in any organizational directory and personal Microsoft accounts"**
3. **Redirect URI**:
   - Platform: **Web**
   - URI: `https://minescheduler-app.azurewebsites.net/api/auth/microsoft/callback`
4. Click **"Register"**

#### Step 7.9: Get Application Credentials

1. In the app overview page, copy:
   - **Application (client) ID** - This is your MICROSOFT_CLIENT_ID
   - **Directory (tenant) ID** (for reference)
2. Click **"Certificates & secrets"** (left menu)
3. Click **"+ New client secret"**
4. **Description**: `MineScheduler Secret`
5. **Expires**: Choose duration (24 months recommended)
6. Click **"Add"**
7. **IMMEDIATELY COPY THE SECRET VALUE** (under "Value" column)
   - This is your MICROSOFT_CLIENT_SECRET
   - You won't be able to see it again!

#### Step 7.10: Configure API Permissions

1. Click **"API permissions"** (left menu)
2. You should see **Microsoft Graph** with User.Read
3. Click **"Add a permission"**
4. Click **"Microsoft Graph"**
5. Click **"Delegated permissions"**
6. Select:
   - `email`
   - `profile`
   - `openid`
7. Click **"Add permissions"**
8. Click **"Grant admin consent for [your tenant]"** (if you have permission)
9. Click **"Yes"**

#### Step 7.11: Add to Azure Environment Variables

1. Go back to App Service → **"Configuration"**
2. Add/Update:
   - **MICROSOFT_CLIENT_ID**: `[paste your Application (client) ID]`
   - **MICROSOFT_CLIENT_SECRET**: `[paste your client secret value]`
   - **MICROSOFT_TENANT_ID**: `[paste your Directory (tenant) ID]` (if your app uses it)
3. Click **"Save"**
4. App will restart

---

## Part 8: Testing and Verification

### Step 8.1: Test User Registration

1. Go to your app URL
2. Click **"Register"** or **"Sign Up"**
3. Fill in the form:
   - Username
   - Email
   - Password
4. Submit
5. You should be logged in or see success message

### Step 8.2: Test User Login

1. Log out if needed
2. Click **"Login"**
3. Enter credentials
4. Submit
5. You should be redirected to dashboard

### Step 8.3: Test Google OAuth

1. Log out
2. Click **"Sign in with Google"** button
3. Select your Google account
4. Grant permissions
5. You should be logged in

### Step 8.4: Test Microsoft OAuth

1. Log out
2. Click **"Sign in with Microsoft"** button
3. Select your Microsoft account
4. Grant permissions
5. You should be logged in

### Step 8.5: Test Core Functionality

Test each major feature:
- [ ] User management
- [ ] Task creation
- [ ] Schedule management
- [ ] Equipment management
- [ ] Dashboard views
- [ ] Reports
- [ ] Settings

### Step 8.6: Test on Different Devices

- [ ] Desktop browser (Chrome, Firefox, Edge, Safari)
- [ ] Mobile browser (iOS Safari, Android Chrome)
- [ ] Tablet

### Step 8.7: Performance Check

1. Use browser DevTools
2. Check Network tab for:
   - Slow loading resources
   - Failed requests
   - Large bundle sizes
3. Check Console for errors

---

## Part 9: Setting Up Custom Domain (Optional)

### Step 9.1: Purchase Domain

Purchase a domain from:
- GoDaddy
- Namecheap
- Google Domains
- Azure App Service Domains
- Any other registrar

Example: `minescheduler.com`

### Step 9.2: Add Custom Domain to App Service

1. In App Service, click **"Custom domains"** (left menu)
2. Click **"+ Add custom domain"**
3. **Domain provider**: Select your provider or **"All other domain services"**
4. **TLS/SSL certificate**: We'll add later
5. **Domain**: Enter your domain (e.g., `minescheduler.com` or `www.minescheduler.com`)
6. Click **"Validate"**
7. You'll see DNS records to add:
   - **TXT record** for verification
   - **A record** or **CNAME record** for routing

### Step 9.3: Configure DNS Records

1. Log in to your domain registrar
2. Find DNS management section
3. Add the records shown in Azure:

**For root domain (minescheduler.com):**
- **TXT Record**:
  - Name: `@` or `asuid`
  - Value: `[verification code from Azure]`
- **A Record**:
  - Name: `@`
  - Value: `[IP address from Azure]`

**For subdomain (www.minescheduler.com):**
- **TXT Record**:
  - Name: `asuid.www`
  - Value: `[verification code from Azure]`
- **CNAME Record**:
  - Name: `www`
  - Value: `minescheduler-app.azurewebsites.net`

4. Save DNS records
5. **Wait 15 minutes to 48 hours** for DNS propagation

### Step 9.4: Verify Domain in Azure

1. Return to Azure App Service → **"Custom domains"**
2. Click **"Validate"** again
3. If DNS has propagated, validation will succeed
4. Click **"Add"**
5. Domain is now added (but not secure yet)

### Step 9.5: Add SSL Certificate

**Option A: Free Azure Managed Certificate (Recommended)**

1. In **"Custom domains"**, find your domain
2. Click **"Add binding"**
3. **TLS/SSL Type**: **Managed Certificate**
4. Click **"Add binding"**
5. Azure will automatically create and bind a free SSL certificate
6. Wait 5-10 minutes for provisioning
7. Your domain is now secure (HTTPS)!

**Option B: Upload Your Own Certificate**

1. Purchase SSL certificate from provider
2. Download certificate files
3. In App Service, go to **"TLS/SSL settings"**
4. Click **"Private Key Certificates (.pfx)"** tab
5. Click **"Upload certificate"**
6. Select your .pfx file and enter password
7. Click **"Upload"**
8. Go back to **"Custom domains"**
9. Click **"Add binding"** on your domain
10. Select your uploaded certificate
11. Click **"Add binding"**

### Step 9.6: Enforce HTTPS

1. Go to **"TLS/SSL settings"**
2. Under **"HTTPS Only"**, toggle **"On"**
3. This redirects all HTTP traffic to HTTPS

### Step 9.7: Update Environment Variables

1. Go to **"Configuration"**
2. Update **CLIENT_URL** to your custom domain:
   - Old: `https://minescheduler-app.azurewebsites.net`
   - New: `https://minescheduler.com`
3. Click **"Save"**

### Step 9.8: Update OAuth Redirect URIs

**For Google OAuth:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add to **Authorized JavaScript origins**:
   - `https://minescheduler.com`
4. Add to **Authorized redirect URIs**:
   - `https://minescheduler.com/api/auth/google/callback`
5. Save

**For Microsoft OAuth:**
1. Go to Azure AD App Registrations
2. Select your app
3. Go to **"Authentication"**
4. Add redirect URI:
   - `https://minescheduler.com/api/auth/microsoft/callback`
5. Save

### Step 9.9: Test Custom Domain

1. Visit your custom domain: `https://minescheduler.com`
2. Verify SSL certificate (lock icon in browser)
3. Test all functionality
4. Test OAuth login flows

---

## Part 10: Monitoring and Maintenance

### Step 10.1: Set Up Application Insights

If not already enabled:

1. In App Service, go to **"Application Insights"** (left menu under Settings)
2. Click **"Turn on Application Insights"**
3. Or create new one
4. Click **"Apply"**

### Step 10.2: Monitor Performance

1. Go to **Application Insights** resource
2. Explore:
   - **Performance**: Page load times, server response times
   - **Failures**: Failed requests, exceptions
   - **Users**: Active users, sessions
   - **Page views**: Most visited pages

### Step 10.3: Set Up Alerts

1. In App Service or Application Insights, click **"Alerts"** (left menu)
2. Click **"+ Create"** → **"Alert rule"**
3. Configure alert for:
   - **High CPU usage** (> 80%)
   - **High memory usage** (> 80%)
   - **HTTP 5xx errors** (> 10 in 5 minutes)
   - **Response time** (> 5 seconds)
4. **Actions**: Add action group to send email/SMS
5. Click **"Create alert rule"**

### Step 10.4: Enable Automatic Backups (Optional)

1. In App Service, go to **"Backups"** (left menu)
2. Click **"Configure"**
3. Requires Standard tier or higher
4. Configure:
   - **Storage account**: Create or select
   - **Schedule**: Daily or custom
   - **Retention**: Number of days
   - **Database**: Include Cosmos DB connection string
5. Click **"Save"**

### Step 10.5: Set Up Scaling Rules

**Automatic Scaling (Requires Standard tier or higher):**

1. In App Service, go to **"Scale out (App Service plan)"**
2. Click **"Custom autoscale"**
3. Add rules:
   - Scale out when CPU > 70%
   - Scale in when CPU < 30%
   - Min instances: 1
   - Max instances: 3
4. Click **"Save"**

**Manual Scaling (All tiers):**

1. In App Service plan, go to **"Scale up (App Service plan)"**
2. Select higher tier for more resources
3. Click **"Apply"**

### Step 10.6: Monitor Cosmos DB

1. Go to Cosmos DB account
2. Click **"Metrics"** (left menu)
3. Monitor:
   - **Request Units (RU/s)**: Database throughput
   - **Storage**: Database size
   - **Throttled requests**: If high, increase RU/s
4. Set up alerts similar to App Service

### Step 10.7: Regular Maintenance Tasks

**Weekly:**
- [ ] Review logs for errors
- [ ] Check application performance metrics
- [ ] Monitor database storage usage

**Monthly:**
- [ ] Review and optimize database queries
- [ ] Check for outdated npm packages
- [ ] Review security advisories
- [ ] Test backups if configured

**Quarterly:**
- [ ] Review and optimize costs
- [ ] Update dependencies
- [ ] Review and update OAuth credentials expiry
- [ ] Performance optimization

---

## Troubleshooting

### Issue 1: Application Not Starting

**Symptoms:** 
- 503 Service Unavailable
- Application Error page

**Solutions:**

1. **Check Logs:**
   ```
   App Service → Log stream
   Look for startup errors
   ```

2. **Verify Environment Variables:**
   ```
   Configuration → Application settings
   Ensure all required variables are set
   ```

3. **Check Startup Command:**
   ```
   Configuration → General settings → Startup Command
   Should be: npm start
   ```

4. **Verify package.json:**
   ```
   "start": "node server.js"
   ```

5. **Check Node Version:**
   ```
   Configuration → General settings → Stack settings
   Should match your local version
   ```

### Issue 2: Database Connection Errors

**Symptoms:**
- MongoDB connection failed
- Database errors in logs

**Solutions:**

1. **Verify Connection String:**
   ```
   Check MONGO_URI in Configuration
   Test connection string format
   ```

2. **Check Cosmos DB Firewall:**
   ```
   Cosmos DB → Networking
   Allow Azure services
   Or add App Service outbound IPs
   ```

3. **Verify Cosmos DB is Running:**
   ```
   Cosmos DB → Overview
   Status should be "Online"
   ```

4. **Test Connection from App Service Console:**
   ```
   App Service → Console (Advanced Tools)
   Run: node
   Then: require('mongoose').connect(process.env.MONGO_URI)
   ```

### Issue 3: React App Not Loading

**Symptoms:**
- Blank page
- 404 for static files
- Cannot GET /

**Solutions:**

1. **Verify Build Completed:**
   ```
   Check deployment logs
   Look for "npm run build" success
   ```

2. **Check Build Directory:**
   ```
   App Service → Advanced Tools → Kudu
   Browse to: /home/site/wwwroot/client/build
   Should contain index.html, static/
   ```

3. **Verify server.js Production Config:**
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     app.use(express.static(path.join(__dirname, 'client/build')));
   }
   ```

4. **Check NODE_ENV:**
   ```
   Configuration → Application settings
   NODE_ENV should be "production"
   ```

### Issue 4: OAuth Login Not Working

**Symptoms:**
- OAuth redirect fails
- "Redirect URI mismatch" error
- OAuth callback errors

**Solutions:**

1. **Verify Redirect URIs:**
   ```
   Google/Microsoft OAuth settings
   Must exactly match: https://your-domain.com/api/auth/provider/callback
   ```

2. **Check Environment Variables:**
   ```
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
   GOOGLE_CALLBACK_URL, MICROSOFT_CALLBACK_URL
   ```

3. **Verify OAuth Credentials:**
   ```
   Regenerate secrets if needed
   Check expiration dates
   ```

4. **Test OAuth URLs:**
   ```
   Visit: https://your-app.com/api/auth/google
   Should redirect to Google login
   ```

### Issue 5: CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors in browser
- API calls failing from frontend

**Solutions:**

1. **Update Allowed Origins in server.js:**
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     process.env.CLIENT_URL,
     'https://your-actual-domain.com'
   ].filter(Boolean);
   ```

2. **Set CLIENT_URL Environment Variable:**
   ```
   CLIENT_URL=https://minescheduler-app.azurewebsites.net
   ```

3. **Restart App Service**

### Issue 6: High CPU/Memory Usage

**Symptoms:**
- Slow response times
- App crashes
- Timeout errors

**Solutions:**

1. **Scale Up App Service:**
   ```
   Scale up to higher tier (B2, P1V2, etc.)
   ```

2. **Enable Autoscaling:**
   ```
   Scale out with autoscale rules
   ```

3. **Optimize Code:**
   - Check for memory leaks
   - Optimize database queries
   - Add caching

4. **Monitor with Application Insights:**
   ```
   Identify slow endpoints
   Optimize bottlenecks
   ```

### Issue 7: Deployment Fails

**Symptoms:**
- GitHub Actions fails
- Build errors
- Deployment errors

**Solutions:**

1. **Check Build Logs:**
   ```
   GitHub Actions → Failed workflow → View logs
   Look for specific error messages
   ```

2. **Verify Build Command:**
   ```
   Should run: npm install && cd client && npm install && npm run build
   ```

3. **Check Dependencies:**
   ```
   Ensure all dependencies in package.json
   No missing peer dependencies
   ```

4. **Test Build Locally:**
   ```bash
   npm install
   cd client && npm install && npm run build
   ```

5. **Check Deployment Credentials:**
   ```
   Deployment Center → Verify connection
   Regenerate publish profile if needed
   ```

### Issue 8: SSL/HTTPS Issues

**Symptoms:**
- Certificate errors
- "Not Secure" warning
- Mixed content errors

**Solutions:**

1. **Enable HTTPS Only:**
   ```
   TLS/SSL settings → HTTPS Only: On
   ```

2. **Verify SSL Binding:**
   ```
   Custom domains → Check binding status
   Should show lock icon
   ```

3. **Fix Mixed Content:**
   ```
   Ensure all API calls use HTTPS
   Update hardcoded HTTP URLs to HTTPS
   ```

4. **Regenerate Certificate (if expired):**
   ```
   Custom domains → Remove binding → Add new binding
   ```

### Issue 9: Application is Slow

**Symptoms:**
- Long load times
- API requests timeout
- Poor user experience

**Solutions:**

1. **Enable Application Insights:**
   ```
   Identify slow operations
   ```

2. **Optimize Database:**
   - Add indexes to frequently queried fields
   - Increase Cosmos DB RU/s if serverless
   - Use projection to return only needed fields

3. **Add Caching:**
   - Implement Redis cache for frequent queries
   - Add browser caching headers

4. **Optimize React Build:**
   - Enable code splitting
   - Lazy load components
   - Optimize bundle size

5. **Use CDN (Advanced):**
   - Azure CDN for static assets
   - Reduce server load

### Getting More Help

**Azure Support:**
- Azure Portal → Support + troubleshooting → New support request
- Documentation: https://docs.microsoft.com/azure/app-service/

**Application Logs:**
- App Service → Log stream (real-time)
- App Service → Logs → Download logs

**Community Resources:**
- Stack Overflow: [azure-web-app-service] tag
- GitHub Issues (for dependency issues)
- Azure Community Forums

---

## Cost Estimation

### Monthly Cost Breakdown (USD)

**Development/Testing Environment:**
- App Service (B1 Basic): $13/month
- Cosmos DB (Serverless): $1-10/month (based on usage)
- Application Insights: Free tier (5GB included)
- **Total: ~$14-23/month**

**Small Production Environment:**
- App Service (B2 Basic): $38/month
- Cosmos DB (Serverless): $10-30/month
- Application Insights: Free tier or $2-5/month
- **Total: ~$50-73/month**

**Medium Production Environment:**
- App Service (P1V2): $88/month
- Cosmos DB (Provisioned 400 RU/s): $24/month
- Application Insights: $10/month
- **Total: ~$122/month**

**Large Production Environment:**
- App Service (P2V2): $176/month
- Cosmos DB (Provisioned 1000 RU/s): $58/month
- Application Insights: $20/month
- Redis Cache (Basic): $16/month
- **Total: ~$270/month**

### Cost Optimization Tips

1. **Use Serverless Cosmos DB** for variable workloads
2. **Start with B1 tier** and scale as needed
3. **Use Azure Free Credits** ($200 for new accounts)
4. **Enable autoscale** to scale down during low usage
5. **Monitor usage** and adjust accordingly
6. **Delete unused resources** promptly
7. **Use reserved instances** for predictable workloads (save up to 30%)

### Free Tier Limitations

**App Service F1 Free (Not recommended for production):**
- ❌ Limited compute (60 minutes/day)
- ❌ App sleeps after 20 minutes of inactivity
- ❌ No custom domains
- ❌ No SSL
- ❌ No autoscaling
- ✅ Good for testing only

**Better choice: B1 Basic for production**

---

## Next Steps After Deployment

### Immediate (Week 1)
- [ ] Verify all functionality works
- [ ] Test on multiple devices
- [ ] Set up monitoring and alerts
- [ ] Document any custom configurations
- [ ] Share app URL with stakeholders

### Short Term (Month 1)
- [ ] Monitor performance and costs
- [ ] Set up regular backups
- [ ] Configure custom domain (if needed)
- [ ] Implement CI/CD pipeline improvements
- [ ] Gather user feedback

### Long Term (Ongoing)
- [ ] Regular security updates
- [ ] Performance optimization
- [ ] Feature enhancements
- [ ] Scale as needed
- [ ] Cost optimization

---

## Conclusion

You've successfully deployed MineScheduler to Azure! 🎉

**Your application is now:**
- ✅ Hosted on Azure App Service
- ✅ Connected to Azure Cosmos DB (MongoDB)
- ✅ Secured with HTTPS
- ✅ Monitored with Application Insights
- ✅ Configured with OAuth authentication
- ✅ Ready for production use

**Key URLs to Save:**
- Application: `https://minescheduler-app.azurewebsites.net`
- Azure Portal: `https://portal.azure.com`
- Health Check: `https://minescheduler-app.azurewebsites.net/api/health`

**Important Credentials to Secure:**
- Cosmos DB Connection String
- JWT Secret
- OAuth Client Secrets
- Deployment Credentials

### Support and Feedback

If you encounter issues not covered in this guide:
1. Check Application Insights for detailed errors
2. Review Log Stream for real-time logs
3. Consult Azure documentation
4. Reach out to Azure support

**Happy Mining! ⛏️**

---

## Appendix: Quick Reference Commands

### Azure CLI Commands

```bash
# Login
az login

# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "subscription-name"

# Create resource group
az group create --name minescheduler-rg --location eastus

# Create App Service Plan
az appservice plan create --name minescheduler-plan --resource-group minescheduler-rg --sku B1 --is-linux

# Create Web App
az webapp create --name minescheduler-app --resource-group minescheduler-rg --plan minescheduler-plan --runtime "NODE|20-lts"

# Set environment variables
az webapp config appsettings set --name minescheduler-app --resource-group minescheduler-rg --settings NODE_ENV=production

# Deploy from local git
az webapp deployment source config-local-git --name minescheduler-app --resource-group minescheduler-rg

# View logs
az webapp log tail --name minescheduler-app --resource-group minescheduler-rg

# Restart app
az webapp restart --name minescheduler-app --resource-group minescheduler-rg
```

### Useful URLs

- **Azure Portal**: https://portal.azure.com
- **Azure Status**: https://status.azure.com
- **Azure Pricing Calculator**: https://azure.microsoft.com/pricing/calculator/
- **Azure Documentation**: https://docs.microsoft.com/azure/
- **Kudu (Advanced Tools)**: https://minescheduler-app.scm.azurewebsites.net

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-30  
**Author:** MineScheduler Team  
**Next Review:** Before each deployment
