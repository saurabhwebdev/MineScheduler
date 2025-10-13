# SSO Authentication Setup Guide

## Overview
Mine Scheduler supports Single Sign-On (SSO) authentication via Google and Microsoft OAuth providers. This allows users to log in using their existing Google or Microsoft accounts.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Google OAuth Setup](#google-oauth-setup)
- [Microsoft OAuth Setup](#microsoft-oauth-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Google OAuth 2.0** - Sign in with Google
- **Microsoft OAuth 2.0** - Sign in with Microsoft/Azure AD
- **Fallback to traditional auth** - Email/password still works
- **Auto user creation** - New users are created automatically on first SSO login
- **Role assignment** - Default role: `user` (can be changed by admin)

---

## Prerequisites

- Mine Scheduler application set up and running
- Access to Google Cloud Console (for Google OAuth)
- Access to Azure Portal (for Microsoft OAuth)
- Server and client `.env` files configured

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name your project (e.g., "MineScheduler")
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields:
   - App name: **Mine Scheduler**
   - User support email: **your-email@example.com**
   - Developer contact email: **your-email@example.com**
4. Click "Save and Continue"
5. Skip "Scopes" (default scopes are sufficient)
6. Add test users if needed
7. Click "Save and Continue"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: **MineScheduler Web Client**
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   https://your-api-domain.com/api/auth/google/callback
   ```
7. Click "Create"
8. **Copy Client ID and Client Secret** - You'll need these!

### Step 5: Update Environment Variables

Update `server/.env`:
```env
ENABLE_SSO=true
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Update `client/.env`:
```env
REACT_APP_ENABLE_SSO=true
REACT_APP_SSO_PROVIDERS=google,microsoft
```

---

## Microsoft OAuth Setup

### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory"
3. Go to "App registrations" > "New registration"
4. Fill in details:
   - Name: **Mine Scheduler**
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web** - `http://localhost:5000/api/auth/microsoft/callback`
5. Click "Register"

### Step 2: Create Client Secret

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Description: **MineScheduler Production**
4. Expires: **24 months** (or your preference)
5. Click "Add"
6. **Copy the secret value immediately** - You can't see it again!

### Step 3: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add these permissions:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
6. Click "Add permissions"
7. Click "Grant admin consent" (if you're admin)

### Step 4: Update Environment Variables

Update `server/.env`:
```env
ENABLE_SSO=true
MICROSOFT_CLIENT_ID=your-microsoft-application-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback
```

Update `client/.env`:
```env
REACT_APP_ENABLE_SSO=true
REACT_APP_SSO_PROVIDERS=google,microsoft
```

---

## Configuration

### Full Server Configuration (`.env`)

```env
# SSO Configuration
ENABLE_SSO=true

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=your~microsoft~secret~here
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback
```

### Full Client Configuration (`.env`)

```env
REACT_APP_ENABLE_SSO=true
REACT_APP_SSO_PROVIDERS=google,microsoft
```

### Enable Only One Provider

**Google Only:**
```env
REACT_APP_SSO_PROVIDERS=google
```

**Microsoft Only:**
```env
REACT_APP_SSO_PROVIDERS=microsoft
```

---

## Testing

### 1. Restart Services

```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm start
```

### 2. Test SSO Login

1. Navigate to `http://localhost:3000/login`
2. You should see SSO buttons (Google/Microsoft)
3. Click "Sign in with Google" or "Sign in with Microsoft"
4. Authorize the application
5. You should be redirected back and logged in

### 3. Verify User Creation

1. Log in as admin
2. Go to Users page
3. You should see the new SSO user listed

---

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google/Microsoft"
2. User is redirected to OAuth provider
3. User authorizes the application
4. Provider redirects back with authorization code
5. Backend exchanges code for user profile
6. Backend checks if user exists:
   - **Exists**: Log in user
   - **New**: Create user account automatically
7. Backend generates JWT token
8. Frontend stores token and redirects to dashboard

### User Data Mapping

**From Google:**
- Email → user.email
- Name → user.name
- Google ID → stored for future logins
- Default role: `user`

**From Microsoft:**
- Email → user.email
- Display Name → user.name
- Microsoft ID → stored for future logins
- Default role: `user`

---

## Troubleshooting

### Common Issues

#### 1. "Redirect URI mismatch" Error

**Solution:**
- Verify redirect URI in OAuth provider matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

#### 2. SSO Buttons Not Showing

**Solution:**
- Verify `REACT_APP_ENABLE_SSO=true` in client `.env`
- Check `REACT_APP_SSO_PROVIDERS` includes the provider
- Restart frontend development server

#### 3. "Invalid client" Error

**Solution:**
- Double-check Client ID and Client Secret
- Ensure no extra spaces in `.env` file
- Verify credentials are for the correct environment

#### 4. User Created But Can't Log In Again

**Solution:**
- Check if email matches exactly
- Verify OAuth provider returns consistent user ID
- Check database for duplicate users

#### 5. CORS Errors

**Solution:**
- Add OAuth provider domains to CORS whitelist
- Verify `CLIENT_URL` in server `.env`

### Debug Mode

Enable detailed logging in server:

```javascript
// In auth routes
console.log('OAuth Profile:', profile);
console.log('User Created:', user);
```

---

## Production Deployment

### Update Redirect URIs

1. **Google Cloud Console:**
   - Add production domain: `https://app.yourdomain.com`
   - Add production callback: `https://api.yourdomain.com/api/auth/google/callback`

2. **Azure Portal:**
   - Add production redirect: `https://api.yourdomain.com/api/auth/microsoft/callback`

### Update Environment Variables

**Server (Production):**
```env
ENABLE_SSO=true
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
MICROSOFT_CALLBACK_URL=https://api.yourdomain.com/api/auth/microsoft/callback
```

**Client (Production):**
```env
REACT_APP_ENABLE_SSO=true
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## Security Best Practices

- ✅ **Never commit** `.env` files to version control
- ✅ **Rotate secrets** periodically (every 6-12 months)
- ✅ **Use HTTPS** in production
- ✅ **Limit OAuth scopes** to minimum required
- ✅ **Monitor OAuth usage** in provider dashboards
- ✅ **Implement rate limiting** on auth endpoints
- ✅ **Log authentication attempts** for security audit

---

## Support

For SSO setup issues:
- Check provider documentation: [Google](https://developers.google.com/identity/protocols/oauth2) | [Microsoft](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- Review application logs
- Verify all configuration steps completed
- Contact support team

---

**Last Updated:** 2025-10-10
**Version:** 1.0.0
