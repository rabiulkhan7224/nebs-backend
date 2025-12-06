import { RequestHandler } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import status from 'http-status';
import AppError from '../../errors/AppError';
import { ILoginRequest, ISignupRequest } from './auth.interface';
import { authService } from './auth.service';

/**
 * User Signup Controller
 * Handles user registration
 */
const signup: RequestHandler = catchAsync(async (req, res) => {
  const signupData: ISignupRequest = req.body;

  const result = await authService.signup(signupData);

  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: 'User registered successfully!',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken
    }
  });
});

/**
 * User Login Controller
 * Handles user authentication
 */
const login: RequestHandler = catchAsync(async (req, res) => {
  const loginData: ILoginRequest = req.body;

  const result = await authService.login(loginData);

  res.cookie('accessToken', result.tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: 'User logged in successfully!',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken
    }
  });
});

/**
 * Get Current User Profile Controller
 * Retrieves the authenticated user's information
 */
const getMe: RequestHandler = catchAsync(async (req, res) => {
  // The user payload should be added to the request by the auth middleware
  const userPayload = (req as any).user 
  const userId = userPayload.user_id || userPayload.userId || (req as any).userId;

  if (!userId) {
    throw new AppError(401, 'auth', 'User not authenticated');
  }

  const user = await authService.getMe(userId);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: 'User profile retrieved successfully!',
    data: user
  });
});

/**
 * Refresh Access Token Controller
 * Generates a new access token using the refresh token
 */
const refreshAccessToken: RequestHandler = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AppError(401, 'auth', 'Refresh token not found');
  }

  const newAccessToken = await authService.refreshAccessToken(refreshToken);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: 'Access token refreshed successfully!',
    data: {
      accessToken: newAccessToken
    }
  });
});

/**
 * Logout Controller
 * Handles user logout
 */
const logout: RequestHandler = catchAsync(async (req, res) => {
  const userPayload = (req as any).user || {};
  const userId = userPayload.user_id || userPayload.userId || (req as any).userId;

  if (!userId) {
    throw new AppError(401, 'auth', 'User not authenticated');
  }

  await authService.logout(userId);

  res.clearCookie('refreshToken');

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: 'User logged out successfully!',
    data: null
  });
});

export const AuthController = {
  signup,
  login,
  getMe,
  refreshAccessToken,
  logout
};
