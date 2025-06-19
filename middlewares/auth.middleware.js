const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: '인증 토큰이 필요합니다.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('토큰 검증 실패:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: '토큰이 만료되었습니다.' 
      });
    }
    
    return res.status(403).json({ 
      success: false,
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
