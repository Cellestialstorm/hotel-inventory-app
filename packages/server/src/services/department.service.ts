import mongoose from 'mongoose';
import Department, { IDepartmentDocument } from '@/models/Department.model';
import User from '@/models/User.model';
import Hotel from '@/models/Hotel.model';
import ApiError from '@/utils/ApiError';
import logger from '@/utils/logger';
import { ICreateDepartmentRequest, IUpdateDepartmentRequest } from '@hotel-inventory/shared';
import ItemModel from '@/models/Item.model';

/**
 * Create a new department
 * @param deptData - Data for the new department.
 * @returns The newely created departmnet object.
 */

const createDepartment = async (deptData: ICreateDepartmentRequest): Promise<IDepartmentDocument> => { 
    const { name, hotelId } = deptData;

    if (!name || !hotelId) {
        throw new ApiError(400, 'Department name and Hotel ID are required', 'VALIDATION_ERROR');
    }
    const hotelExists = await Hotel.findOne({ _id: hotelId });
    if (!hotelExists) {
        throw new ApiError(404, `Hotel with ID ${hotelId} not found`, 'HOTEL_NOT_FOUND');
    }

    const hotelObjectId = hotelExists._id;

    const existingDepartment = await Department.findOne({ name, hotelId: hotelObjectId }).lean();

    if (existingDepartment) {
        throw new ApiError(409, `Department named '${name}' already exists in this hotel`, 'DUPLICATE_DEPARTMENT');
    }

    const uniqueDepartmentId = new mongoose.Types.ObjectId().toString();

    const newDepartment = new Department({
        departmentId: uniqueDepartmentId,
        name,
        hotelId: hotelObjectId,
        isActive: true,
    });

    try {
        const saveDept = await newDepartment.save();
        logger.info(`Department created successfully: ${saveDept.name} (ID: ${saveDept.departmentId})`);
        return saveDept;
    } catch (error: any) {
        logger.error(`Error creating department '${name}': ${error.message}`, { error });
        if (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
            throw new ApiError(409, `Department name '${name}' already exists in this hotel`, 'DUPLICATE_KEY');
        }
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Validation failed', 'VALIDATION_FAILED', error.errors);
        }
        throw new ApiError(500, 'Failed to create department', 'DATABASE_ERROR', error);
    }
};

/**
 * Retrives a department by its ID
 * @param departmentId - The unique ID of the department.
 * @returns The department object or null if not found.
 */

const getDepartmentById = async (departmentId: string): Promise<IDepartmentDocument | null> => { 
    let department = await Department.findOne({ departmentId: departmentId});

    if (!department && mongoose.Types.ObjectId.isValid(departmentId)) {
        department = await Department.findById(departmentId);
    }

    if (!department) {
        throw new ApiError(404, `Department with ID ${departmentId} not found`, 'DEPARTMENT_NOT_FOUND');
    }

    return department;
};

/**
 * Retrieves all departments, optionally filtered by hotel.
 * @param hotelId - Optional hotel ID to filter departments.
 * @returns An array of department objects.
 */

const getAllDepartments = async (hotelId?: string): Promise<IDepartmentDocument[]> => { 
    const query = hotelId ? { hotelId: new mongoose.Types.ObjectId(hotelId) } : {};
    try {
        const departments = await Department.find(query).lean();
        return departments;
    } catch (error: any) {
        logger.error(`Error fetching departments: ${error.message}`, { error, hotelId });
        throw new ApiError(500, 'Failed to fetch departments', 'DATABASE_ERROR', error);
    }
};

/**
 * Updates an existing department.
 * @param departmentId - The ID of the department to update.
 * @param updateData - An object containing the fields to update.
* @returns The updated department object or null if not found.
 */

const updateDepartment = async (
    departmentId: string,
    updateData: IUpdateDepartmentRequest
): Promise<IDepartmentDocument | null> => { 
    const { name, isActive, hotelId } = updateData;

    const department = await getDepartmentById(departmentId);
    if (!department) return null;

    if (name && name !== department.name) {
        const existingDept = await Department.findOne({
            name,
            hotelId: department.hotelId,
            _id: { $ne: department._id }
        }).lean();
        if (existingDept) {
            throw new ApiError(409, `Another department name '${name}' already exists in this hotel`, 'DUPLICATE_DEPARTMENT');
        }
        department.name = name;
    }
    
    if (typeof isActive === 'boolean') {
        department.isActive = isActive;
    }

    if (hotelId && hotelId !== department.hotelId.toString()) {
        const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
        const hotelExists = await Hotel.findById(hotelObjectId);
        if (!hotelExists) {
            throw new ApiError(404, `Target Hotel with ID ${hotelId} not found`, 'HOTEL_NOT_FOUND');
        }
        const existingDeptInNewHotel = await Department.findOne({ name: department.name, hotelId: hotelObjectId }).lean();
        if (existingDeptInNewHotel) {
            throw new ApiError(409, `Cannot move department: Name '${department.name}' already exists in target hotel`, 'DUPLICATE_DEPARTMENT');
        }
        department.hotelId = hotelObjectId;
    }

    try {
        const updateDept = await department.save();
        logger.info(`Department updated successfully: ${updateDept.name} (ID: ${updateDept.departmentId})`);
        return updateDept;
    } catch (error: any) {
        logger.error(`Error updating department ${departmentId}: ${error.message}`, { error });
        if (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
            throw new ApiError(400, 'Department validation failed', 'VALIDATION_ERROR', error.errors);
        }
        throw new ApiError(500, 'Failed to update department', 'DATABASE_ERROR', error);
    }
};

/**
 * Delete a department (soft delete by default).
 * @param departmentId - The ID of the department to delete.
 * @returns True if deleted successfully, false otherwise.
 */

const deleteDepartment = async (departmentId: string): Promise<boolean> => { 
    const department = await getDepartmentById(departmentId);
    if (!department) return false;

    const usersExist = await User.exists({ assignedDepartmentId: department._id, isActive: true });
    if (usersExist) {
      throw new ApiError(400, 'Cannot delete department: Users are currently assigned to it.', 'DEPARTMENT_IN_USE');
    }
    const itemsExist = await ItemModel.exists({ departmentId: department._id, isActive: true });
    if (itemsExist) {
       throw new ApiError(400, 'Cannot delete department: Inventory items are currently assigned to it.', 'DEPARTMENT_IN_USE');
    }

    try {
        await Department.findByIdAndDelete(department._id);
        logger.info(`Department permanently deleted: ${department.name} (ID: ${department.departmentId})`);
        return true;
    } catch (error: any) {
        logger.error(`Error deleteing department ${departmentId}: ${error.message}`, { error });
        throw new ApiError(500, 'Failed to delete department', 'DATABASE_ERROR', error);
    }
};

export const DepartmentService = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};