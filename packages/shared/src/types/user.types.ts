import { UserRole } from "../enums";

export interface IUSER {
    userID: string;
    username: string;
    role: UserRole;
    hotelID: string;
    departmentID: string;
    email: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;

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