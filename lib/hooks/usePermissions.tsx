'use client';

import { useAuth } from './useAuth';

export function usePermissions() {
    const { user } = useAuth();

    const isSuperAdmin = user?.role === 'admin';

    // Get all buildings where user has board role
    const getBoardBuildings = (): string[] => {
        if (isSuperAdmin) return []; // Admin doesn't need filtering

        return user?.units
            ?.filter(unit => unit.building_role === 'board')
            .map(unit => unit.building_id)
            .filter(Boolean) as string[] ?? [];
    };

    // Check if user is board in specific building
    const isBoardInBuilding = (buildingId?: string): boolean => {
        if (isSuperAdmin) return true;
        if (!buildingId) return false;

        return user?.units?.some(
            unit => unit.building_id === buildingId && unit.building_role === 'board'
        ) ?? false;
    };

    // Legacy support
    const isBoardMember = user?.role === 'board';
    const isResident = user?.role === 'resident';

    // Legacy building ID (for backward compatibility)
    const buildingId = user?.building_id ||
        user?.building?.id ||
        (user?.units && user?.units.length > 0 ? user.units[0].building_id : undefined);

    const buildingName = user?.building_name ||
        user?.building?.name ||
        (user?.units && user?.units.length > 0 ? user.units[0].building_name : undefined);

    // Building-aware permissions
    const canManageBuilding = (buildingId?: string) => {
        return isSuperAdmin || isBoardInBuilding(buildingId);
    };

    const canManageUsers = (buildingId?: string) => {
        return isSuperAdmin || isBoardInBuilding(buildingId);
    };

    const canApprovePayments = (buildingId?: string) => {
        return isSuperAdmin || isBoardInBuilding(buildingId);
    };

    // Legacy permissions (deprecated but kept for compatibility)
    const canManageBuildings = isSuperAdmin;
    const canManageAllUsers = isSuperAdmin;
    const canManageBuildingUsers = isSuperAdmin || isBoardMember;
    const canViewAllPayments = isSuperAdmin;

    return {
        user,
        buildingId,
        buildingName,
        displayName: user?.name || user?.email?.split('@')[0] || 'User',
        isSuperAdmin,
        isBoardMember,
        isResident,
        // New building-aware functions
        getBoardBuildings,
        isBoardInBuilding,
        canManageBuilding,
        canManageUsers,
        canApprovePayments,
        // Legacy permissions
        canManageBuildings,
        canManageAllUsers,
        canManageBuildingUsers,
        canViewAllPayments,
    };
}
