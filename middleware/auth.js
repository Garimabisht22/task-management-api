const jwt = require('jsonwebtoken');         // For verifying JWT tokens
const User = require('../models/User');      // User model to look up user in DB

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from "Authorization" header (expected format: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token found → block access
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token with secret key (throws error if invalid/expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with matching ID and token still stored in their "tokens" array
    //   - decoded._id comes from payload inside JWT
    //   - 'tokens.token': token ensures the token is still valid (user not logged out)
    const user = await User.findOne({ 
      _id: decoded._id, 
      'tokens.token': token 
    });

    // If no such user → token is invalid (maybe forged or already logged out)
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Attach user and token to request object
    // This way, routes can access req.user and req.token
    req.user = user;
    req.token = token;

    // Pass control to next middleware/route handler
    next();

  } catch (error) {
    // If verification fails or error occurs → reject request
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth; // Export so it can be used in routes
