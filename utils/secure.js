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
      const { access_token } = req.headers;
      if (!access_token) throw new Error("access token not found");
      const { email } = verifyToken(access_token);
      const user = await userModel.findOne({
        email,
        isActive: true,
        isBlocked: false,
      });
      if (!user) throw new Error("user not found");
      const isValidRole = sysRole.some((role) => user?.roles.includes(role));
      if (!isValidRole) {
        throw new Error("user unauthorized");
      } else {
        req.body.updated_by = user?._id;
        next();
      }
    } catch (err) {
      next(err);
    }
  };
};
// const hash = genHash("aryan");
// console.log(hash);
// const verifyHash = compareHash("aryan", hash);
// console.log(verifyHash);

module.exports = { genHash, compareHash, secureAPI };
