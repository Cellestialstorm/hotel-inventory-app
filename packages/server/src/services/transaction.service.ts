import ItemTransaction from '@/models/ItemTransaction.model';
import Item from '@/models/Item.model'
import mongoose from 'mongoose';
import ApiError from '@/utils/ApiError';
import { ItemTransactionType, UserRole } from '@hotel-inventory/shared';

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
    creatorName?: string;
  }) {
    const t = new ItemTransaction({
      itemId: payload.itemId,
      hotelId: payload.hotelId,
      departmentId: payload.departmentId,
      type: payload.type,
      quantity: payload.quantity,
      remarks: payload.remarks,
      relatedId: payload.relatedId,
      createdBy: payload.createdBy,
      creatorName: payload.creatorName
    });
    await t.save();
    return t;
  },

  async list(filter: any = {}) {
    return ItemTransaction.find(filter).sort({ createdAt: 1 }).populate('itemId', 'name').populate('departmentId', 'name').populate('hotelId', 'name').lean();
  },

  async updateTransaction(
    transactionId: string, 
    user: { userId: string, role: UserRole | string; username: string }, 
    updateData: { quantity: number; reason: string }
  ) {

    if (updateData.quantity < 0) {
        throw new ApiError(400, "Quantity cannot be negative. To completely reverse a transaction, set the quantity to 0.");
    }

    const transaction = await ItemTransaction.findById(transactionId);
    if (!transaction) throw new ApiError(404, 'Transaction not found');

    const item = await Item.findById(transaction.itemId);
    if (!item) throw new ApiError(404, 'Associated Item not found');
    
    const now = new Date();
    const txDate = new Date(transaction.createdAt);

    let isEditAllowed = false;

    if (user.role === UserRole.SUPER_ADMIN) {
        // Super Admins can edit anything anytime
        isEditAllowed = true;
    } 
    else if (user.role === UserRole.MANAGER) {
        // Managers can edit until midnight of the same day
        isEditAllowed = txDate.toDateString() === now.toDateString();
    } 
    else if (user.role === UserRole.HOD) {
        // HODs can edit their own entries within 6 hours
        const hoursElapsed = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);

        const dbCreator = transaction.createdBy?.trim() || '';
        const editorUsername = user.username?.trim() || '';
        const editorId = user.userId?.toString().trim() || '';
        
        const isOwner = (dbCreator === editorUsername) || (dbCreator === editorId);
        
        isEditAllowed = (hoursElapsed <= 6) && isOwner;
    }

    if (!isEditAllowed) {
        throw new ApiError(403, 'Edit window has expired or you do not have permission to edit this transaction');
    }

    const quantityDifference = updateData.quantity - transaction.quantity;
    if (transaction.type === ItemTransactionType.ADD) {
        item.currentStock += quantityDifference;
    } 
    else if (
        transaction.type === ItemTransactionType.DAMAGE ||
        transaction.type === ItemTransactionType.RETURN_VENDOR ||
        transaction.type === ItemTransactionType.TRANSFER_OUT
    ) {
        item.currentStock -= quantityDifference;
        if (item.currentStock < 0) {
            throw new ApiError(400, 'This edit would cause the item stock to drop below zero.');
        }
    }

    await item.save();

    // Push to edit history for the audit log
    transaction.editHistory = transaction.editHistory || [];
    transaction.editHistory.push({
        editedBy: user.userId,
        editedAt: now,
        previousQuantity: transaction.quantity,
        reason: updateData.reason
    });

    transaction.quantity = updateData.quantity;
    transaction.remarks = updateData.reason ? `Edited: ${updateData.reason}` : transaction.remarks;

    await transaction.save();
    return transaction;
  }
};