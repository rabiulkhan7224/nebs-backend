import { z } from "zod";

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" }),
  }),

});

const signupValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long.")
      .max(30, "Username must be less than 30 characters.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores."
      )
      .optional(),
      profilePicture:z.string().optional(),
  }),
  
});
const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(6, {
        message: "Current password must be at least 6 characters long",
      }),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(6, { message: "New password must be at least 6 characters long" }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z
    .object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match!",
      path: ["confirmPassword"],
    }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
      })
      .email({ message: "Invalid email address" }),
  }),
});

const resendOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    otp: z
      .number({
        required_error: "OTP is required",
        invalid_type_error: "OTP must be a number",
      })
      .int({ message: "OTP must be an integer" })
      .min(10000, { message: "OTP must be 5 digits" })
      .max(99999, { message: "OTP must be 5 digits" }),
  }),
});



const changeUserNameValidationSchema = z.object({
  body: z.object({
    newUserName: z
      .string({
        required_error: "New username is required.",
        invalid_type_error: "New username must be a string.",
      })
      .min(3, "Username must be at least 3 characters long.")
      .max(30, "Username must be less than 30 characters.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores."
      ),
    password: z
      .string({
        required_error: "Password is required.",
        invalid_type_error: "Password must be a string.",
      })
      .min(6, "Password must be at least 6 characters long."),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
    signupValidationSchema,
  resendOtpValidationSchema,
  verifyOtpValidationSchema,

  resetPasswordValidationSchema,
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  changeUserNameValidationSchema,
};
