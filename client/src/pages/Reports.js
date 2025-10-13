import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SunriseAnimation from '../components/SunriseAnimation';

const Reports = () => {
  return (
    <DashboardLayout 
      title="Reports"
      subtitle="View and analyze your mining reports"
    >
      <SunriseAnimation />
    </DashboardLayout>
  );
};

export default Reports;
