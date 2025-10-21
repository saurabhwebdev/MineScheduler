import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { notification } from 'antd';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ComingSoon from './pages/ComingSoon';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import UserManagement from './pages/UserManagement';
import Tasks from './pages/Tasks';
import Delays from './pages/Delays';
import Sites from './pages/Sites';
import Equipment from './pages/Equipment';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Audit from './pages/Audit';
import PasswordResetModal from './components/PasswordResetModal';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    notification.error({
      message: 'Access Denied',
      description: 'You do not have permission to access this page',
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  const { mustResetPassword, updateUserData, user } = useAuth();

  const handlePasswordResetSuccess = () => {
    // Update user data to remove mustResetPassword flag
    const updatedUser = { ...user, mustResetPassword: false };
    updateUserData(updatedUser);
    notification.success({
      message: 'Password Reset Successful',
      description: 'Your password has been updated. You can now access the system.',
    });
  };

  return (
    <>
      {mustResetPassword && (
        <PasswordResetModal onSuccess={handlePasswordResetSuccess} />
      )}
      <div className="App">
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><ComingSoon /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
            <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/delays" element={<PrivateRoute><Delays /></PrivateRoute>} />
            <Route path="/sites" element={<PrivateRoute><Sites /></PrivateRoute>} />
            <Route path="/equipment" element={<PrivateRoute><Equipment /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/audit" element={<AdminRoute><Audit /></AdminRoute>} />
            <Route path="/help" element={<PrivateRoute><Help /></PrivateRoute>} />
          </Routes>
      </div>
    </>
  );
}

function App() {
  useEffect(() => {
    // Configure notifications globally for bottom-right positioning
    notification.config({
      placement: 'bottomRight',
      duration: 3,
      maxCount: 3,
    });
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
