const crypto = require("crypto");

const genOTP = () => {
  return crypto.randomInt(10000, 999999);
};

module.exports = { genOTP };
