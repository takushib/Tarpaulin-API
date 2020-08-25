const jwt = require('jsonwebtoken');

const secretKey = 'verysecretkey';

function generateAuthToken(id, role) {
  const payload = {
    sub: id,
    role: role
  };

  return jwt.sign(payload, secretKey);
}
exports.generateAuthToken = generateAuthToken;

function requireAuthentication(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {
    const payload = jwt.verify(token, secretKey);
    req.user = payload.sub;
    req.role = payload.role;
    next();
  } catch (err) {
    console.error('== Error:', err);
    res.status(401).send({
      error: 'Invalid authentication token'
    });
  }
}
exports.requireAuthentication = requireAuthentication;

function verifyAuthentication(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  if (!token) {
    console.log('no token provided');
    next();
  }

  try {
    const payload = jwt.verify(token, secretKey);
    req.user = payload.sub;
    req.role = payload.role;
    next();
  } catch (err) {
    return;
  }
}
exports.verifyAuthentication = verifyAuthentication;
