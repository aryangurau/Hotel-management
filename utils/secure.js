const bcrypt = require("bcryptjs");
const { verifyToken } = require("../utils/token");
const userModel = require("../modules/users/user.model");

const genHash = (text) => {
  return bcrypt.hashSync(text, Number(process.env.SALT_ROUND));
};

const compareHash = (text, hashText) => {
  return bcrypt.compareSync(text, hashText);
};

const secureAPI = (sysRole = []) => {
  return async (req, res, next) => {
    try {
      console.log('Secure API middleware - roles:', sysRole);
      console.log('Request headers:', req.headers);

      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new Error("Authorization header not found");

      // Extract token from "Bearer <token>"
      const token = authHeader.split(' ')[1];
      if (!token) throw new Error("Bearer token not found");

      const decoded = verifyToken(token);
      console.log('Decoded token:', decoded);

      const { email } = decoded;
      const user = await userModel.findOne({
        email,
        isActive: true,
        isBlocked: false,
      });

      console.log('Found user:', {
        id: user?._id,
        email: user?.email,
        roles: user?.roles
      });

      if (!user) throw new Error("user not found");

      // Add user to request object for later use
      req.user = user;

      // Convert roles to lowercase for case-insensitive comparison
      const userRoles = user.roles.map(role => role.toLowerCase());
      const requiredRoles = sysRole.map(role => role.toLowerCase());

      const isValidRole = requiredRoles.some((role) => userRoles.includes(role));
      console.log('Role validation:', {
        userRoles,
        requiredRoles,
        isValidRole
      });

      if (!isValidRole) {
        throw new Error("you don't have permission");
      }

      next();
    } catch (e) {
      console.error('Secure API error:', e);
      next(e);
    }
  };
};

const checkUser = async (req, res, next) => {
  try {
    console.log('Check user middleware - body:', req.body);
    console.log('Check user middleware - user:', req.user);

    if (!req.user) throw new Error("User not found");

    const isAdmin = req.user.roles.includes("admin");
    console.log('Check user - is admin:', isAdmin);

    if (!isAdmin) {
      // For non-admin users, ensure they can only access their own orders
      req.body.filter = {
        created_by: req.user._id
      };
    }
    next();
  } catch (err) {
    console.error('Check user error:', err);
    next(err);
  }
};

module.exports = { checkUser, genHash, compareHash, secureAPI };
