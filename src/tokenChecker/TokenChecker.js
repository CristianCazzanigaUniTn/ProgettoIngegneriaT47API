const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;

const tokenChecker = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = tokenChecker;