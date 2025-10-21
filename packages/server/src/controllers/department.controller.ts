import { Request, Response } from 'express';
import { DepartmentService } from '@/services/department.service';
import ApiResponse from '@/utils/ApiResponse';
import ApiError from '@/utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

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
    const hotelId = req.params.hotelId || req.query.hotelId as string | undefined;
    const departments = await DepartmentService.getAllDepartments(hotelId);
    res.status(200).json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});

/**
 * Handles fetching a single department by its ID.
 * @routes GET /api/departments/:id
 */

const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const department = await DepartmentService.getDepartmentById(id);
    res.status(200).json(new ApiResponse(200, department, 'Department fetched successfully'));
});

/**
 * Handles updating a department.
 * @routes PUT /api/departments/:id
 */

const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add validation
    const { id } = req.params;
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
    const { id } = req.params;
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