// Centralized configuration
const config = {
  // In production, use relative path (/api) which will use the same domain
  // In development, use localhost:5000
  apiUrl: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api'),
  env: process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  // SSO Configuration
  sso: {
    enabled: process.env.REACT_APP_ENABLE_SSO === 'true',
    providers: (process.env.REACT_APP_SSO_PROVIDERS || '').split(',').filter(Boolean),
  },
};

export default config;
