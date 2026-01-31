'use client';

import { useAuth } from './useAuth';

export function usePermissions() {
    const { user } = useAuth();

    const isSuperAdmin = user?.role === 'admin'; // Relaxed check: Allow admins with building_id to act as Super Admin
    const isBoardMember = user?.role === 'board' || (user?.role === 'admin' && !!user?.building_id);
    const isResident = user?.role === 'resident';

    const canManageBuildings = isSuperAdmin;
    const canManageAllUsers = isSuperAdmin;
    const canManageBuildingUsers = isSuperAdmin || isBoardMember;
    const canApprovePayments = isSuperAdmin || isBoardMember;
    const canViewAllPayments = isSuperAdmin;

    return {
        user,
        isSuperAdmin,
        isBoardMember,
        isResident,
        canManageBuildings,
        canManageAllUsers,
        canManageBuildingUsers,
        canApprovePayments,
        canViewAllPayments,
    };
}
