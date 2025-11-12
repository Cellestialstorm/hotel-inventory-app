import mongoose from 'mongoose'
import { ItemTransactionType } from '../enums';

export interface IItem {
    itemId: string;
    name: string;
    hotelId: mongoose.Types.ObjectId | string;
    departmentId: mongoose.Types.ObjectId | string;
    currentStock: number;
    minStock: number;
    isDamaged?: boolean;
    isDiscarded?: boolean;
    remarks?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateItemRequest {
    name: string;
    hotelId: string;
    departmentId: string;
    quantityAdded: number;
    minStock: number;
    password?: string;
}

export interface IUpdateItemRequest {
    name?: string;
    departmentId?: string;
    hotelId?: string;
    minStock?: number;
    currentStock?: number;
}

export interface ITransferItemRequest {
    itemId: string;
    toHotelId?: string;
    toDepartmentId?: string;
    quantity: number;
    remarks?: string;
}

export interface IMarkDamageRequest {
    itemId: string;
    quantity?: number;
    remarks?: string;
    password?: string;
}

export interface IDiscardItemRequest {
    itemId: string;
    remarks?: string;
    adminPassword?: string;
}

export interface IItemTransaction {
    transactionId: string;
    itemId: string;
    hotelId: mongoose.Types.ObjectId | string;
    departmentId: mongoose.Types.ObjectId | string;
    type: ItemTransactionType;
    quantity: number;
    remarks?: string;
    relatedId?: string;
    createdBy?: string;
    createdAt: Date;
}

