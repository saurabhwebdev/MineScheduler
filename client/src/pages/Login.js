import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Divider } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getFirstPermittedRoute } from '../utils/routePermissions';
import config from '../config/config';
import './Auth.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Explicit SSO check
  const showSSO = config.sso?.enabled === true && Array.isArray(config.sso?.providers) && config.sso.providers.length > 0;

  useEffect(() => {
    // Preload optimized image
    const img = new Image();
    img.src = '/authimage.webp';
    img.onload = () => setImageLoaded(true);
    // Fallback to PNG if WebP not supported
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = '/authimage-optimized.png';
      fallbackImg.onload = () => setImageLoaded(true);
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Call backend API
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const { token, user } = data.data;
        login(user, token);
        notification.success({ message: 'Login successful!', description: 'Welcome back to Mine Scheduler' });
        
        // Redirect to first permitted route based on user's permissions
        const firstRoute = getFirstPermittedRoute(user);
        navigate(firstRoute);
      } else {
        notification.error({ message: 'Login Failed', description: data.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      notification.error({ message: 'Network Error', description: 'Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = (provider) => {
    // Redirect to backend OAuth route
    window.location.href = `${config.apiUrl}/auth/${provider}`;
  };

  return (
    <div className="auth-container">
      {/* Left Side - Auth Image */}
      <motion.div 
        className="auth-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-image-container">
          {!imageLoaded && <div className="auth-image-skeleton" />}
          <picture>
            <source srcSet="/authimage.webp" type="image/webp" />
            <img 
              src="/authimage-optimized.png" 
              alt="Mine Scheduler" 
              className={`auth-image ${imageLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </picture>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        className="auth-right"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-form-container">
          {/* Logo/Brand */}
          <div className="brand-section">
            <img 
              src="/logo.png" 
              alt="Mine Scheduler Logo" 
              className="brand-logo"
            />
          </div>

          {/* Welcome Text */}
          <div className="welcome-section">
            <Title level={3} className="welcome-title">
              Welcome to Mine Scheduler
            </Title>
            <Text className="welcome-subtitle">
              Login with your credentials to get started
            </Text>
          </div>

          {/* Login Form */}
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            className="auth-form"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />}
                placeholder="Enter your email" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
                className="login-button"
              >
                Login
              </Button>
            </Form.Item>

            {/* SSO Buttons */}
            {showSSO && (
              <>
                <Divider plain style={{ fontSize: '13px', color: '#8c8c8c' }}>Or continue with</Divider>
                <div className="sso-buttons">
                  {config.sso.providers.includes('google') && (
                    <Button
                      className="sso-btn google-btn"
                      size="large"
                      onClick={() => handleSSOLogin('google')}
                      icon={<GoogleOutlined />}
                    >
                      Google
                    </Button>
                  )}
                  {config.sso.providers.includes('microsoft') && (
                    <Button
                      className="sso-btn microsoft-btn"
                      size="large"
                      onClick={() => handleSSOLogin('microsoft')}
                    >
                      <span style={{ marginRight: '8px' }}>🪟</span> Microsoft
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="register-link">
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
