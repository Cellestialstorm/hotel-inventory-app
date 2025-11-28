import Item from '@/models/Item.model';
import ItemTransaction from '@/models/ItemTransaction.model';
import mongoose from 'mongoose';
import { ItemTransactionType } from '@hotel-inventory/shared';
import Department from '@/models/Department.model';
import Hotel from '@/models/Hotel.model';


export const ReportService = {
  // params: { hotelId?, departmentId?, from?, to?, itemId? }
  async stockReport(params: any) {
    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    const itemFilter: any = { isActive: true };
    if (params.hotelId) itemFilter.hotelId = new mongoose.Types.ObjectId(params.hotelId);
    if (params.departmentId) itemFilter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
    if (params.itemId) itemFilter._id = new mongoose.Types.ObjectId(params.itemId);

    const items = await Item.find(itemFilter).lean();
    const ids = items.map(i => i._id);

    const beforeFilter: any = { itemId: { $in: ids } };
    if (from) beforeFilter.createdAt = { $lt: from };

    const inRangeFilter: any = { itemId: { $in: ids } };
    if (from && to) inRangeFilter.createdAt = { $gte: from, $lte: to };
    else if (from) inRangeFilter.createdAt = { $gte: from };
    else if (to) inRangeFilter.createdAt = { $lte: to };

    const beforeTxns = from ? await ItemTransaction.find(beforeFilter).lean() : [];
    const rangeTxns = await ItemTransaction.find(inRangeFilter).lean();

    // Preload all dept/hotel names for mapping
    const allDepartments = await Department.find().lean();
    const allHotels = await Hotel.find().lean();

    const getDeptName = (id: any) => {
      const d = allDepartments.find(x => x._id.toString() === id?.toString());
      return d?.name || null;
    };

    const getHotelName = (id: any) => {
      const h = allHotels.find(x => x._id.toString() === id?.toString());
      return h?.name || null;
    };

    const results = await Promise.all(items.map(async item => {
      const id = item._id.toString();

      const opening = beforeTxns
        .filter(t => t.itemId.toString() === id)
        .reduce((acc, t) => {
          switch (t.type) {
            case ItemTransactionType.ADD: return acc + t.quantity;
            case ItemTransactionType.RETURN_VENDOR: return acc - t.quantity;
            case ItemTransactionType.DAMAGE: return acc - t.quantity;
            case ItemTransactionType.TRANSFER_IN: return acc + t.quantity;
            case ItemTransactionType.TRANSFER_OUT: return acc - t.quantity;
            default: return acc;
          }
        }, 0);

      const range = rangeTxns.filter(t => t.itemId.toString() === id);

      const added = sum(range, ItemTransactionType.ADD);
      const returned = sum(range, ItemTransactionType.RETURN_VENDOR);
      const damages = sum(range, ItemTransactionType.DAMAGE);

      const tInDept = sum(
        range.filter(t => t.type === ItemTransactionType.TRANSFER_IN && t.hotelId.toString() === item.hotelId.toString()),
        ItemTransactionType.TRANSFER_IN
      );
      const tOutDept = sum(
        range.filter(t => t.type === ItemTransactionType.TRANSFER_OUT && t.hotelId.toString() === item.hotelId.toString()),
        ItemTransactionType.TRANSFER_OUT
      );

      const tInHotel = sum(
        range.filter(t => t.type === ItemTransactionType.TRANSFER_IN && t.hotelId.toString() !== item.hotelId.toString()),
        ItemTransactionType.TRANSFER_IN
      );
      const tOutHotel = sum(
        range.filter(t => t.type === ItemTransactionType.TRANSFER_OUT && t.hotelId.toString() !== item.hotelId.toString()),
        ItemTransactionType.TRANSFER_OUT
      );

      // DAMAGE DETAILS
      const damageDetails = range
        .filter(t => t.type === ItemTransactionType.DAMAGE)
        .map(t => ({
          quantity: t.quantity,
          remarks: t.remarks || null,
          date: t.createdAt,
        }));

      const transferDetails: any[] = [];

      for (const t of range.filter(t =>
        t.type === ItemTransactionType.TRANSFER_IN ||
        t.type === ItemTransactionType.TRANSFER_OUT
      )) {

        let fromDeptName = null;
        let toDeptName = null;
        let fromHotelName = null;
        let toHotelName = null;

        if (t.type === ItemTransactionType.TRANSFER_OUT) {
          // THIS ITEM = SOURCE
          fromDeptName = getDeptName(t.departmentId);
          fromHotelName = getHotelName(t.hotelId);

          // DESTINATION ITEM = RELATED ID
          if (t.relatedId) {
            const destItem = await Item.findById(t.relatedId).lean();
            if (destItem) {
              toDeptName = getDeptName(destItem.departmentId);
              toHotelName = getHotelName(destItem.hotelId);
            }
          }
        }

        if (t.type === ItemTransactionType.TRANSFER_IN) {
          // THIS ITEM = DESTINATION
          toDeptName = getDeptName(t.departmentId);
          toHotelName = getHotelName(t.hotelId);

          // SOURCE ITEM = RELATED ID
          if (t.relatedId) {
            const srcItem = await Item.findById(t.relatedId).lean();
            if (srcItem) {
              fromDeptName = getDeptName(srcItem.departmentId);
              fromHotelName = getHotelName(srcItem.hotelId);
            }
          }
        }

        transferDetails.push({
          type: t.type,
          quantity: t.quantity,
          date: t.createdAt,
          remarks: t.remarks || null,
          fromDeptName,
          toDeptName,
          fromHotelName,
          toHotelName,
        });
      }

      const closing =
        opening +
        added -
        returned -
        damages +
        tInDept -
        tOutDept +
        tInHotel -
        tOutHotel;

      const shortage = Math.max(0, (item.minStock || 0) - closing);

      return {
        itemId: id,
        name: item.name,
        openingBalance: opening,
        added,
        returnedToVendor: returned,
        damages,
        transferInterDeptIn: tInDept,
        transferInterDeptOut: tOutDept,
        transferInterHotelIn: tInHotel,
        transferInterHotelOut: tOutHotel,
        damageDetails,
        transferDetails,
        closingBalance: closing,
        minReorderQty: item.minStock || 0,
        shortage,
      };
    }));

    return results;
  },
  async itemReport(params: any) {
    const { itemId, from, to } = params;
    if (!itemId) throw new Error('Item ID is required');

    const item = await Item.findById(itemId).lean();
    if (!item) throw new Error('Item not found');

    const startDate = from ? new Date(from) : new Date();
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Fetch all transactions within range
    const txns = await ItemTransaction.find({
      itemId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: 1 }).lean();

    // Group transactions by date
    const txnsByDate: Record<string, any[]> = {};
    txns.forEach(t => {
      const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
      if (!txnsByDate[dateStr]) txnsByDate[dateStr] = [];
      txnsByDate[dateStr].push(t);
    });

    // Find transactions before start date for opening
    const beforeTxns = await ItemTransaction.find({
      itemId,
      createdAt: { $lt: startDate },
    }).lean();

    let previousClosing = beforeTxns.reduce((acc, t) => {
      switch (t.type) {
        case ItemTransactionType.ADD: return acc + t.quantity;
        case ItemTransactionType.RETURN_VENDOR: return acc - t.quantity;
        case ItemTransactionType.DAMAGE: return acc - t.quantity;
        case ItemTransactionType.TRANSFER_IN: return acc + t.quantity;
        case ItemTransactionType.TRANSFER_OUT: return acc - t.quantity;
        default: return acc;
      }
    }, 0);

    // Generate date-wise data
    const current = new Date(startDate);
    const result: any[] = [];

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayTxns = txnsByDate[dateStr] || [];

      const added = sum(dayTxns, ItemTransactionType.ADD);
      const returned = sum(dayTxns, ItemTransactionType.RETURN_VENDOR);
      const damages = sum(dayTxns, ItemTransactionType.DAMAGE);
      const tInDept = sum(
        dayTxns.filter(
          t =>
            t.type === ItemTransactionType.TRANSFER_IN &&
            t.hotelId?.toString() === item.hotelId.toString()
        ),
        ItemTransactionType.TRANSFER_IN
      );
      const tOutDept = sum(
        dayTxns.filter(
          t =>
            t.type === ItemTransactionType.TRANSFER_OUT &&
            t.hotelId?.toString() === item.hotelId.toString()
        ),
        ItemTransactionType.TRANSFER_OUT
      );
      const tInHotel = sum(
        dayTxns.filter(
          t =>
            t.type === ItemTransactionType.TRANSFER_IN &&
            t.hotelId?.toString() !== item.hotelId.toString()
        ),
        ItemTransactionType.TRANSFER_IN
      );
      const tOutHotel = sum(
        dayTxns.filter(
          t =>
            t.type === ItemTransactionType.TRANSFER_OUT &&
            t.hotelId?.toString() !== item.hotelId.toString()
        ),
        ItemTransactionType.TRANSFER_OUT
      );

      const closing =
        previousClosing +
        added -
        returned -
        damages +
        tInDept -
        tOutDept +
        tInHotel -
        tOutHotel;

      const shortage = Math.max(0, (item.minStock || 0) - closing);

      result.push({
        date: dateStr,
        openingBalance: previousClosing,
        added,
        returnedToVendor: returned,
        damages,
        transferInterDeptIn: tInDept,
        transferInterDeptOut: tOutDept,
        transferInterHotelIn: tInHotel,
        transferInterHotelOut: tOutHotel,
        closingBalance: closing,
        shortage,
      });

      previousClosing = closing;
      current.setDate(current.getDate() + 1);
    }

    return result;
  }
};

function sum(arr: any[], type: any) {
  return arr.filter(t => t.type === type).reduce((s, t) => s + (t.quantity || 0), 0);
}