// models/Transaction.model.ts

import mongoose, { Schema, Document } from 'mongoose';

// Define the TransactionType enum
export enum TransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  ADDED = 'ADDED', // Item added to stock (e.g., received from vendor, new purchase)
  RETURNED_TO_VENDOR = 'RETURNED_TO_VENDOR',
  DAMAGE = 'DAMAGE', // Item removed due to damage/spoilage
  TRANSFER_IN_DEPT = 'TRANSFER_IN_DEPT', // Item received from another department within the same hotel
  TRANSFER_OUT_DEPT = 'TRANSFER_OUT_DEPT', // Item sent to another department within the same hotel
  TRANSFER_IN_HOTEL = 'TRANSFER_IN_HOTEL', // Item received from another hotel
  TRANSFER_OUT_HOTEL = 'TRANSFER_OUT_HOTEL', // Item sent to another hotel
}

export interface ITransaction extends Document {
  transactionId: string;
  itemId: mongoose.Schema.Types.ObjectId; // Reference to Item
  hotelId: mongoose.Schema.Types.ObjectId; // Reference to Hotel (origin of transaction)
  departmentId: mongoose.Schema.Types.ObjectId; // Reference to Department (origin of transaction)
  transactionType: TransactionType;
  quantity: number; // Positive or negative based on type
  fromHotelId?: mongoose.Schema.Types.ObjectId; // For inter-hotel transfers
  fromDepartmentId?: mongoose.Schema.Types.ObjectId; // For inter-department transfers
  toHotelId?: mongoose.Schema.Types.ObjectId; // For inter-hotel transfers
  toDepartmentId?: mongoose.Schema.Types.ObjectId; // For inter-department transfers
  notes?: string; // Optional notes/remarks
  performedBy: mongoose.Schema.Types.ObjectId; // Reference to User
  transactionDate: Date;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required for a transaction'],
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required for a transaction'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required for a transaction'],
    },
    transactionType: {
      type: String,
      enum: Object.values(TransactionType), // Ensures only valid enum values are used
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      // Basic validation: quantity can be zero only for specific types if desired,
      // but generally transactions involve movement, so > 0 or < 0
      validate: {
        validator: function (v: number) {
          // For 'ADDED' and 'OPENING_BALANCE' and 'TRANSFER_IN_...' it should be positive
          // For 'RETURNED_TO_VENDOR', 'DAMAGE', 'TRANSFER_OUT_...' it should be positive (or negative in DB representing reduction)
          // The image specifies "positive or negative based on type", so we allow either,
          // but positive is generally used for 'increase' and negative for 'decrease' in stock.
          // We can enforce absolute values in pre-save if desired.
          return typeof v === 'number' && v !== 0; // Quantity must not be zero
        },
        message: 'Quantity must be a non-zero number',
      },
    },
    fromHotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: function (this: any) {
        // Required if transaction involves transfer between hotels
        return (
          this.transactionType === TransactionType.TRANSFER_IN_HOTEL ||
          this.transactionType === TransactionType.TRANSFER_OUT_HOTEL
        );
      },
    },
    fromDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function (this: any) {
        // Required if transaction involves transfer between departments
        return (
          this.transactionType === TransactionType.TRANSFER_IN_DEPT ||
          this.transactionType === TransactionType.TRANSFER_OUT_DEPT
        );
      },
    },
    toHotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: function (this: any) {
        // Required if transaction involves transfer between hotels
        return (
          this.transactionType === TransactionType.TRANSFER_IN_HOTEL ||
          this.transactionType === TransactionType.TRANSFER_OUT_HOTEL
        );
      },
    },
    toDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function (this: any) {
        // Required if transaction involves transfer between departments
        return (
          this.transactionType === TransactionType.TRANSFER_IN_DEPT ||
          this.transactionType === TransactionType.TRANSFER_OUT_DEPT
        );
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed the transaction is required'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now, // Defaults to current date if not provided
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt, as per the image
    // You can add virtuals for easier access to related documents if needed
  }
);

// Pre-save hook for validation based on transaction type and quantity
// This hook ensures that for certain transaction types, the quantity sign is appropriate.
TransactionSchema.pre('save', function (next) {
  // If quantity is provided, apply type-specific validation
  if (this.isModified('quantity') || this.isNew) {
    switch (this.transactionType) {
      case TransactionType.OPENING_BALANCE:
      case TransactionType.ADDED:
      case TransactionType.TRANSFER_IN_DEPT:
      case TransactionType.TRANSFER_IN_HOTEL:
        // These types generally increase stock, so quantity should be positive
        if (this.quantity < 0) {
          return next(
            new Error(`Quantity for ${this.transactionType} must be positive.`)
          );
        }
        break;
      case TransactionType.RETURNED_TO_VENDOR:
      case TransactionType.DAMAGE:
      case TransactionType.TRANSFER_OUT_DEPT:
      case TransactionType.TRANSFER_OUT_HOTEL:
        // These types generally decrease stock.
        // We can store it as positive in the DB and treat it as a deduction in logic,
        // or store it as negative to represent the change directly.
        // The prompt says "positive or negative based on type".
        // Let's ensure it's a non-zero number here, and the logic
        // in your service layer will determine how it affects `currentStock`.
        // If you want to enforce positive values for these types and handle
        // the deduction logic externally, you can add `if (this.quantity < 0)` here.
        if (this.quantity < 0) {
          // If storing as positive and interpreting as deduction:
          // return next(new Error(`Quantity for ${this.transactionType} must be positive.`));
          // If storing as negative directly:
          // This is fine. Just ensure it's not zero.
        }
        break;
      default:
        // Should not happen if enum is enforced, but good for safety
        break;
    }
  }

  // Ensure 'from'/'to' fields are cleared if not relevant to the transaction type
  if (
    ![
      TransactionType.TRANSFER_IN_HOTEL,
      TransactionType.TRANSFER_OUT_HOTEL,
    ].includes(this.transactionType)
  ) {
    this.fromHotelId = undefined;
    this.toHotelId = undefined;
  }
  if (
    ![
      TransactionType.TRANSFER_IN_DEPT,
      TransactionType.TRANSFER_OUT_DEPT,
    ].includes(this.transactionType)
  ) {
    this.fromDepartmentId = undefined;
    this.toDepartmentId = undefined;
  }

  next();
});

const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  TransactionSchema
);

export default Transaction;
