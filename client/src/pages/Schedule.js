import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import './ComingSoon.css';

const Schedule = () => {
  return (
    <DashboardLayout 
      title="Schedule"
      subtitle="Manage your mine scheduling and operations"
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

export default Schedule;
