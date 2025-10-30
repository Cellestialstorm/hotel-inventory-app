import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@hotel-inventory/shared';
import type { IUSER } from '@hotel-inventory/shared';

/**
 * Mongoose schema for the User model.
 */
const UserSchema: Schema<IUSER> = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required.'],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole), // Restricts values to the defined roles.
      default: UserRole.USER,
      required: true,
    },
    assignedHotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel', // This assumes you have a 'Hotel' model.
      required: [true, 'User must be assigned to a hotel.'],
    },
    assignedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', // This assumes you have a 'Department' model.
      required: [true, 'User must be assigned to a department.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- MIDDLEWARE / HOOKS ---

/**
 * Pre-save hook to automatically hash the user's password before saving.
 * This middleware runs only if the password field is new or has been modified.
 * It uses a regular function to ensure `this` correctly refers to the document instance.
 */
UserSchema.pre<IUSER>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    // Pass any errors to the next middleware.
    next(error);
  }
});

// --- SCHEMA METHODS ---

/**
 * An instance method to compare a candidate password with the user's stored hash.
 * @param {string} enteredPassword The password string to validate.
 * @returns {Promise<boolean>} A promise that resolves to true if passwords match, false otherwise.
 */
UserSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  // `this.password` is available on this document instance for comparison.
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUSER>('User', UserSchema);

export default User;