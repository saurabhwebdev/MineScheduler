import React from 'react';
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

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: 'Home', path: '/dashboard' },
    { key: 'schedule', icon: <CalendarOutlined />, label: 'Schedule', path: '/schedule' },
    { key: 'tasks', icon: <FileTextOutlined />, label: 'Tasks', path: '/tasks' },
    { key: 'delays', icon: <ClockCircleOutlined />, label: 'Delays', path: '/delays' },
    { key: 'sites', icon: <EnvironmentOutlined />, label: 'Sites', path: '/sites' },
    { key: 'equipment', icon: <ToolOutlined />, label: 'Equipment', path: '/equipment' },
    { key: 'reports', icon: <BarChartOutlined />, label: 'Reports', path: '/reports' },
    { key: 'users', icon: <UserOutlined />, label: 'Users', path: '/users', adminOnly: true },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' },
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

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" onClick={() => navigate('/dashboard')}>M</div>
      </div>

      <div className="sidebar-menu">
        {visibleMenuItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <div className="menu-icon">{item.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
