// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model";
import config from "../../config";
import sendEmail from '../../utils/sendEmail';

interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePicture?: string;
}

interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  // Generate a single access token
  private generateToken(userId: string, email?: string) {
    return jwt.sign(
      { id: userId, email },
      config.jwt_access_token_secret as jwt.Secret,
      { expiresIn: config.jwt_access_token_expires_in as jwt.SignOptions['expiresIn'] }
    );
  }

  // Generate 5-digit OTP
  private generateOTP() {
    return Math.floor(10000 + Math.random() * 90000);
  }

  // Store OTP in user (temp field)
  async storeOTP(email: string, otp: number) {
    await User.updateOne(
      { email },
      {
        $set: {
          otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      }
    );
  }

  // Inside AuthService class

// Signup
async signup(data: SignupData) {
  const { email, password, firstName, lastName, username, profilePicture } = data;

  // Check for existing user (email or username)
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      username ? { username } : {}, // Only check if username provided
    ].filter(Boolean), // Remove empty object if no username
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new Error("Email already in use");
    }
    if (username && existingUser.username === username) {
      throw new Error("Username already taken");
    }
  }

  // Create new user
  const newUser = await User.create({
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save hook
    firstName: firstName?.trim(),
    lastName: lastName?.trim(),
    username: username?.trim(),
    profilePicture,
    
  });

  // Generate OTP for email verification
  /*
   // OTP generation/storage and verification email are currently disabled.
   // If you want to enable email verification later, uncomment the block below.
  // Generate OTP for email verification
  // const otp = this.generateOTP();
  // await this.storeOTP(newUser.email, otp);

  // Send verification email
  // try {
  //   await sendEmail(newUser.email, {
  //     subject: "Verify Your Email - Nebs-IT HR",
  //     text: `Your verification code is ${otp}. It is valid for 10 minutes.`,
  //     emailBody: `
  //       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
  //         <h2>Welcome to Nebs-IT, ${firstName || username || "User"}!</h2>
  //         <p>Your account has been created successfully.</p>
  //         <p style="font-size: 24px; font-weight: bold; color: #e11d48; letter-spacing: 8px;">${otp}</p>
  //         <p>This OTP is valid for <strong>10 minutes</strong>.</p>
  //         <p>If you didn't create this account, please ignore this email.</p>
  //       </div>
  //     `,
  //   });
  // } catch (emailError) {
  //   console.error("Failed to send verification email:", emailError);
  //   // Don't fail signup if email fails (optional: you can choose to delete user here)
  // }
  */

  // Generate tokens (optional: you can skip JWT until verified)
  const tokens = this.generateTokens(newUser._id.toString(), newUser.email);
  const userResponse = this.formatUserResponse(newUser);

  return {
    success: true,
    message: "Account created successfully. Please check your email for OTP verification.",
    user: userResponse,
    tokens, // Optional: remove if you want email verification first
    requiresVerification: true,
  };
}

  // Helper methods
  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign(
      { id: userId, email },
      config.jwt_access_token_secret as jwt.Secret,
      { expiresIn: config.jwt_access_token_expires_in as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      config.jwt_refresh_token_secret as jwt.Secret,
      { expiresIn: config.jwt_refresh_token_expires_in as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
  }

private formatUserResponse(user: any) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    profilePicture: user.profilePicture,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

  // Verify OTP
//   async verifyOtp(email: string, otp: number) {
//     const user = await User.findOne({ email });

//     if (!user) throw new Error("User not found");
//     if (user.isEmailVerified) throw new Error("Email already verified");

//     if (!user.otp || !user.otpExpiresAt || user.otp !== otp || user.otpExpiresAt < new Date()) {
//       throw new Error("Invalid or expired OTP");
//     }

//     user.isEmailVerified = true;
//     user.otp = undefined;
//     user.otpExpiresAt = undefined;
//     await user.save();

//     const token = this.generateToken(user._id.toString());
//     return { token, user: { id: user._id, email: user.email, name: user.firstName } };
//   }

  // Login
  async login(data: LoginData) {
    const { email, password } = data;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid credentials");

    if (!user.isActive) throw new Error("Account is deactivated");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Invalid credentials");

    const tokens = this.generateTokens(user._id.toString(), user.email);
    const userResponse = this.formatUserResponse(user);

    return {
      tokens,
      user: userResponse,
    };
  }

  // Get current user
  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload: any = jwt.verify(refreshToken, config.jwt_refresh_token_secret);
      const userId = payload?.id;
      if (!userId) throw new Error('Invalid refresh token payload');

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      if (!user.isActive) throw new Error('Account is deactivated');

      const newAccessToken = this.generateToken(userId.toString(), user.email);
      return newAccessToken;
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Logout (placeholder) — if you use a token store/blacklist implement it here
  async logout(userId: string) {
    // No persistent refresh token store currently — nothing to revoke server-side
    return true;
  }

  // Forgot Password
//   async forgotPassword(email: string) {
//     const user = await User.findOne({ email });
//     if (!user) throw new Error("No account with that email");

//     const resetToken = Math.random().toString(36).substring(2, 15);
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
//     await user.save();

//     const resetUrl = `${config.app.frontendUrl}/reset-password/${resetToken}`;

//     // await sendEmail({
//     //   to: email,
//     //   subject: "Password Reset Request",
//     //   html: `<p>You requested a password reset</p><p>Click <a href="${resetUrl}">here</a> to reset your password</p><p>Link expires in 15 minutes.</p>`,
//     // });

//     return { message: "Reset link sent to email" };
//   }

  // Reset Password
//   async resetPassword(token: string, newPassword: string) {
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: new Date() },
//     });

//     if (!user) throw new Error("Invalid or expired reset token");

//     user.password = newPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     return { message: "Password reset successful" };
//   }

  // Change Password (logged in)
//   async changePassword(userId: string, currentPassword: string, newPassword: string) {
//     const user = await User.findById(userId).select("+password");
//     if (!user) throw new Error("User not found");

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) throw new Error("Current password is incorrect");

//     user.password = newPassword;
//     await user.save();

//     return { message: "Password changed successfully" };
//   }

  // Change Username
  async changeUsername(userId: string, newUsername: string, password: string) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new Error("User not found");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Incorrect password");

    const existing = await User.findOne({ username: newUsername });
    if (existing) throw new Error("Username already taken");

    user.username = newUsername;
    await user.save();

    return { message: "Username updated successfully" };
  }
}

export const authService = new AuthService();