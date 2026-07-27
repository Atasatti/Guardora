import fs from "node:fs";
import path from "node:path";
import User from "../models/user.js";
import sendMail from "../utils/sendMail.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import sendToken from "../utils/jwtToken.js";

// Temporary storage for activation codes (in production, use Redis or database)
const activationCodes = new Map();

// Get current user profile
const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Create user (registration with email activation)
const createUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, phoneNumber, unitNumber } = req.body;

  const userEmail = await User.findOne({ email });

  if (userEmail) {
    if (req.file) {
      const filePath = path.join("uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    return next(new ErrorHandler("User already exists", 400));
  }

  const profilePicture = req.file
    ? path.join("uploads", req.file.filename)
    : null;

  const user = {
    name,
    email,
    password,
    phoneNumber,
    unitNumber,
    profilePicture,
  };

  // Generate 6-digit activation code
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store activation code with user data (expires in 10 minutes)
  activationCodes.set(email, {
    code: activationCode,
    userData: user,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // Auto-cleanup after expiration
  setTimeout(() => {
    activationCodes.delete(email);
  }, 10 * 60 * 1000);

  await sendMail({
    email: user.email,
    subject: "Activate your account",
    text: `Hello ${user.name},\n\nYour activation code is: ${activationCode}\n\nThis code will expire in 10 minutes.\n\nPlease enter this code in the app to activate your account.`,
  });

  res.status(201).json({
    success: true,
    message: `Please check your email: ${user.email} for the activation code.`,
  });
});

// Resend activation code
const resendActivationCode = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please provide email", 400));
  }

  // Check if there's existing activation data
  const existingData = activationCodes.get(email);
  if (!existingData) {
    return next(
      new ErrorHandler("No pending activation found for this email", 400)
    );
  }

  // Check if user already exists
  const user = await User.findOne({ email });
  if (user) {
    activationCodes.delete(email);
    return next(new ErrorHandler("User already exists", 400));
  }

  // Generate new 6-digit activation code
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Update activation code with user data (expires in 10 minutes)
  activationCodes.set(email, {
    code: activationCode,
    userData: existingData.userData,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // Auto-cleanup after expiration
  setTimeout(() => {
    activationCodes.delete(email);
  }, 10 * 60 * 1000);

  await sendMail({
    email: email,
    subject: "New Activation Code",
    text: `Hello ${existingData.userData.name},\n\nYour new activation code is: ${activationCode}\n\nThis code will expire in 10 minutes.\n\nPlease enter this code in the app to activate your account.`,
  });

  res.status(200).json({
    success: true,
    message: `New activation code sent to ${email}`,
  });
});

// Activate user account
const activateUser = catchAsyncErrors(async (req, res, next) => {
  const { email, activationCode } = req.body;

  if (!email || !activationCode) {
    return next(
      new ErrorHandler("Please provide email and activation code", 400)
    );
  }

  // Get stored activation data
  const activationData = activationCodes.get(email);

  if (!activationData) {
    return next(new ErrorHandler("Activation code expired or invalid", 400));
  }

  // Check if code has expired
  if (Date.now() > activationData.expiresAt) {
    activationCodes.delete(email);
    return next(new ErrorHandler("Activation code has expired", 400));
  }

  // Verify activation code
  if (activationData.code !== activationCode) {
    return next(new ErrorHandler("Invalid activation code", 400));
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    activationCodes.delete(email);
    return next(new ErrorHandler("User already exists", 400));
  }

  // Create user with stored data
  const { name, password, phoneNumber, unitNumber, profilePicture } =
    activationData.userData;
  user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    unitNumber,
    profilePicture,
  });

  // Clean up activation code
  activationCodes.delete(email);

  // Remove password from response
  user.password = undefined;

  sendToken(user, 201, res);
});

// Login user
const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout user
const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get logged in user details
const getUserInfo = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Update user info
const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phoneNumber, unitNumber } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (unitNumber) user.unitNumber = unitNumber;

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// Update profile picture
const updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
  const existUser = await User.findById(req.user.id);

  if (existUser.profilePicture) {
    const existAvatarPath = existUser.profilePicture;
    if (fs.existsSync(existAvatarPath)) {
      fs.unlinkSync(existAvatarPath);
    }
  }

  const fileUrl = path.join("uploads", req.file.filename);
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: fileUrl },
    { new: true }
  );

  res.status(200).json({
    success: true,
    user,
  });
});

// Update emergency contact
const updateEmergencyContact = catchAsyncErrors(async (req, res, next) => {
  const { name, phoneNumber, relationship } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.emergencyContact = {
    name,
    phoneNumber,
    relationship,
  };

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// Change password
const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please provide old and new password", 400));
  }

  const user = await User.findById(req.user.id).select("+password");
  const isOldPasswordValid = await user.comparePassword(oldPassword);

  if (!isOldPasswordValid) {
    return next(new ErrorHandler("Incorrect old password", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Get user by ID (public)
const getUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Get users
const getUsers = catchAsyncErrors(async (req, res) => {
  const { query } = req.query;
  if (query) {
    User.find({
      name: {
        $regex: query,
        $options: "i",
      },
    })
      .select("name profilePicture unitNumber")
      .then((users) => res.json(users))
      .catch((error) => {
        res.status(500).json({ error: "Failed to search users" });
      });
  } else {
    User.find()
      .select("name profilePicture unitNumber")
      .then((users) => res.json(users))
      .catch((error) => {
        res.status(500).json({ error: "Failed to fetch users" });
      });
  }
});

const toggleFollowUser = catchAsyncErrors(async (req, res) => {
  const { userId } = req.params; // User to follow/unfollow
  const currentUserId = req.user.id; // Current authenticated user

  // Prevent users from following themselves
  if (userId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: "You cannot follow yourself",
    });
  }

  try {
    // Find both users
    const [userToFollow, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(currentUserId),
    ]);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentlyFollowing =
      currentUser.socialStats.following.includes(userId);
    let message = "";

    if (isCurrentlyFollowing) {
      // Unfollow logic
      currentUser.socialStats.following.pull(userId);
      currentUser.socialStats.totalFollowing -= 1;

      userToFollow.socialStats.followers.pull(currentUserId);
      userToFollow.socialStats.totalFollowers -= 1;

      message = "Unfollowed successfully";
    } else {
      // Follow logic
      currentUser.socialStats.following.push(userId);
      currentUser.socialStats.totalFollowing += 1;

      userToFollow.socialStats.followers.push(currentUserId);
      userToFollow.socialStats.totalFollowers += 1;

      message = "Followed successfully";
    }

    // Save both users
    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.status(200).json({
      success: true,
      message,
      isFollowing: !isCurrentlyFollowing,
      followersCount: userToFollow.socialStats.totalFollowers,
      followingCount: currentUser.socialStats.totalFollowing,
    });
  } catch (error) {
    console.error("Follow/Unfollow error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to follow/unfollow user",
    });
  }
});

// ADMIN FUNCTIONS

const adminGetAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
});

const adminCreateUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, phoneNumber, unitNumber, role } = req.body;

  // Check if user already exists
  const userEmail = await User.findOne({ email });
  if (userEmail) {
    // If a file was uploaded, delete it
    if (req.file) {
      const filePath = path.join("uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    return next(new ErrorHandler("User already exists", 400));
  }

  // Check for required fields
  if (!name || !email || !password || !phoneNumber || !unitNumber || !role) {
    if (req.file) {
      const filePath = path.join("uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check for valid role
  if (!["RESIDENT", "ADMIN", "MODERATOR"].includes(role)) {
    if (req.file) {
      const filePath = path.join("uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    return next(new ErrorHandler(`Role "${role}" is not valid`, 400));
  }

  const profilePicture = req.file
    ? path.join("uploads", req.file.filename)
    : null;

  // Create user (password will be hashed by the 'pre-save' hook)
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    unitNumber,
    role,
    profilePicture,
  });

  // Don't send token, admin is just creating a user, not logging them in
  res.status(201).json({
    success: true,
    user,
  });
});

const adminUpdateUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phoneNumber, unitNumber } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  // Update fields if they are provided
  user.email = email || user.email;
  user.name = name || user.name;
  user.phoneNumber = phoneNumber || user.phoneNumber;
  user.unitNumber = unitNumber || user.unitNumber;
  // Note: We are NOT allowing role to be changed, as per your request.

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

const adminDeleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  // Delete profile picture from filesystem if it exists
  if (user.profilePicture) {
    const filePath = user.profilePicture;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete user from database
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export {
  adminGetAllUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getProfile,
  createUser,
  activateUser,
  resendActivationCode,
  loginUser,
  logoutUser,
  getUserInfo,
  updateUserInfo,
  updateProfilePicture,
  updateEmergencyContact,
  changePassword,
  getUserById,
  getUsers,
  toggleFollowUser,
};
