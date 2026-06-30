
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// =========================================
// @desc    Register new organization + owner
// @route   POST /api/auth/register
// @access  Public
// =========================================
const register = asyncHandler(async (req, res) => {
  const { organizationName, name, email, password } = req.body;

  if (!organizationName || !name || !email || !password) {
    return sendError(res, 400, "All fields are required");
  }

  const slug = organizationName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existingTenant = await Tenant.findOne({ slug });

  if (existingTenant) {
    return sendError(
      res,
      400,
      "Organization name already taken, try a different one"
    );
  }

  const tenant = await Tenant.create({
    name: organizationName,
    slug,
  });

  const user = await User.create({
    tenantId: tenant._id,
    name,
    email,
    password,
    role: "owner",
  });

  const token = generateToken(user._id);

  return sendSuccess(res, 201, "Account created successfully", {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
    },
  });
});

// =========================================
// @desc    Login
// @route   POST /api/auth/login
// @access  Public
// =========================================
const login = asyncHandler(async (req, res) => {
  const { email, password, slug } = req.body;

  if (!email || !password || !slug) {
    return sendError(res, 400, "Email, password and organization are required");
  }

  const tenant = await Tenant.findOne({
    slug,
    isActive: true,
  });

  if (!tenant) {
    return sendError(res, 401, "Invalid credentials");
  }

  const user = await User.findOne({
    email,
    tenantId: tenant._id,
  }).select("+password");

  if (!user) {
    return sendError(res, 401, "Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return sendError(res, 401, "Invalid credentials");
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  return sendSuccess(res, 200, "Login successful", {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
    },
  });
});

// =========================================
// @desc    Current logged-in user
// @route   GET /api/auth/me
// @access  Private
// =========================================
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "tenantId",
    "name slug plan"
  );

  return sendSuccess(res, 200, "User fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
    },
    tenant: user.tenantId,
  });
});

// =========================================
// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
// =========================================
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return sendError(res, 400, "Current password is incorrect");
  }

  user.password = newPassword;

  await user.save();

  const token = generateToken(user._id);

  return sendSuccess(res, 200, "Password updated successfully", {
    token,
  });
});

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
};