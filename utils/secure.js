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

      const { access_token } = req.headers;
      if (!access_token) throw new Error("access token not found");

      const decoded = verifyToken(access_token);
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
        throw new Error("user unauthorized");
      }

      // Set user info in request
      req.user = user;
      req.body.updated_by = user._id;
      next();
    } catch (err) {
      console.error('Secure API error:', err);
      next(err);
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
