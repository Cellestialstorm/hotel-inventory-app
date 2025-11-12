import mongoose, { Document, Schema } from "mongoose";
import type { IDepartment as ISharedDepartment } from "@hotel-inventory/shared";

export interface IDepartmentDocument extends Document, Omit<ISharedDepartment, 'departmentId' | 'hotelId' | '_id'> {
    department: mongoose.Types.ObjectId;
    departmentId: string;
    hotelId: mongoose.Types.ObjectId;
}

const DepartmentSchema: Schema<IDepartmentDocument> = new Schema(
    {
        departmentId: {
            type: String,
            required: [true, 'Department ID is required'],
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Department name is required'],
            trim: true,
        },
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Hotel ID is required'],
            ref: 'Hotel',
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps:  true,
    }
);

DepartmentSchema.index({ hotelId: 1, name: 1 }, { unique: true });

const Department = mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);
export default Department;

