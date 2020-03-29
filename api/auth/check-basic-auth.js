const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const decoded = jwt.verify(req.headers.authorization, process.env.JWT_KEY);
    req.headers.admin = decoded.admin;
    req.headers.roll_no = decoded.roll_no;
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      statusMessage: "Authentication failed"
    });
  }
};
