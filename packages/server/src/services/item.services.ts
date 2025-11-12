import Item from '@/models/Item.model';
import Hotel from '@/models/Hotel.model';
import Department from '@/models/Department.model';
import ApiError from '@/utils/ApiError';
import mongoose from 'mongoose';
import { TransactionService } from '@/services/transaction.service';
import { ItemTransactionType } from '@hotel-inventory/shared';

export const ItemService = {
  async createItem(payload: {
    name: string; hotelId: string; departmentId: string; quantityAdded: number; minStock: number; category?: string; unit?: string; createdBy?: string;
  }) {
    const hId = new mongoose.Types.ObjectId(payload.hotelId);
    const dId = new mongoose.Types.ObjectId(payload.departmentId);
    const hotel = await Hotel.findById(hId);
    const dept = await Department.findById(dId);
    if (!hotel || !dept) throw new ApiError(404, 'Hotel or Department not found', 'REFERENCE_NOT_FOUND');

    let item = await Item.findOne({ name: payload.name, hotelId: hId, departmentId: dId });
    if (item) {
      item.currentStock += payload.quantityAdded;
      item.minStock = payload.minStock ?? item.minStock;
      item.category = payload.category ?? item.category;
      item.unit = payload.unit ?? item.unit;
      await item.save();
    } else {
      item = new Item({
        name: payload.name,
        hotelId: hId,
        departmentId: dId,
        currentStock: payload.quantityAdded,
        minStock: payload.minStock,
        category: payload.category,
        unit: payload.unit
      });
      await item.save();
    }

    await TransactionService.create({
      itemId: item._id,
      hotelId: hId,
      departmentId: dId,
      type: ItemTransactionType.ADD,
      quantity: payload.quantityAdded,
      createdBy: payload.createdBy
    });

    return item;
  },

  async updateItem(itemId: string, data: Partial<{ name: string; minStock: number; category?:string; unit?:string }>) {
    const item = await Item.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found', 'ITEM_NOT_FOUND');

    if (data.name) item.name = data.name;
    if (data.minStock !== undefined) item.minStock = data.minStock;
    if (data.category !== undefined) item.category = data.category;
    if (data.unit !== undefined) item.unit = data.unit;
    await item.save();

    return item;
  },

  async deleteItem(itemId: string) {
    const item = await Item.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found', 'ITEM_NOT_FOUND');
    // soft delete
    item.isActive = false;
    await item.save();
    return true;
  },

  async markDamage(itemId: string, qty: number, remarks?: string, user?: any) {
    const item = await Item.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found', 'ITEM_NOT_FOUND');
    if (item.currentStock < qty) throw new ApiError(400, 'Insufficient stock', 'INSUFFICIENT_STOCK');

    item.currentStock -= qty;
    await item.save();

    await TransactionService.create({
      itemId: item._id,
      hotelId: item.hotelId,
      departmentId: item.departmentId,
      type: ItemTransactionType.DAMAGE,
      quantity: qty,
      remarks,
      createdBy: user?.username
    });
    return item;
  },

  async transfer(itemId: string, toHotelId: string | undefined, toDeptId: string | undefined, qty: number, remarks?: string, user?: any) {
    const item = await Item.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found', 'ITEM_NOT_FOUND');
    if (item.currentStock < qty) throw new ApiError(400, 'Insufficient stock', 'INSUFFICIENT_STOCK');

    item.currentStock -= qty;
    await item.save();

    await TransactionService.create({
      itemId: item._id,
      hotelId: item.hotelId,
      departmentId: item.departmentId,
      type: ItemTransactionType.TRANSFER_OUT,
      quantity: qty,
      remarks,
      createdBy: user?.username
    });

    const destHotel = toHotelId ? new mongoose.Types.ObjectId(toHotelId) : item.hotelId;
    const destDept = toDeptId ? new mongoose.Types.ObjectId(toDeptId) : item.departmentId;

    let target = await Item.findOne({ name: item.name, hotelId: destHotel, departmentId: destDept });
    if (!target) {
      target = new Item({
        name: item.name,
        hotelId: destHotel,
        departmentId: destDept,
        currentStock: qty,
        minStock: item.minStock,
        category: item.category,
        unit: item.unit
      });
      await target.save();
    } else {
      target.currentStock += qty;
      await target.save();
    }

    await TransactionService.create({
      itemId: target._id,
      hotelId: destHotel,
      departmentId: destDept,
      type: ItemTransactionType.TRANSFER_IN,
      quantity: qty,
      relatedId: item._id,
      remarks,
      createdBy: user?.username
    });

    return { from: item, to: target };
  },

  async list(filter: any = {}) {
    const q: any = { isActive: true };
    if (filter.hotelId) q.hotelId = new mongoose.Types.ObjectId(filter.hotelId);
    if (filter.departmentId) q.departmentId = new mongoose.Types.ObjectId(filter.departmentId);
    if (filter.search) q.name = { $regex: String(filter.search), $options: 'i' };
    return Item.find(q).populate('hotelId', 'name').populate('departmentId', 'name').lean();
  }
};