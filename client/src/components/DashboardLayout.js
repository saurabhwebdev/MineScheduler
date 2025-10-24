import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import Header from './Header';
import HelpModal from './HelpModal';
import { getHelpForPage } from '../help';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title, subtitle, page }) => {
  const [helpVisible, setHelpVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const helpData = getHelpForPage(page);

  return (
    <div className="dashboard-layout">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="dashboard-main">
        <Header title={title} subtitle={subtitle} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="dashboard-content">
          {children}
        </div>
        <footer className="dashboard-footer">
          <p>Mine Scheduler™ Powered by Unison Mining Pte Limited</p>
        </footer>
      </div>
      
      {/* Floating Help Button */}
      {helpData && (
        <>
          <Tooltip title="Help & Documentation" placement="left">
            <Button
              type="primary"
              shape="circle"
              icon={<QuestionCircleOutlined />}
              size="large"
              className="floating-help-button"
              onClick={() => setHelpVisible(true)}
            />
          </Tooltip>
          
          <HelpModal
            visible={helpVisible}
            onClose={() => setHelpVisible(false)}
            helpData={helpData}
          />
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
