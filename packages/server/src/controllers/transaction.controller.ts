import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { TransactionService } from '@/services/transaction.service';
import ApiResponse from '@/utils/ApiResponse';
import mongoose from 'mongoose';
import ApiError from '@/utils/ApiError';

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { hotelId, departmentId, type, startDate, endDate } = req.query;
    
    let filter: any = {};
    
    // If user is a Manager or HOD, strictly limit their view to their assigned areas
    if (req.user?.role === 'MANAGER' && req.user.assignedHotelId) {
        filter.hotelId = new mongoose.Types.ObjectId(req.user.assignedHotelId);
    } else if (hotelId) {
        filter.hotelId = new mongoose.Types.ObjectId(hotelId as string);
    }

    if (req.user?.role === 'HOD' && req.user.assignedDepartmentId) {
        filter.departmentId = new mongoose.Types.ObjectId(req.user.assignedDepartmentId);
    } else if (departmentId) {
        filter.departmentId = new mongoose.Types.ObjectId(departmentId as string);
    }

    if (type) filter.type = type;
    
    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
        };
    }

    const transactions = await TransactionService.list(filter);
    res.status(200).json(new ApiResponse(200, transactions, 'Transactions fetched successfully'));
});


export const editTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (quantity === undefined || quantity === null || !reason) {
        throw new ApiError(400, "Quantity and a Reason are required for auditing purposes.");
    }

    // Pass the user object so the service can calculate the time-lock!
    const updatedTx = await TransactionService.updateTransaction(
        id, 
        { userId: req.user?.userId || '', role: (req.user?.role as any) || '', username: req.user?.username || '' }, 
        { quantity: Number(quantity), reason }
    );

    res.status(200).json(new ApiResponse(200, updatedTx, 'Transaction edited and stock updated successfully'));
});