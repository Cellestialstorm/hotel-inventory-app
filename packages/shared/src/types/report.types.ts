export interface IStockLevelReportData {
    itemID: string;
    itemName: string;
    itemUnit: string;
    departmentName: string;
    currentQuantity: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    status: 'OK' | 'LOW' | 'HIGH' | 'UNKNOWN'
}

export interface IStockLevelReport {
    reportID: string;
    hotelID: string;
    generatedAt: Date;
    filters?: {
        departmentID?: string;
        categoryID?: string;   
    };
    data: IStockLevelReportData[];
}