export interface IStockReportParams {
    hotelId?: string;
    departmentId?: string;
    itemId?: string;
    from?: string;
    to?: string;
}

export interface IStockReportRow {
    itemId: string;
    name: string;
    openingBalance: number;
    added: number;
    returnedToVendor: number;
    damages: number;
    transferInterDeptIn: number;
    transferInterDeptOut: number;
    transferInterHotelIn: number;
    transferInterHotelOut: number;
    closingBalance: number;
    minReorderQty: number;
    shortage?: number;
}