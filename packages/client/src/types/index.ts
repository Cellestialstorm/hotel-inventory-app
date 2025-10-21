export interface IUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  hotelId?: string;
  departmentId?: string;
  isActive: boolean;
}

export interface IHotel {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface IDepartment {
  id: string;
  name: string;
  hotelId: string;
  isActive: boolean;
}

export interface IItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  minimumStock: number;
  currentStock: number;
  hotelId: string;
  departmentId: string;
}

export interface ITransaction {
  id: string;
  itemId: string;
  transactionType: TransactionType;
  quantity: number;
  date: Date;
  notes?: string;
  performedBy: string;
  toHotelId?: string;
  toDepartmentId?: string;
}

export enum TransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  ADDED = 'ADDED',
  RETURNED_TO_VENDOR = 'RETURNED_TO_VENDOR',
  DAMAGE = 'DAMAGE',
  TRANSFER_IN_DEPT = 'TRANSFER_IN_DEPT',
  TRANSFER_OUT_DEPT = 'TRANSFER_OUT_DEPT',
  TRANSFER_IN_HOTEL = 'TRANSFER_IN_HOTEL',
  TRANSFER_OUT_HOTEL = 'TRANSFER_OUT_HOTEL',
}

export interface ISummary {
  totalItems: number;
  itemsBelowMinimum: number;
  totalStockValue: number;
  lastUpdated: Date;
}

export interface IStockCalculation {
  openingBalance: number;
  added: number;
  returned: number;
  damages: number;
  transferInDept: number;
  transferOutDept: number;
  transferInHotel: number;
  transferOutHotel: number;
  closingBalance: number;
}
