import React, { useState } from 'react';
import { Tabs } from 'antd';
import { SettingOutlined, DatabaseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import UomConfig from '../components/UomConfig';
import ShiftConfig from '../components/ShiftConfig';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('uom');

  const tabItems = [
    {
      key: 'uom',
      label: (
        <span>
          <DatabaseOutlined />
          UOM Configuration
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Unit of Measurement (UOM)</h3>
              <p>Manage units of measurement used in task configuration</p>
            </div>
            <div className="settings-card-body">
              <UomConfig />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'shifts',
      label: (
        <span>
          <ClockCircleOutlined />
          Shift Management
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Shift Management</h3>
              <p>Configure work shifts and shift change durations for scheduling</p>
            </div>
            <div className="settings-card-body">
              <ShiftConfig />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Settings"
      subtitle="Configure your application preferences"
    >
      <div className="settings-page-modern">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="settings-tabs"
        />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
