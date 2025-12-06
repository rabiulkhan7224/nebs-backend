// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model";
import config from "../../config";

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
  // Generate JWT
  private generateToken(userId: string) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
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

  // Signup
  async signup(data: SignupData) {
    const { email, password, firstName, lastName, username, profilePicture } = data;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) throw new Error("Email already in use");
      if (existingUser.username === username) throw new Error("Username already taken");
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      username,
      profilePicture,
    });

    // const otp = this.generateOTP();
    // await this.storeOTP(email, otp);

    // Send OTP Email
    // await sendEmail({
    //   to: email,
    //   subject: "Verify Your Email - Nebs-IT",
    //   text: `Your verification OTP is: ${otp}`,
    //   html: `<h2>Welcome to Nebs-IT!</h2><p>Your OTP is <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`,
    // });

    return { user: { id: user._id, email: user.email }, message: "OTP sent to email" };
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

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
        role: user.role,
      },
    };
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