const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: No Authorization header provided.' 
    });
  }

  // Expecting format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Authorization format must be Bearer <token>.' 
    });
  }

  const token = parts[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'evaluation_secret_token_12345';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach decoded user data (e.g. { id, email }) to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Invalid or expired security token.' 
    });
  }
};
