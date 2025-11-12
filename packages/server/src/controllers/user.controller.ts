import { Request, Response } from 'express';
import { UserService } from '@/services/user.service';
import ApiResponse from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { UserRole } from '@hotel-inventory/shared';

/**
 * Handles fetching all users, potentially with filters.
 * @route GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
        assignedHotelId: req.query.assignedHotelId,
        assignedDepartmentId: req.query.assignedDepartmentId,
        role: req.query.role ? req.query.role === UserRole.USER : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
    };

    Object.keys(filters).forEach(key => filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]);

    const users = await UserService.getAllUsers(filters);
    res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
});

/**
 * Handles fetching a single user by their ID.
 * @route GET /api/users/:id
 */

const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

/**
 * Handles updating a user.
 * @route PUT /api/users/:id
 */

const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.updateUser(id, req.body);
    res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

/**
 * Handles deleting a user (soft delete).
 * @route DELETE /api/users/:id
 */

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // Custom userId string
  await UserService.deleteUser(id);
  res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

export const UserController = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};