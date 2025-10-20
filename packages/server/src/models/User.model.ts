import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Import the shared enum and types using the package reference
import { UserRole } from '@hotel-inventory/shared';
import type { IUSER } from '@hotel-inventory/shared';

/**
 * TypeScript interface for the User document, providing type safety.
 * Extends the shared IUSER interface with Mongoose Document properties.
 */
export interface IUser extends Document, Omit<IUSER, 'hotelID' | 'departmentID' | 'userID'> {
  userId: string; // Using camelCase to match existing schema
  assignedHotelId: mongoose.Schema.Types.ObjectId;
  assignedDepartmentId: mongoose.Schema.Types.ObjectId;
  password?: string; // Optional because it's excluded from queries by default.
  comparePassword(password: string): Promise<boolean>; // Method for password validation.
}

/**
 * Mongoose schema for the User model.
 */
const UserSchema: Schema<IUser> = new Schema(
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
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false, // CRITICAL: Prevents the password hash from being returned in query results.
    },
    role: {
      type: String,
      enum: Object.values(UserRole), // Restricts values to the defined roles.
      default: UserRole.STAFF,
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
    // This option automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
  }
);

// --- MIDDLEWARE / HOOKS ---

/**
 * Pre-save hook to automatically hash the user's password before saving.
 * This middleware runs only if the password field is new or has been modified.
 * It uses a regular function to ensure `this` correctly refers to the document instance.
 */
UserSchema.pre<IUser>('save', async function (next) {
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
  // Note: For this method to work during login, you must explicitly fetch the user
  // with the password field, e.g., `User.findOne({..}).select('+password')`.
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;