// models/Item.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  itemId: string;
  itemName: string;
  itemCode: string; // Unique per hotel and department
  category: string;
  unit: string; // e.g., kg, liters, pieces
  hotelId: mongoose.Schema.Types.ObjectId; // Reference to Hotel model
  departmentId: mongoose.Schema.Types.ObjectId; // Reference to Department model
  minimumStock: number;
  currentStock?: number; // Calculated field, optional
  isActive: boolean;
  createdBy: mongoose.Schema.Types.ObjectId; // Reference to User model
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema(
  {
    itemId: {
      type: String,
      required: [true, 'Item ID is required'],
      unique: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel', // Assuming a Hotel model exists
      required: [true, 'Hotel ID is required'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', // Assuming a Department model exists
      required: [true, 'Department ID is required'],
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock is required'],
      min: [0, 'Minimum stock cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0, // Default to 0, can be updated later
      min: [0, 'Current stock cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming a User model exists for tracking creation
      required: [true, 'Created by user ID is required'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Add compound index for hotelId, departmentId, and itemCode to ensure uniqueness
ItemSchema.index(
  { hotelId: 1, departmentId: 1, itemCode: 1 },
  { unique: true }
);

// You might want to add pre-save or pre-update hooks for currentStock calculations
// or other validations if 'currentStock' is truly a calculated field that
// needs to be derived from other inventory movements. For now, it's a direct field.

const Item = mongoose.model<IItem>('Item', ItemSchema);

export default Item;
