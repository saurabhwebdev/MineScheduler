import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SunriseAnimation from '../components/SunriseAnimation';

const Schedule = () => {
  return (
    <DashboardLayout 
      title="Schedule"
      subtitle="Manage your mine scheduling and operations"
    >
      <SunriseAnimation />
    </DashboardLayout>
  );
};

export default Schedule;
