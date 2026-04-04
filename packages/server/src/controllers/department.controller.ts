import { Request, Response } from 'express';
import { DepartmentService } from '@/services/department.service';
import ApiResponse from '@/utils/ApiResponse';
import ApiError from '@/utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@hotel-inventory/shared';

/**
 * Handles creation of an new department
 * @routes Post /api/departments
 */

const createDepartment = asyncHandler(async (req: Request, res: Response) => {
    const department = await DepartmentService.createDepartment(req.body);
    res.status(201).json(new ApiResponse(201, department, 'Department created successfully'));
});

/**
 * Handles fetching all departments, optionally filtered by hotel.
 * @routes GET /api/departments
 * @routes GET /api/departments/hotel/:hotelId
 */

const getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
    let hotelId = (req.params.hotelId || req.query.hotelId) as string | undefined;

    if (req.user?.role === UserRole.MANAGER || req.user?.role === UserRole.HOD) {
        hotelId = req.user.assignedHotelId;
    }

    const departments = await DepartmentService.getAllDepartments(hotelId);
    return res.status(200).json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});

/**
 * Handles fetching a single department by its ID.
 * @routes GET /api/departments/:id
 */

const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const id  = req.params.id as string;

    if (req.user?.role === UserRole.HOD && req.user.assignedDepartmentId !== id) {
        throw new ApiError(403, 'Forbidden: You cannot view other departments', 'FORBIDDEN');
    }
    const department = await DepartmentService.getDepartmentById(id);
    if (!department) {
        throw new ApiError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
    }

    if (req.user?.role === UserRole.MANAGER && department.hotelId.toString() !== req.user.assignedHotelId) {
        throw new ApiError(403, 'Forbidden: This department belongs to another hotel', 'FORBIDDEN');
    }
    res.status(200).json(new ApiResponse(200, department, 'Department fetched successfully'));
});

/**
 * Handles updating a department.
 * @routes PUT /api/departments/:id
 */

const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add validation
    const id = req.params.id as string;
    const department = await DepartmentService.updateDepartment(id, req.body);
    if (!department) {
        throw new ApiError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
    }
    res.status(200).json(new ApiResponse(200, department, 'Department updated successfully'));
});

/**
 * Handles deleting a department (soft delete).
 * @route DELETE /api/departments/:id
 */

const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const success = await DepartmentService.deleteDepartment(id);
    if (!success) {
        throw new ApiError(404, 'Department not found', 'DEPARTMENT_NOT_FOUND');
    }
    res.status(200).json(new ApiResponse(200, null, 'Department deleted successfully'));
});

export const DepartmentController = {
    createDepartment,
    getDepartmentById,
    getAllDepartments,
    updateDepartment,
    deleteDepartment
};