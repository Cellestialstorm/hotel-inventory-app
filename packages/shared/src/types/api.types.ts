import { IItem } from "./inventory.types";
import { IClientUser, IUSER } from "./user.types";

export interface IApiRespose<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message?: string;
    details?: any;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}

//Auth

export interface ILoginRequest { 
    username: string;
    password: string;
}
export interface ILoginResponse { 
    token: string;
    user: IClientUser;
}
export interface IRegisterRequest extends Omit<IUSER, 'userID' | 'createdAt' | 'updatedAt'> {
    password?: string;
}

export interface IGetByIdParams {
    id: string;
}

export type ICreateItemRequest = Omit<IItem, 'itemID' | 'createdAt' | 'updatedAt'>;
export type IUpdateItemRequest = Partial<Omit<IItem, 'itemID' | 'createdAt' | 'updatedAt'>>;
export type IGetItemsResponse = { items: IItem[]; };

