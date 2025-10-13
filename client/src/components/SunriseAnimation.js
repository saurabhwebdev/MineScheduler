import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './SunriseAnimation.css';

const SunriseAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="sunrise-container">
      {/* Animated background gradient */}
      <motion.div 
        className="sunrise-background"
        animate={{
          background: [
            'linear-gradient(180deg, #062d54 0%, #0a4275 50%, #3cca70 100%)',
            'linear-gradient(180deg, #0a4275 0%, #3cca70 50%, #5dd98b 100%)',
            'linear-gradient(180deg, #062d54 0%, #0a4275 50%, #3cca70 100%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Horizon line */}
      <motion.div 
        className="horizon-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />

      {/* Sun */}
      <motion.div
        className="sun"
        initial={{ y: 100, scale: 0.5, opacity: 0 }}
        animate={{ 
          y: 0, 
          scale: 1, 
          opacity: 1,
        }}
        transition={{
          duration: 2.5,
          ease: "easeOut"
        }}
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
      >
        <motion.div
          className="sun-core"
          animate={{
            boxShadow: [
              '0 0 60px 30px rgba(60, 202, 112, 0.3)',
              '0 0 80px 40px rgba(60, 202, 112, 0.4)',
              '0 0 60px 30px rgba(60, 202, 112, 0.3)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Sun rays */}
      {[...Array(12)].map((_, index) => (
        <motion.div
          key={index}
          className="sun-ray"
          style={{
            transform: `rotate(${index * 30}deg)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scaleY: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Floating particles */}
      {[...Array(20)].map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Mountains silhouette */}
      <svg className="mountains" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M0,300 L0,200 L200,100 L400,180 L600,80 L800,160 L1000,120 L1200,200 L1200,300 Z"
          fill="rgba(6, 45, 84, 0.3)"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        <motion.path
          d="M0,300 L0,240 L300,140 L500,200 L700,120 L900,180 L1200,160 L1200,300 Z"
          fill="rgba(6, 45, 84, 0.5)"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
      </svg>

      {/* Coming Soon Text */}
      <motion.div
        className="coming-soon-text-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <motion.h1 
          className="coming-soon-text"
          animate={{
            textShadow: [
              '0 0 20px rgba(60, 202, 112, 0.5)',
              '0 0 30px rgba(60, 202, 112, 0.8)',
              '0 0 20px rgba(60, 202, 112, 0.5)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{
            scale: 1.05,
            textShadow: '0 0 40px rgba(60, 202, 112, 1)',
          }}
        >
          {'Coming Soon'.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 2.2 + index * 0.05,
              }}
              whileHover={{
                y: -10,
                color: '#3cca70',
                transition: { duration: 0.2 }
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="coming-soon-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.8 }}
        >
          Something amazing is on the horizon
        </motion.p>
      </motion.div>

      {/* Ripple effect on click */}
      <motion.div
        className="ripple"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </div>
  );
};

export default SunriseAnimation;
