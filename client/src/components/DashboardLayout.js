import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title, subtitle }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header title={title} subtitle={subtitle} />
        <div className="dashboard-content">
          {children}
        </div>
        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} Copyright Unison Mining</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
