import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import './ComingSoon.css';

const Team = () => {
  return (
    <DashboardLayout 
      title="Team"
      subtitle="Manage your team members and roles"
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

export default Team;
