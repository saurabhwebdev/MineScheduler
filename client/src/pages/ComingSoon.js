import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import SunriseAnimation from '../components/SunriseAnimation';

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
      subtitle="Here's what's happening in your Mine Scheduler account today"
    >
      <SunriseAnimation />
    </DashboardLayout>
  );
};

export default ComingSoon;
