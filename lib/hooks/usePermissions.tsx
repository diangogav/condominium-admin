'use client';

import { useAuth } from './useAuth';

export function usePermissions() {
    const { user } = useAuth();

    const isSuperAdmin = user?.role === 'admin';
    const buildingId = user?.building_id || (user?.units && user?.units.length > 0 ? user.units[0].building_id : undefined);
    const buildingName = user?.building_name || user?.building?.name || (user?.units && user?.units.length > 0 ? user.units[0].building_name : undefined);

    const isBoardMember = user?.role === 'board' || (user?.role === 'admin' && !!buildingId);
    const isResident = user?.role === 'resident';

    const canManageBuildings = isSuperAdmin;
    const canManageAllUsers = isSuperAdmin;
    const canManageBuildingUsers = isSuperAdmin || isBoardMember;
    const canApprovePayments = isSuperAdmin || isBoardMember;
    const canViewAllPayments = isSuperAdmin;

    return {
        user,
        buildingId,
        buildingName,
        displayName: user?.name || user?.email?.split('@')[0] || 'User',
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
