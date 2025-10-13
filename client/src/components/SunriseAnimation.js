import React from 'react';
import { motion } from 'framer-motion';
import './SunriseAnimation.css';

const SunriseAnimation = () => {
  return (
    <div className="sunrise-container">
      {/* Clean gradient background */}
      <div className="gradient-bg" />

      {/* Floating shapes - minimal */}
      <motion.div
        className="shape shape-1"
        animate={{ 
          y: [-15, 15, -15],
          opacity: [0.06, 0.08, 0.06]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="shape shape-2"
        animate={{ 
          x: [-20, 20, -20],
          opacity: [0.04, 0.06, 0.04]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main content */}
      <div className="content-wrapper">
        <motion.div
          className="content-inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="logo-circle"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="logo-letter">M</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            className="badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <span className="badge-dot"></span>
            Coming Soon
          </motion.div>

          {/* Main heading */}
          <motion.h1
            className="main-heading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            We're Building Something Amazing
          </motion.h1>

          {/* Description */}
          <motion.p
            className="description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            This feature is currently under development. Stay tuned for updates!
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="progress-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="progress-header">
              <span className="progress-label">Development Progress</span>
              <span className="progress-percentage">75%</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SunriseAnimation;
