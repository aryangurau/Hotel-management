const Model = require("./user.model");
const { genHash, compareHash } = require("../../utils/secure");
const { genOTP, genToken } = require("../../utils/token");
const { sendEmail } = require("../../services/mailer");

const register = async (payload) => {
  const { password, roles, isActive, ...rest } = payload;
  //check if user email is already exists or not
  const userExist = await Model.findOne({ email: rest.email });
  if (userExist) throw new Error("This email has already taken");
  const nameExist = await Model.findOne({ name: rest.name });
  if (nameExist) throw new Error("UserName Already Taken");
  const phone = await Model.findOne({ phone: rest.phone });

  //hash the text password
  rest.password = genHash(password);
  //register the user into database
  const newUser = await Model.create(rest);
  if (!newUser) throw new Error("already the user.");
  //generate the otp & update the user model with token
  const myToken = genOTP();
  await Model.updateOne({ email: newUser.email }, { token: myToken }); //updated token field with token value in databasemodel

  //sent otp through email
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

const genForgetPasswordToken = async ({ email }) => {
  //1.check email for user; isBlocked? , isActive?
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("user not found");

  //2. generate new token(otp)
  const myToken = genOTP();
  await Model.updateOne({ email }, { token: myToken });

  //3.send token to user in email

  const isEmailSent = await genEmailToken({
    to: user?.email,
    subject: "Password Recovery",
    msg: `<h1>Your forget password  token is ${myToken}</h1>`,
  });

  if (!isEmailSent) throw new Error("user email sending failed...");
  return { data: null, msg: "please check your email for token" };

  //4.store token in database in user data
  //5.
};

const verifyForgetPasswordToken = async ({ email, token, newPassword }) => {
  //1.check email for user
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("user not found");
  //2. check token for user
  const isValidToken = token === user?.token;
  if (!isValidToken) throw new Error("token mismatch");
  //3. token match; newPassword hash
  const password = genHash(newPassword);
  //4. update user data in database with hash and empty token field
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { password, token: "" }
  );
  if (!updatedUser) throw new Error("password change failed");
  return { data: null, msg: "password changed successfully" };
};
const changePassword = async ({ email, oldPassword, newPassword }) => {
  // 1.check email for user ; isBlocked? , isActive?
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  // 2.compare the old password stored in db
  const isValidPw = compareHash(oldPassword, user?.password);
  if (!isValidPw) throw new Error("password mismatch");
  // 3.generate hash of newPassword
  const password = genHash(newPassword);
  // 4.update the user data with newPassword
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { password },
    { new: true }
  ); //ensure we get the updated user document data
  if (!updatedUser) throw new Error("password change failed");
  return { data: null, msg: "password changed successfully" };
};

const updateProfile = async (payload) => {
  const { updated_by: currentUser, ...rest } = payload;
  return await Model.findOneAndUpdate({ _id: currentUser }, rest, {
    new: true,
  }).select("-password"); //special update case using role middleware
};

//Admin controllers
const resetPassword = async ({ email, newPassword, updated_by }) => {
  //1.check email for user
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("user not found");
  //2. generate hash of newPassword
  const password = genHash(newPassword);
  //3. update the user's database password with hashed password
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { password, updated_by },
    { new: true }
  );
  if (!updatedUser) throw new Error("password reset failed");
  return { data: null, msg: " Password reset successfull" };
};
const blockUser = async ({ email, updated_by }) => {
  //1. check if user exists
  const user = await Model.findOne({ email, isActive: true });
  if (!user) throw new Error("user not found");
  //2. update the user data with new block status//toggle status
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { isBlocked: !user?.isBlocked, updated_by },
    { new: true }
  );
  if (!updatedUser) throw new Error("user block failed");
  return {
    data: { isBlocked: updatedUser?.isBlocked },
    msg: `User ${updatedUser?.isBlocked ? "blocked" : "unblocked"} succesfully`,
  };
};
const create = async (payload) => {
  const { password, updated_by, ...rest } = payload;
  rest.isActive = true;
  rest.created_by = updated_by;
  rest.password = genHash(password);
  const user = await Model.create(rest);
  return Model.findOne({ email: user?.email }).select("-password");
};
const getById = (_id) => {
  return Model.findOne({ _id }).select("-password");
};
const updateById = async ({ id, payload }) => {
  const user = await Model.findOne({ _id: id });
  if (!user) throw new Error("user not found");
  return await Model.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  }).select("-password");
};
/*
const list = async () => {
  // Fetch all users
  const users = await Model.find({});
  console.log(users); // or return users if needed

  return { data: users, msg: "list of users found sucessfully" };
};
//advance data operation

const getUserByID = async ({ userId }) => {
  const user = await Model.findOne({ userId, isActive: true });
  // console.log(user);
  if (!user) throw new Error("user not found");
  // return Model.findOne({ number });
  return { data: user, msg: "user found sucessfully" };
};
const updateByID = async ({ userId, newName }) => {
  const user = await Model.findOne({ userId, isActive: true });
  // console.log(user);
  if (!user) throw new Error("user not found");
  const updatedUser = await Model.findOneAndUpdate(
    { userId },
    { name: newName },
    { new: true }
  );
  if (!updatedUser) throw new Error("user not updated");
  return { data: updatedUser?.name, msg: "user updated  sucessfully" };
};
*/
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
  // list,
  getById,
  updateById,
  updateProfile,
};
