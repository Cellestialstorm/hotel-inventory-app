import { UserRole } from '@hotel-inventory/shared';

/**
 * Automatically appends hotelId and departmentId to a MongoDB query 
 * based on the requesting user's role.
 */
export const buildRoleBasedQuery = (user: any, baseQuery: any = {}) => {
    const query = { ...baseQuery };

    if (user.role === UserRole.MANAGER) {
        // Managers only see their assigned hotel
        query.hotelId = user.assignedHotelId;
    } else if (user.role === UserRole.HOD) {
        // HODs only see their assigned hotel AND department
        query.hotelId = user.assignedHotelId;
        query.departmentId = user.assignedDepartmentId;
    }
    // SUPER_ADMIN passes through without added restrictions

    return query;
};