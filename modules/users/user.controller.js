const Model = require("./user.model");
const { genHash, compareHash } = require("../../utils/secure");
const { genOTP, genToken, verifyToken } = require("../../utils/token");
const { sendEmail } = require("../../services/mailer");
const { boolean } = require("joi");

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
  try {
    const { email, password } = payload;
    
    // Find user without conditions first
    const userExists = await Model.findOne({ email }).select('-password');
    
    if (!userExists) {
      throw new Error("Try using correct email");
    }
    
    if (!userExists.isActive) {
      throw new Error("Account is not activated");
    }
    
    if (userExists.isBlocked) {
      throw new Error("Account is blocked");
    }
    
    // Get password separately to avoid sending it in response
    const userPassword = await Model.findOne({ email }).select('password');
    const isValidPw = compareHash(password, userPassword.password);
    if (!isValidPw) {
      throw new Error("Username or password is incorrect");
    }
    
    const tokenData = {
      _id: userExists._id,
      name: userExists.name,
      email: userExists.email,
      roles: userExists.roles,
    };
    
    // Return both token and user data
    return {
      token: genToken(tokenData),
      user: {
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        phone: userExists.phone || '',
        address: userExists.address || '',
        roles: userExists.roles,
        createdAt: userExists.createdAt,
        isActive: userExists.isActive
      }
    };
  } catch (error) {
    throw error;
  }
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

const getProfile = async (userId) => {
  try {
    console.log('Getting profile for user:', userId);
    const user = await Model.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      roles: user.roles,
      createdAt: user.createdAt,
      isActive: user.isActive
    };
  } catch (error) {
    console.error('Error in getProfile:', error);
    throw error;
  }
};

const updateProfile = async (payload) => {
  try {
    console.log('Updating profile for user:', payload.updated_by);
    const { updated_by, ...updateData } = payload;
    
    // Validate user exists
    const user = await Model.findById(updated_by);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only allow updating certain fields
    const allowedUpdates = {
      name: updateData.name,
      phone: updateData.phone || '',
      address: updateData.address || ''
    };

    // Add profile picture if it exists
    if (updateData.profilePicture) {
      allowedUpdates.profilePicture = updateData.profilePicture;
    }
    
    console.log('Updating with data:', allowedUpdates);
    
    // Use findOneAndUpdate to ensure atomicity
    const updatedUser = await Model.findOneAndUpdate(
      { _id: updated_by },
      { $set: allowedUpdates },
      { 
        new: true, // Return updated document
        runValidators: true // Run model validators
      }
    ).select('-password');
    
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }
    
    console.log('Updated user:', updatedUser);
    
    // Format response
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
      profilePicture: updatedUser.profilePicture || '',
      roles: updatedUser.roles,
      createdAt: updatedUser.createdAt,
      isActive: updatedUser.isActive
    };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};

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

const list = async ({ filter, search, page = 1, limit = 10 }) => {
  try {
    console.log('User list input:', { filter, search, page, limit });
    let currentPage = +page;
    currentPage = currentPage < 1 ? 1 : currentPage;
    const { name } = search;

    const query = [];

    if (filter?.isActive === "yes" || filter?.isActive === "no") {
      console.log('Adding isActive filter:', filter.isActive);
      query.push({
        $match: {
          isActive: filter?.isActive === "yes" ? true : false,
        },
      });
    }
    if (filter?.isBlocked == "yes" || filter?.isBlocked === "no") {
      console.log('Adding isBlocked filter:', filter.isBlocked);
      query.push({
        $match: {
          isBlocked: filter?.isBlocked === "yes" ? true : false,
        },
      });
    }
    if (name) {
      console.log('Adding name search:', name);
      query.push({ $match: { name: new RegExp(name, "gi") } });
    }
    
    query.push(
      {
        $facet: {
          metadata: [
            {
              $count: "total",
            },
          ],
          data: [
            {
              $skip: (currentPage - 1) * +limit,
            },
            {
              $limit: +limit,
            },
          ],
        },
      },
      {
        $addFields: {
          total: {
            $arrayElemAt: ["$metadata.total", 0],
          },
        },
      },
      {
        $project: {
          metadata: 0,
          password: 0,
          token: 0
        },
      }
    );

    console.log('Final aggregation query:', JSON.stringify(query, null, 2));
    const result = await Model.aggregate(query);
    console.log('Aggregation result:', result);

    const response = {
      data: result[0]?.data || [],
      page: +currentPage,
      limit: +limit,
      total: result[0]?.total || 0,
    };
    console.log('Final response:', response);
    return response;
  } catch (error) {
    console.error('Error in user list:', error);
    throw error;
  }
};

const refreshToken = async (oldToken) => {
  try {
    // Verify the old token
    const decoded = verifyToken(oldToken);
    
    // Get user data
    const user = await Model.findOne({
      email: decoded.email,
      isActive: true,
      isBlocked: false
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new token
    const token = genToken({
      id: user._id,
      email: user.email,
      roles: user.roles
    });
    
    return token;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Invalid or expired token');
  }
};

const deleteUser = async (userId) => {
  const user = await Model.findById(userId);
  if (!user) throw new Error("User not found");
  
  // Check if user has any active bookings
  const bookings = await require('../bookings/booking.model').find({ userId: userId, status: { $in: ['pending', 'confirmed'] } });
  if (bookings.length > 0) {
    throw new Error("Cannot delete user with active bookings");
  }
  
  await Model.findByIdAndDelete(userId);
  return { msg: "User deleted successfully" };
};

module.exports = {
  create,
  register,
  login,
  list,
  getById,
  updateById,
  blockUser,
  resetPassword,
  getProfile,
  updateProfile,
  genForgetPasswordToken,
  verifyForgetPasswordToken,
  changePassword,
  verifyEmailToken,
  refreshToken,
  deleteUser
};
