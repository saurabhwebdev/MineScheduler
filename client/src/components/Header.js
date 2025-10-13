import React from 'react';
import { Avatar, Badge, Dropdown } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateAvatar, getInitials } from '../utils/avatarUtils';
import './Header.css';

const Header = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <div className="dropdown-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
        </div>
      </div>
      <div className="dropdown-divider"></div>
      <div className="dropdown-menu">
        <div className="dropdown-item" onClick={() => navigate('/profile')}>
          <UserOutlined /> Profile
        </div>
        <div className="dropdown-item" onClick={() => navigate('/help')}>
          <QuestionCircleOutlined /> Help
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
          <h1 className="header-title">{title || 'Home'}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        <div className="header-right">
          <div className="header-notification">
            <Badge count={0} showZero={false}>
              <BellOutlined className="notification-icon" />
            </Badge>
          </div>

          <Dropdown
            popupRender={() => dropdownContent}
            placement="bottomRight"
            trigger={['click']}
            overlayStyle={{ padding: 0 }}
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
        </div>
      </div>
    </div>
  );
};

export default Header;
