const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Google OAuth Routes
if (process.env.ENABLE_SSO === 'true' && process.env.GOOGLE_CLIENT_ID) {
  // @route   GET /api/auth/google
  // @desc    Initiate Google OAuth
  // @access  Public
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })
  );

  // @route   GET /api/auth/google/callback
  // @desc    Google OAuth callback
  // @access  Public
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
    }),
    (req, res) => {
      try {
        // Generate JWT token
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&provider=google`);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
      }
    }
  );
}

// Microsoft OAuth Routes
if (process.env.ENABLE_SSO === 'true' && process.env.MICROSOFT_CLIENT_ID) {
  // @route   GET /api/auth/microsoft
  // @desc    Initiate Microsoft OAuth
  // @access  Public
  router.get(
    '/microsoft',
    passport.authenticate('microsoft', {
      session: false,
    })
  );

  // @route   GET /api/auth/microsoft/callback
  // @desc    Microsoft OAuth callback
  // @access  Public
  router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=microsoft_auth_failed`,
    }),
    (req, res) => {
      try {
        // Generate JWT token
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&provider=microsoft`);
      } catch (error) {
        console.error('Microsoft callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
      }
    }
  );
}

// @route   GET /api/auth/sso/status
// @desc    Get SSO configuration status
// @access  Public
router.get('/sso/status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      ssoEnabled: process.env.ENABLE_SSO === 'true',
      providers: {
        google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
      },
    },
  });
});

module.exports = router;
