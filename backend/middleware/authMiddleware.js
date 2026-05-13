// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware - verifies token and attaches user to request
const authMiddleware = (requiredRoles = null) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      console.log('=== AUTH MIDDLEWARE DEBUG ===');
      console.log('Auth header present:', !!authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No Bearer token found');
        return res.status(401).json({ 
          error: 'No token provided. Please log in.' 
        });
      }

      const token = authHeader.split(' ')[1];
      console.log('Token found, verifying...');
      
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      });
      
      // Attach user info to request
      req.user = decoded;
      
      // Check roles if required
      if (requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        // If 'admin' is allowed, always check for it. 
        // Or just check if decoded.role is in the provided list.
        if (!roles.includes(decoded.role) && decoded.role !== 'admin') {
          console.log(`Role check failed: required one of [${roles}], got ${decoded.role}`);
          return res.status(403).json({ 
            error: `Access denied. Authorized roles: ${roles.join(', ')}. Your role: ${decoded.role}` 
          });
        }
      }
      
      console.log('Auth successful for user:', decoded.username);
      next();
      
    } catch (error) {
      console.error('Auth error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please log in again.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      }
      
      return res.status(401).json({ error: 'Authentication failed.' });
    }
  };
};

// Helper function to generate JWT token
const generateToken = (user) => {
  // Make sure we have the correct field names
  const payload = {
    userId: user.user_id || user.userId || user.id,
    username: user.username,
    email: user.email,
    role: user.role || user.role_name,
    roleId: user.role_id || user.roleId
  };
  
  console.log('Generating token with payload:', payload);
  
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h'
  });
  
  return token;
};

module.exports = {
  authMiddleware,
  generateToken
};    