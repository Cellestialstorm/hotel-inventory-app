import { UserRole } from "../enums";
import mongoose, { Document } from "mongoose";

export interface IUserAttributes {
    userId: string;
    username: string;
    role: UserRole;
    assignedHotelId: mongoose.Types.ObjectId,
    assignedDepartmentId: mongoose.Types.ObjectId,
    password?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;
}

export interface IUSER extends IUserAttributes, Document {
  comparePassword(password: string): Promise<boolean>;
}


export interface IUpdateUserRequest extends Partial<Omit<IUSER, 'userId' | 'createdAt' | 'updatedAt'>>{
    password?: string;
}

export interface IUserPermissions {
    // Example structure, adjust based on your needs
    [key: string]: boolean; // e.g., { 'manage:users': true, 'view:reports': true }
    // Or define explicitly:
    // canManageUsers?: boolean;
    // canManageInventory?: boolean;
}

export type IClientUser = Omit<IUserAttributes, 'password'>;