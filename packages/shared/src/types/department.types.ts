export interface IDepartment{
    departmentId: string;
    name: string;
    hotelId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateDepartmentRequest extends Omit<IDepartment, 'departmentID' | 'createdAt' | 'updatedAt' | 'isActive'> {}
export interface IUpdateDepartmentRequest extends Partial<Omit<IDepartment, 'departmentID' | 'createdAt' | 'updatedAt'>>{}