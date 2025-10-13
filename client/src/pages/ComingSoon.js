import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import './ComingSoon.css';

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
      <div className="coming-soon-page">
        <motion.div
          className="coming-soon-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="coming-soon-title">Coming Soon</h1>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ComingSoon;
