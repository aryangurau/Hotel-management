const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');

const isUser = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('No token provided');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?._id) {
            throw new Error('Invalid token');
        }

        // Get user
        const user = await User.findById(decoded._id);
        if (!user) {
            throw new Error('User not found');
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Authentication failed'
        });
    }
};

module.exports = {
    isUser
};
