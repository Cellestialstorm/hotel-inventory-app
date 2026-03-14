import mongoose, { Schema, Document } from "mongoose";
import { ItemTransactionType } from "@hotel-inventory/shared";

export interface IItemTransactionDocument extends Document {
    itemId: mongoose.Types.ObjectId;
    hotelId: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    type: ItemTransactionType;
    quantity: number;
    remarks?: string;
    relatedId?: mongoose.Types.ObjectId;
    createdBy?: string;
    creatorName?: string;
    createdAt: Date;
    updatedAt: Date;
    editHistory?: Array<{
        editedBy: string;
        editedAt: Date;
        previousQuantity: number;
        reason: string;
    }>;
}

const ItemTransactionSchema = new Schema<IItemTransactionDocument>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    type: { type: String, required: true, enum: Object.values(ItemTransactionType) },
    quantity: { type: Number, required: true },
    remarks: { type: String },
    relatedId: { type: Schema.Types.ObjectId },
    createdBy: { type: String },
    creatorName: { type: String },
    editHistory: [{
        editedBy: { type: String, required: true },
        editedAt: { type: Date, default: Date.now },
        previousQuantity: { type: Number, required: true },
        reason: { type: String, required: true }
    }]
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

ItemTransactionSchema.index({ itemId: 1, createdAt: 1 });
ItemTransactionSchema.index({ hotelId: 1, departmentId: 1 });

const ItemTransaction = mongoose.model<IItemTransactionDocument>('ItemTransaction', ItemTransactionSchema);
export default ItemTransaction;