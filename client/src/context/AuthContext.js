import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustResetPassword, setMustResetPassword] = useState(false);

  useEffect(() => {
    // Check if user is logged in (check localStorage for token)
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setMustResetPassword(parsedUser.mustResetPassword || false);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setMustResetPassword(userData.mustResetPassword || false);
  };

  const updateUserData = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setMustResetPassword(userData.mustResetPassword || false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMustResetPassword(false);
  };

  const value = {
    user,
    login,
    logout,
    updateUserData,
    loading,
    isAuthenticated: !!user,
    mustResetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
