import ItemTransaction from '@/models/ItemTransaction.model';
import mongoose from 'mongoose';
import { ItemTransactionType } from '@hotel-inventory/shared';

export const TransactionService = {
  async create(payload: {
    itemId: string | mongoose.Types.ObjectId;
    hotelId: string | mongoose.Types.ObjectId;
    departmentId: string | mongoose.Types.ObjectId;
    type: ItemTransactionType;
    quantity: number;
    remarks?: string;
    relatedId?: string;
    createdBy?: string;
  }) {
    const t = new ItemTransaction({
      itemId: payload.itemId,
      hotelId: payload.hotelId,
      departmentId: payload.departmentId,
      type: payload.type,
      quantity: payload.quantity,
      remarks: payload.remarks,
      relatedId: payload.relatedId,
      createdBy: payload.createdBy
    });
    await t.save();
    return t;
  },

  async list(filter: any = {}) {
    return ItemTransaction.find(filter).sort({ createdAt: 1 }).lean();
  }
};