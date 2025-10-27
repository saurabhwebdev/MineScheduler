import React, { useState } from 'react';
import { Tabs } from 'antd';
import { DatabaseOutlined, ClockCircleOutlined, CalculatorOutlined, ToolOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import UomConfig from '../components/UomConfig';
import ShiftConfig from '../components/ShiftConfig';
import ConstantsConfig from '../components/ConstantsConfig';
import EquipmentTypeConfig from '../components/EquipmentTypeConfig';
import './Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('uom');

  const tabItems = [
    {
      key: 'uom',
      label: (
        <span>
          <DatabaseOutlined />
          {t('settings.tabs.uom')}
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>{t('settings.uom.title')}</h3>
              <p>{t('settings.uom.description')}</p>
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
          {t('settings.tabs.shifts')}
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>{t('settings.shifts.title')}</h3>
              <p>{t('settings.shifts.description')}</p>
            </div>
            <div className="settings-card-body">
              <ShiftConfig />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'equipmentTypes',
      label: (
        <span>
          <ToolOutlined />
          {t('settings.tabs.equipmentTypes')}
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>{t('settings.equipmentTypes.title')}</h3>
              <p>{t('settings.equipmentTypes.description')}</p>
            </div>
            <div className="settings-card-body">
              <EquipmentTypeConfig />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'constants',
      label: (
        <span>
          <CalculatorOutlined />
          {t('settings.tabs.constants')}
        </span>
      ),
      children: (
        <div className="settings-tab-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>{t('settings.constants.title')}</h3>
              <p>{t('settings.constants.description')}</p>
            </div>
            <div className="settings-card-body">
              <ConstantsConfig />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      page="settings"
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
