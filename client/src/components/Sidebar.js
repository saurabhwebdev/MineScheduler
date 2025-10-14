import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
    </div>
    </>
  );
};

export default Sidebar;
