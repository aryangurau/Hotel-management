const bcrypt = require("bcryptjs");

const genHash = (text) => {
  return bcrypt.hashSync(text, Number(process.env.SALT_ROUND));
};

const compareHash = (text, hashText) => {
  return bcrypt.compareSync(text, hashText);
};

// const hash = genHash("aryan");
// console.log(hash);
// const verifyHash = compareHash("aryan", hash);
// console.log(verifyHash);

module.exports = { genHash, compareHash };
