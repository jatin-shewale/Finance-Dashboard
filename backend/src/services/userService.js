import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';


export const registerUser = async (userData) => {
  const { email, password, name, role = 'viewer' } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { statusCode: 400, message: 'User with this email already exists' };
  }

  const user = await User.create({
    email,
    password,
    name,
    role,
    status: 'active',
  });

  // Generate JWT token
  const token = generateToken(user._id, user.role);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  // Find user including password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  if (user.status !== 'active') {
    throw { statusCode: 403, message: 'Account is deactivated. Please contact admin.' };
  }

  // Generate JWT
  const token = generateToken(user._id, user.role);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token,
  };
};

/**
 * Get user by ID (with optional password field)
 */
export const getUserById = async (userId, includePassword = false) => {
  const query = includePassword ? {} : { select: '-password' };
  const user = await User.findById(userId, query.select);

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Get all users (for admin)
 */
export const getAllUsers = async (filters = {}) => {
  const { status, role, page = 1, limit = 50 } = filters;

  const query = {};

  if (status) query.status = status;
  if (role) query.role = role;

  const users = await User.find(query)
    .select('-password')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update user
 */
export const updateUser = async (userId, updateData) => {
  const { name, role, status } = updateData;

  // If updating password, it must be hashed first
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, role, status },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Deactivate user
 */
export const deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status: 'inactive' },
    { new: true }
  ).select('-password');

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Activate user
 */
export const activateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status: 'active' },
    { new: true }
  ).select('-password');

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
