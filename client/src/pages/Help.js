import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import './Help.css';

const Help = () => {
  return (
    <DashboardLayout 
      title="Help & Support"
      subtitle="Get help with Mine Scheduler"
    >
      <div className="help-page">
        <div className="help-card">
          <div className="help-header">
            <span className="help-icon">📚</span>
            <h2>Help Center</h2>
          </div>
          <div className="help-content">
            <p className="help-message">
              We're working on a comprehensive help center to assist you with all features of Mine Scheduler.
            </p>
            <p className="help-submessage">
              In the meantime, if you need assistance, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;
