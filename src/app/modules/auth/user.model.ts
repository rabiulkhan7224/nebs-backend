import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../../config';

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: 'admin' | 'hr' | 'employee';
  department?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance method
  comparePassword(enteredPassword: string): Promise<boolean>;
}

/**
 * User Schema
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Exclude from query results by default
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls while keeping uniqueness for non-null values
      trim: true,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['admin', 'hr', 'employee'],
      default: 'employee',
    },
    department: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Important: allows null values while keeping unique constraint
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function (next) {
  // Only hash if password is modified (or new)
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Compare entered password with hashed password
 */
UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Ensure indexes are created (optional but recommended)
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

/**
 * Export User model
 */
const User = model<IUser>('User', UserSchema);

export default User;