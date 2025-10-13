import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SunriseAnimation from '../components/SunriseAnimation';

const Team = () => {
  return (
    <DashboardLayout 
      title="Team"
      subtitle="Manage your team members and roles"
    >
      <SunriseAnimation />
    </DashboardLayout>
  );
};

export default Team;
