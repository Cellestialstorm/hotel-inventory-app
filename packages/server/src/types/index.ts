export interface IUser {
  userId: string;
  username: string;
  role: string;
  hotelId?: string;
  departmentId?: string;
}

export interface IHotel {
  hotelId: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface IDepartment {
  departmentId: string;
  name: string;
  hotelId: string;
  isActive: boolean;
}