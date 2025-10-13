// Centralized configuration
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  env: process.env.REACT_APP_ENV || 'development',
  isDevelopment: process.env.REACT_APP_ENV === 'development',
  isProduction: process.env.REACT_APP_ENV === 'production',
  // SSO Configuration
  sso: {
    enabled: process.env.REACT_APP_ENABLE_SSO === 'true',
    providers: (process.env.REACT_APP_SSO_PROVIDERS || '').split(',').filter(Boolean),
  },
};

export default config;
