const Model = require("./user.model");
const { genHash, compareHash } = require("../../utils/secure");
const { genOTP, genToken } = require("../../utils/token");
const { sendEmail } = require("../../services/mailer");

const create = (payload) => {};

const register = async (payload) => {
  const { password, roles, isActive, ...rest } = payload;
  const userExist = await Model.findOne({ email: rest.email });
  if (userExist) throw new Error("This email has already taken");
  rest.password = genHash(password);
  const newUser = await Model.create(rest);
  if (!newUser) throw new Error("already the user.");
  const myToken = genOTP();

  await Model.updateOne({ email: newUser.email }, { token: myToken }); //updated token field with token value in databasemodel
  //   console.log("Email to send:", newUser?.email);
  const isEmailSent = await genEmailToken({
    to: newUser?.email,
    subject: "welcome to xyz hotel",
    msg: `<h1>Your OTP code for verification is ${myToken}</h1>`,
  });

  if (!isEmailSent) throw new Error("user email sending failed...");
  return { data: null, msg: "please check your email for verification" };
};

const genEmailToken = async ({ to, subject, msg }) => {
  if (!to) throw new Error("No recipient email address provided"); // for no recipients
  const { messageId } = await sendEmail({ to, subject, htmlMessage: msg });
  return messageId ? true : false;
};

const verifyEmailToken = async (payload) => {
  const { email, token } = payload;
  // system ma or db ma email check garnu paryo + user shouldnot be blocked
  const user = await Model.findOne({ email, isBlocked: false });
  if (!user) throw new Error("User not found");
  //compare user le pathayeko token with db ma store bhako token
  const isValidToken = token === user?.token;
  if (!isValidToken) throw new Error("Invalid token");
  //match vayo vane=> isActive true & token empty gardine
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    {
      isActive: true,
      token: "",
      welcomeMessage:
        "Welcome to XYZ Hotel! Thank you for verifying your email. We're excited to have you with us.",
    }
  );

  //Added by me //a welcome notification in mail box after email verification
  const welcomeMessage = await genEmailToken({
    to: user?.email,
    subject: "Namaste",
    msg: `<h1>Welcome to XYZ Hotel!. We're excited to have you with us.",
    }</h1>`,
  });
  if (verifyEmailToken === true) {
    return welcomeMessage;
  }
  console.log(updatedUser);

  if (!updatedUser) throw new Error("Email verification failed"); //todo

  return { data: null, msg: "Thankyou for verifying your email" };
};

const login = async (payload) => {
  const { email, password } = payload;
  //user find using email + is blocked ? isActive
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("Try using correct email");
  //compare password withh db stored pw
  const isValidPw = compareHash(password, user?.password);
  if (!isValidPw) throw new Error("Username or password is incorrect");
  //generate token and return token
  const data = {
    name: user?.name,
    email: user?.email,
    roles: user?.roles,
  };
  return genToken(data);
};
const genForgetPasswordToken = () => {};
const verifyForgetPasswordToken = () => {};
const changePassword = () => {};
const resetPassword = () => {};
const blockUser = () => {};
const list = () => {}; //advance data operation
const getByID = () => {};
const updateProfile = () => {};

module.exports = {
  create,
  register,
  login,
  genEmailToken,
  verifyEmailToken,
  genForgetPasswordToken,
  verifyForgetPasswordToken,
  changePassword,
  resetPassword,
  blockUser,
  list,
  getByID,
  updateProfile,
};
