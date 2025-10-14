import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Badge } from 'antd';
import { BellOutlined, LogoutOutlined } from '@ant-design/icons';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  AuditOutlined,
  ToolOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { generateAvatar, getInitials } from '../utils/avatarUtils';
import './Sidebar.css';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    // Main Dashboard
    { key: 'home', icon: <HomeOutlined />, label: 'Home', path: '/dashboard' },
    
    // Core Scheduling
    { key: 'schedule', icon: <CalendarOutlined />, label: 'Schedule', path: '/schedule' },
    { key: 'tasks', icon: <FileTextOutlined />, label: 'Tasks', path: '/tasks' },
    { key: 'delays', icon: <ClockCircleOutlined />, label: 'Delays', path: '/delays' },
    
    // Resources
    { key: 'sites', icon: <EnvironmentOutlined />, label: 'Sites', path: '/sites' },
    { key: 'equipment', icon: <ToolOutlined />, label: 'Equipment', path: '/equipment' },
    
    // Analysis & Configuration
    { key: 'reports', icon: <BarChartOutlined />, label: 'Reports', path: '/reports' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' },
    
    // Admin Only
    { key: 'users', icon: <UserOutlined />, label: 'Users', path: '/users', adminOnly: true },
    { key: 'audit', icon: <AuditOutlined />, label: 'Audit', path: '/audit', adminOnly: true },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin';
    }
    return true;
  });

  const isActive = (path) => location.pathname === path;

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Profile Section */}
        <div className="sidebar-mobile-profile">
          <Avatar 
            size={56}
            src={generateAvatar(user)}
            style={{ backgroundColor: '#062d54', color: '#ffffff' }}
          >
            {!generateAvatar(user) && getInitials(user?.name)}
          </Avatar>
          <div className="mobile-profile-info">
            <div className="mobile-profile-name">{user?.name || 'User'}</div>
            <div className="mobile-profile-email">{user?.email || ''}</div>
            <div className="mobile-profile-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
          </div>
          <div className="mobile-profile-actions">
            <Badge count={0} showZero={false}>
              <BellOutlined className="mobile-notification-icon" />
            </Badge>
          </div>
        </div>

        <div className="sidebar-divider" />
      <div className="sidebar-logo">
        <div className="logo-icon" onClick={() => navigate('/dashboard')}>M</div>
      </div>

      <div className="sidebar-menu">
        {visibleMenuItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleMenuItemClick(item.path)}
            data-tooltip={item.label}
          >
            <div className="menu-icon">{item.icon}</div>
            <span className="custom-tooltip">{item.label}</span>
            <span className="mobile-label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Mobile Logout Button */}
      <div className="sidebar-mobile-logout">
        <button className="mobile-logout-btn" onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
