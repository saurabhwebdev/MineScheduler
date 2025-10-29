import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Dropdown } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, MenuOutlined, CloseOutlined, HomeOutlined, RightOutlined, ExclamationCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateAvatar, getInitials } from '../utils/avatarUtils';
import LanguageSwitcher from './LanguageSwitcher';
import config from '../config/config';
import './Header.css';

const Header = ({ title, subtitle, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [criticalAlerts, setCriticalAlerts] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Fetch critical alerts count
  useEffect(() => {
    const fetchCriticalAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/dashboard/critical-alerts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === 'success') {
          setCriticalAlerts(data.data);
        }
      } catch (error) {
        console.error('Error fetching critical alerts:', error);
      }
    };

    fetchCriticalAlerts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchCriticalAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Notification dropdown content
  const notificationContent = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <ExclamationCircleOutlined className="notification-header-icon" />
        <span className="notification-header-title">Critical Alerts</span>
      </div>
      {criticalAlerts && criticalAlerts.count > 0 ? (
        <>
          <div className="notification-summary">
            <div className="notification-summary-text">
              <strong>{criticalAlerts.count}</strong> critical issue{criticalAlerts.count !== 1 ? 's' : ''} detected
            </div>
          </div>
          <div className="notification-items">
            {criticalAlerts.overdue > 0 && (
              <div className="notification-item">
                <WarningOutlined className="notification-item-icon error" />
                <div className="notification-item-content">
                  <div className="notification-item-title">Maintenance Overdue</div>
                  <div className="notification-item-desc">{criticalAlerts.overdue} equipment require immediate attention</div>
                </div>
              </div>
            )}
            {criticalAlerts.outOfService > 0 && (
              <div className="notification-item">
                <ExclamationCircleOutlined className="notification-item-icon error" />
                <div className="notification-item-content">
                  <div className="notification-item-title">Out of Service</div>
                  <div className="notification-item-desc">{criticalAlerts.outOfService} equipment offline</div>
                </div>
              </div>
            )}
            {criticalAlerts.dueSoon > 0 && (
              <div className="notification-item">
                <ClockCircleOutlined className="notification-item-icon warning" />
                <div className="notification-item-content">
                  <div className="notification-item-title">Due Soon</div>
                  <div className="notification-item-desc">{criticalAlerts.dueSoon} equipment maintenance due within 7 days</div>
                </div>
              </div>
            )}
          </div>
          <div className="notification-footer">
            <div 
              className="notification-footer-link"
              onClick={() => {
                setNotificationOpen(false);
                navigate('/dashboard');
              }}
            >
              View Dashboard →
            </div>
          </div>
        </>
      ) : (
        <div className="notification-empty">
          <div className="notification-empty-icon">✓</div>
          <div className="notification-empty-text">All systems operational</div>
          <div className="notification-empty-subtext">No critical alerts at this time</div>
        </div>
      )}
    </div>
  );

  const dropdownContent = (
    <div className="profile-dropdown">
      <div className="dropdown-user-info">
        <Avatar 
          size={48}
          className="dropdown-avatar"
          src={generateAvatar(user)}
          style={{ backgroundColor: '#062d54', color: '#ffffff' }}
        >
          {!generateAvatar(user) && getInitials(user?.name)}
        </Avatar>
        <div className="dropdown-details">
          <div className="dropdown-name">{user?.name || 'User'}</div>
          <div className="dropdown-email">{user?.email || ''}</div>
          <div className="dropdown-role">
            {user?.customRole ? user.customRole.name : (user?.role === 'admin' ? 'Administrator' : 'User')}
          </div>
        </div>
      </div>
      <div className="dropdown-divider"></div>
      <div className="dropdown-menu">
        <div className="dropdown-item" onClick={() => navigate('/profile')}>
          <UserOutlined /> Profile
        </div>
        <div className="dropdown-item logout" onClick={logout}>
          <LogoutOutlined /> Logout
        </div>
      </div>
    </div>
  );

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-breadcrumb">
            <HomeOutlined className="breadcrumb-home-icon" onClick={() => navigate('/dashboard')} />
            <RightOutlined className="breadcrumb-separator" />
            <span className="breadcrumb-current">{title || 'Home'}</span>
          </div>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        <div className="header-right">
          <div className="header-desktop-only">
            <LanguageSwitcher />
          </div>

          <Dropdown
            popupRender={() => notificationContent}
            placement="bottomRight"
            trigger={['click']}
            open={notificationOpen}
            onOpenChange={setNotificationOpen}
            overlayStyle={{ padding: 0 }}
            className="header-desktop-only"
          >
            <div className="header-notification header-desktop-only">
              <Badge 
                count={criticalAlerts?.count || 0} 
                showZero={false}
                className={criticalAlerts?.count > 0 ? 'notification-badge-urgent' : ''}
              >
                <BellOutlined className="notification-icon" />
              </Badge>
            </div>
          </Dropdown>

          <Dropdown
            popupRender={() => dropdownContent}
            placement="bottomRight"
            trigger={['click']}
            overlayStyle={{ padding: 0 }}
            className="header-desktop-only"
          >
            <div className="header-user">
              <Avatar 
                className="user-avatar" 
                src={generateAvatar(user)}
                style={{ backgroundColor: '#062d54', color: '#ffffff' }}
              >
                {!generateAvatar(user) && getInitials(user?.name)}
              </Avatar>
            </div>
          </Dropdown>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle-header" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
