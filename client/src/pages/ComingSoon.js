import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import EquipmentDashboard from '../components/EquipmentDashboard';

const ComingSoon = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <DashboardLayout 
      title={`${getGreeting()} ${user?.name || 'User'}`}
      subtitle="Equipment Performance Overview"
      page="dashboard"
    >
      <EquipmentDashboard />
    </DashboardLayout>
  );
};

export default ComingSoon;
