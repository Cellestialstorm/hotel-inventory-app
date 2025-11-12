import mongoose, { Schema, Document } from 'mongoose';

export interface IItemDocument extends Document {
  name: string;
  hotelId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  currentStock: number;
  minStock: number;
  category?: string;
  unit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItemDocument>({
  name: { type: String, required: true, trim: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  category: { type: String },
  unit: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ItemSchema.virtual('itemId').get(function () { return this._id.toHexString(); });
ItemSchema.set('toJSON', { virtuals: true });
ItemSchema.index({ name: 1, hotelId: 1, departmentId: 1 });

export default mongoose.model<IItemDocument>('Item', ItemSchema);