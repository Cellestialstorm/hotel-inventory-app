import { UserRole } from "../enums";
import mongoose, { Document } from "mongoose";

export interface IUSER extends Document {
    userId: string;
    username: string;
    role: UserRole;
    assignedHotelId: mongoose.Types.ObjectId,
    assignedDepartmentId: mongoose.Types.ObjectId,
    password?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;
    comparePassword(password: string): Promise<boolean>;
}

export type IUserRole = UserRole;

export interface IUserPermissions {
    // Example structure, adjust based on your needs
    [key: string]: boolean; // e.g., { 'manage:users': true, 'view:reports': true }
    // Or define explicitly:
    // canManageUsers?: boolean;
    // canManageInventory?: boolean;
}

export type IClientUser = Omit<IUSER, 'password'>;