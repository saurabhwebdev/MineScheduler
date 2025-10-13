import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notification } from 'antd';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        notification.error({
          message: 'Authentication Failed',
          description: `Failed to authenticate with ${provider || 'SSO provider'}`,
        });
        navigate('/login');
        return;
      }

      if (!token) {
        notification.error({
          message: 'Authentication Error',
          description: 'No authentication token received',
        });
        navigate('/login');
        return;
      }

      try {
        // Fetch user data with token
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          // Login user with token and user data
          login(data.data.user, token);
          notification.success({
            message: 'Login Successful',
            description: `Welcome back! You're logged in via ${provider}`,
          });
          navigate('/dashboard');
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        notification.error({
          message: 'Authentication Error',
          description: 'Failed to complete authentication',
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#062d54' }}>Completing authentication...</h2>
        <p style={{ color: '#8c8c8c' }}>Please wait</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
