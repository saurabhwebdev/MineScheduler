import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  AuditOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  QuestionCircleOutlined
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
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' },
    { key: 'help', icon: <QuestionCircleOutlined />, label: 'Help', path: '/help' },
    
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
        {/* Desktop Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon" onClick={() => navigate('/dashboard')}>M</div>
        </div>

        {/* Mobile Header */}
        <div className="sidebar-mobile-header">
          <div className="mobile-brand">
            <div className="mobile-brand-icon">M</div>
            <div className="mobile-brand-text">
              <div className="mobile-brand-name">MineScheduler</div>
              <div className="mobile-brand-tagline">Scheduling System</div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
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

        {/* Mobile Footer - Profile & Logout */}
        <div className="sidebar-mobile-footer">
          <div className="mobile-profile-section">
            <div className="mobile-profile-content" onClick={() => navigate('/profile')}>
              <Avatar 
                size={40}
                src={generateAvatar(user)}
                style={{ backgroundColor: '#3cca70', color: '#ffffff' }}
              >
                {!generateAvatar(user) && getInitials(user?.name)}
              </Avatar>
              <div className="mobile-profile-info">
                <div className="mobile-profile-name">{user?.name || 'User'}</div>
                <div className="mobile-profile-email">{user?.email || ''}</div>
              </div>
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogoutOutlined />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
