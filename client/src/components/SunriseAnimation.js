import React from 'react';
import { motion } from 'framer-motion';
import './SunriseAnimation.css';

const SunriseAnimation = () => {
  return (
    <div className="sunrise-container">
      {/* Flat gradient background */}
      <motion.div 
        className="gradient-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Geometric shapes - floating circles */}
      <motion.div
        className="shape shape-1"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 0.08,
          y: [-20, 20, -20],
        }}
        transition={{
          scale: { duration: 1, delay: 0.2 },
          opacity: { duration: 1, delay: 0.2 },
          y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      
      <motion.div
        className="shape shape-2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 0.06,
          x: [-30, 30, -30],
        }}
        transition={{
          scale: { duration: 1, delay: 0.4 },
          opacity: { duration: 1, delay: 0.4 },
          x: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      <motion.div
        className="shape shape-3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 0.05,
          y: [30, -30, 30],
          x: [20, -20, 20],
        }}
        transition={{
          scale: { duration: 1, delay: 0.6 },
          opacity: { duration: 1, delay: 0.6 },
          y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 15, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      {/* Minimal floating dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="floating-dot"
          style={{
            left: `${15 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0, 1, 0],
            y: [0, -40, -80],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Main content container */}
      <div className="content-wrapper">
        {/* Coming Soon Text with modern typography */}
        <motion.div
          className="text-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div className="coming-soon-label">
            {'COMING SOON'.split('').map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 1 + index * 0.03,
                  ease: "easeOut"
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          <motion.h1 
            className="main-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {'Something Great'.split(' ').map((word, wordIndex) => (
              <span key={wordIndex} className="word">
                {word.split('').map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    className="char"
                    whileHover={{
                      y: -8,
                      color: '#3cca70',
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordIndex < 1 && ' '}
              </span>
            ))}
            <br />
            {'is Coming'.split(' ').map((word, wordIndex) => (
              <span key={wordIndex + 2} className="word">
                {word.split('').map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    className="char"
                    whileHover={{
                      y: -8,
                      color: '#3cca70',
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordIndex < 1 && ' '}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            We're working on something amazing for you
          </motion.p>

          {/* Progress indicator */}
          <motion.div
            className="progress-container"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ duration: 1, delay: 1.8 }}
          >
            <motion.div
              className="progress-bar"
              initial={{ width: '0%' }}
              animate={{ width: '65%' }}
              transition={{ duration: 2, delay: 2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </motion.div>

        {/* Minimal icon/logo placeholder */}
        <motion.div
          className="icon-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="icon-circle"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="icon-inner" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SunriseAnimation;
