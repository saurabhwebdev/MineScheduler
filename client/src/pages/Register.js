import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import './Auth.css';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = values;
      
      // Call backend API
      const response = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const { token, user } = data.data;
        login(user, token);
        notification.success({ message: 'Registration Successful!', description: 'Welcome to Mine Scheduler!' });
        navigate('/dashboard');
      } else {
        notification.error({ message: 'Registration Failed', description: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      notification.error({ message: 'Network Error', description: 'Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
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
          <img src="/authimage.png" alt="Mine Scheduler" className="auth-image" />
        </div>
      </motion.div>

      {/* Right Side - Register Form */}
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
              Create Your Account
            </Title>
            <Text className="welcome-subtitle">
              Register to get started with Mine Scheduler
            </Text>
          </div>

          {/* Register Form */}
          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            className="auth-form"
          >
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="Enter your full name" 
                size="large"
              />
            </Form.Item>

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
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
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
                Register
              </Button>
            </Form.Item>

            <div className="register-link">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
