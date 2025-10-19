import { TransactionType } from "../enums";

export interface ITranscationBase {
    transactionID: string;
    itemID: string;
    quantityChange: number;
    transactionTimestamp: Date;
    userID: string;
    notes?: string;
    hotelID: string;
    departmentID: string;
    type: TransactionType;
}

export interface IOpeningBalanceTranscation extends ITranscationBase {
    type: TransactionType.OPENING_BALANCE;
}

export interface IAddedTranscation extends ITranscationBase {
    type: TransactionType.ADDED;
    vendor: string;
    reason?: string;
}

export interface IDamageTranscation extends ITranscationBase {
    type: TransactionType.DAMAGE;
    reason?: string;
}

export interface IReturnedToVendorTranscation extends ITranscationBase {
    type: TransactionType.RETURNED_TO_VENDOR;
    vendor: string;
    reason?: string;
}

export interface ITransferInDeptTranscation extends ITranscationBase {
    type: TransactionType.TRANSFER_IN_DEPT;
    sourceDepartmentID: string;
}

export interface ITransferOutDeptTranscation extends ITranscationBase {
    type: TransactionType.TRANSFER_OUT_DEPT;
    destinationDepartmentID: string;
}

export interface ITransferInHotelTranscation extends ITranscationBase {
    type: TransactionType.TRANSFER_IN_HOTEL;
    sourceHotelID: string;
    sourceDepartmentID: string;
}

export interface ITransferOutHotelTranscation extends ITranscationBase {
    type: TransactionType.TRANSFER_OUT_HOTEL;
    destinationHotelID: string;
    destinationDepartmentID: string;
}

export type ITransaction =
    | IOpeningBalanceTranscation
    | IAddedTranscation
    | IDamageTranscation
    | IReturnedToVendorTranscation
    | ITransferInDeptTranscation
    | ITransferOutDeptTranscation
    | ITransferInHotelTranscation
    | ITransferOutHotelTranscation;

export type INewTransaction = Omit<ITransaction, 'transactionID' | 'transactionTimestamp'>;