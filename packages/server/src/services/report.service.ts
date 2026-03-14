import Item from '@/models/Item.model';
import ItemTransaction from '@/models/ItemTransaction.model';
import mongoose from 'mongoose';
import { ItemTransactionType } from '@hotel-inventory/shared';
import Department from '@/models/Department.model';
import Hotel from '@/models/Hotel.model';

export const ReportService = {
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

    // 1. Fetch Transactions (Just pulling data, no logic yet)
    const beforeFilter: any = { itemId: { $in: ids } };
    if (from) beforeFilter.createdAt = { $lt: from };

    const inRangeFilter: any = { itemId: { $in: ids } };
    if (from && to) inRangeFilter.createdAt = { $gte: from, $lte: to };
    else if (from) inRangeFilter.createdAt = { $gte: from };
    else if (to) inRangeFilter.createdAt = { $lte: to };

    const beforeTxns = from ? await ItemTransaction.find(beforeFilter).lean() : [];
    const rangeTxns = await ItemTransaction.find(inRangeFilter).lean();

    // 2. Fetch Related Items for Transfers
    const relatedIds = rangeTxns.filter(t => t.relatedId).map(t => t.relatedId);
    const uniqueRelatedIds = [...new Set(relatedIds)];
    const relatedItems = await Item.find({ _id: { $in: uniqueRelatedIds } }).select('hotelId departmentId').lean();
    const relatedItemMap = new Map(relatedItems.map(i => [i._id.toString(), i]));

    // 3. FAST LOOKUPS: Preload Helpers into Hash Maps
    const allDepartments = await Department.find().lean();
    const allHotels = await Hotel.find().lean();
    
    const deptMap = new Map(allDepartments.map(d => [d._id.toString(), d.name]));
    const hotelMap = new Map(allHotels.map(h => [h._id.toString(), h.name]));

    const getDeptName = (id: any) => id ? deptMap.get(id.toString()) || null : null;
    const getHotelName = (id: any) => id ? hotelMap.get(id.toString()) || null : null;

    // 4. FAST MATH: Pre-Calculate Opening Balances
    const openingBalances = new Map<string, number>();
    for (const t of beforeTxns) {
      const id = t.itemId.toString();
      const current = openingBalances.get(id) || 0;
      if (t.type === ItemTransactionType.ADD || t.type === ItemTransactionType.TRANSFER_IN) {
        openingBalances.set(id, current + t.quantity);
      } else {
        openingBalances.set(id, current - t.quantity);
      }
    }

    // 5. FAST SORTING: Group Range Transactions by Item ID
    const rangeTxnsByItem = new Map<string, any[]>();
    for (const t of rangeTxns) {
      const id = t.itemId.toString();
      if (!rangeTxnsByItem.has(id)) rangeTxnsByItem.set(id, []);
      rangeTxnsByItem.get(id)!.push(t); // Fast push!
    }

    // 6. The Final Loop: Only pure O(1) Lookups here!
    const results = items.map(item => {
      const id = item._id.toString();
      const itemHotelId = item.hotelId.toString();

      // Instantly grab pre-calculated data
      const opening = openingBalances.get(id) || 0;
      const range = rangeTxnsByItem.get(id) || [];

      let added = 0;
      let returned = 0;
      let damages = 0;
      let tInDept = 0;
      let tOutDept = 0;
      let tInHotel = 0;
      let tOutHotel = 0;

      const damageDetails: any[] = [];
      const returnDetails: any[] = [];
      const transferDetails: any[] = [];

      for (const t of range) {
          const qty = t.quantity || 0;

          if (t.type === ItemTransactionType.ADD) added += qty;
          if (t.type === ItemTransactionType.RETURN_VENDOR) {
              returned += qty;
              returnDetails.push({ quantity: qty, remarks: t.remarks, date: t.createdAt });
          }
          if (t.type === ItemTransactionType.DAMAGE) {
              damages += qty;
              damageDetails.push({ quantity: qty, remarks: t.remarks, date: t.createdAt });
          }

          if (t.type === ItemTransactionType.TRANSFER_IN || t.type === ItemTransactionType.TRANSFER_OUT) {
              const relatedItem = t.relatedId ? relatedItemMap.get(t.relatedId.toString()) : null;
              let isHotelTransfer = false;
              if (relatedItem) {
                  isHotelTransfer = relatedItem.hotelId.toString() !== itemHotelId;
              }

              if (t.type === ItemTransactionType.TRANSFER_IN) {
                  if (isHotelTransfer) tInHotel += qty; else tInDept += qty;
              } else { 
                  if (isHotelTransfer) tOutHotel += qty; else tOutDept += qty;
              }

              let fromDeptName = null, toDeptName = null;
              let fromHotelName = null, toHotelName = null;

              if (t.type === ItemTransactionType.TRANSFER_OUT) {
                  fromDeptName = getDeptName(t.departmentId); 
                  fromHotelName = getHotelName(t.hotelId);   
                  if (relatedItem) {
                      toDeptName = getDeptName(relatedItem.departmentId);
                      toHotelName = getHotelName(relatedItem.hotelId);
                  }
              } else { 
                   toDeptName = getDeptName(t.departmentId); 
                   toHotelName = getHotelName(t.hotelId);   
                   if (relatedItem) {
                       fromDeptName = getDeptName(relatedItem.departmentId);
                       fromHotelName = getHotelName(relatedItem.hotelId);
                   }
              }

              transferDetails.push({
                  type: t.type,
                  quantity: qty,
                  date: t.createdAt,
                  remarks: t.remarks || null,
                  fromDeptName, toDeptName,
                  fromHotelName, toHotelName,
                  isHotelTransfer
              });
          }
      }

      const closing = opening + added - returned - damages + tInDept - tOutDept + tInHotel - tOutHotel;
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
        returnDetails,
        transferDetails,
        closingBalance: closing,
        minReorderQty: item.minStock || 0,
        shortage,
      };
    });

    return results;
  },

  // ... itemReport function (keep existing or update logic similarly if needed)
  async itemReport(params: any) {
      // ... existing itemReport logic ... 
      // For consistency, you might want to apply the same `relatedItemMap` logic 
      // if itemReport also distinguishes between Dept/Hotel transfers. 
      // Assuming itemReport logic is less critical for the aggregate view right now.
      
      // Placeholder return to satisfy the export if you don't want to rewrite it fully now:
      const { itemId, from, to } = params;
      if (!itemId) throw new Error('Item ID is required');

      const item = await Item.findById(itemId).lean();
      if (!item) throw new Error('Item not found');

      const startDate = from ? new Date(from) : new Date();
      const endDate = to ? new Date(to) : new Date();
      endDate.setHours(23, 59, 59, 999);

      const txns = await ItemTransaction.find({
        itemId,
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: 1 }).lean();

      // FETCH RELATED ITEMS (Optimization)
      const relatedIds = txns.filter(t => t.relatedId).map(t => t.relatedId);
      const uniqueRelatedIds = [...new Set(relatedIds)];
      const relatedItems = await Item.find({ _id: { $in: uniqueRelatedIds } }).select('hotelId').lean();
      const relatedItemMap = new Map(relatedItems.map(i => [i._id.toString(), i]));

      const txnsByDate: Record<string, any[]> = {};
      txns.forEach(t => {
        const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
        if (!txnsByDate[dateStr]) txnsByDate[dateStr] = [];
        txnsByDate[dateStr].push(t);
      });

      const beforeTxns = await ItemTransaction.find({
        itemId,
        createdAt: { $lt: startDate },
      }).lean();

      let previousClosing = beforeTxns.reduce((acc, t) => {
         if (t.type === ItemTransactionType.ADD || t.type === ItemTransactionType.TRANSFER_IN) return acc + t.quantity;
         else return acc - t.quantity;
      }, 0);

      const current = new Date(startDate);
      const result: any[] = [];
      const itemHotelId = item.hotelId.toString();

      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        const dayTxns = txnsByDate[dateStr] || [];

        let added = 0, returned = 0, damages = 0;
        let tInDept = 0, tOutDept = 0, tInHotel = 0, tOutHotel = 0;

        for (const t of dayTxns) {
             const qty = t.quantity;
             if (t.type === ItemTransactionType.ADD) added += qty;
             if (t.type === ItemTransactionType.RETURN_VENDOR) returned += qty;
             if (t.type === ItemTransactionType.DAMAGE) damages += qty;
             
             if (t.type === ItemTransactionType.TRANSFER_IN || t.type === ItemTransactionType.TRANSFER_OUT) {
                 const relatedItem = t.relatedId ? relatedItemMap.get(t.relatedId.toString()) : null;
                 const isHotelTransfer = relatedItem ? relatedItem.hotelId.toString() !== itemHotelId : false;

                 if (t.type === ItemTransactionType.TRANSFER_IN) {
                     if (isHotelTransfer) tInHotel += qty; else tInDept += qty;
                 } else {
                     if (isHotelTransfer) tOutHotel += qty; else tOutDept += qty;
                 }
             }
        }

        const closing = previousClosing + added - returned - damages + tInDept - tOutDept + tInHotel - tOutHotel;
        const shortage = Math.max(0, (item.minStock || 0) - closing);

        result.push({
          date: dateStr,
          openingBalance: previousClosing,
          added, returnedToVendor: returned, damages,
          transferInterDeptIn: tInDept, transferInterDeptOut: tOutDept,
          transferInterHotelIn: tInHotel, transferInterHotelOut: tOutHotel,
          closingBalance: closing, shortage,
        });

        previousClosing = closing;
        current.setDate(current.getDate() + 1);
      }
      return result;
  }
};