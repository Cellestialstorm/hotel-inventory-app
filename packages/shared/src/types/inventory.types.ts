export interface IItem {
    itemID: string;
    name: string;
    description?: string;
    unit: string;
    category: string;
    minStockLevel?: number;
    maxStockLevel?: number;
    hotelID: string;
    averageCost?: number;
    supplierInfo?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IINventorySnapshot {
    snapshotID: string;
    itemID: string;
    hotelID: string;
    departmentID: string;
    quantityOnHand: number;
    snapshotTimestamp: Date;
    estimatedValue?: number;
}

export interface ICurrentStock {
    stockID: string;
    itemID: string;
    hotelID: string;
    departmentID: string;
    currentQuantity: number;
    lastUpdated: Date;
}