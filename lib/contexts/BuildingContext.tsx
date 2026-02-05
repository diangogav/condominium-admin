'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { buildingsService } from '@/lib/services/buildings.service';

interface BuildingContextType {
    selectedBuildingId: string | null;
    setSelectedBuildingId: (id: string | null) => void;
    availableBuildings: Array<{ id: string; name?: string }>;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export function BuildingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [availableBuildings, setAvailableBuildings] = useState<Array<{ id: string; name?: string }>>([]);

    // Fetch building details for board members
    useEffect(() => {
        const fetchBuildingDetails = async () => {
            if (!user?.units) {
                setAvailableBuildings([]);
                return;
            }

            // Get unique building IDs where user is board
            const boardBuildingIds = Array.from(new Set(
                user.units
                    .filter(unit => unit.building_role === 'board')
                    .map(unit => unit.building_id)
            ));

            if (boardBuildingIds.length === 0) {
                setAvailableBuildings([]);
                return;
            }

            // Fetch details for each building to get the name
            try {
                const buildingsWithNames = await Promise.all(
                    boardBuildingIds.map(async (id) => {
                        try {
                            // Check if we already have the name in user units (though rare based on logs)
                            const unitWithInfo = user.units?.find(u => u.building_id === id && u.building_name);
                            if (unitWithInfo?.building_name) {
                                return { id, name: unitWithInfo.building_name };
                            }

                            // Otherwise fetch from API
                            const building = await buildingsService.getBuildingById(id);
                            return { id, name: building.name };
                        } catch (error) {
                            console.error(`Failed to fetch building ${id}`, error);
                            return { id, name: 'Unknown Building' };
                        }
                    })
                );

                setAvailableBuildings(buildingsWithNames);
            } catch (error) {
                console.error('Failed to fetch building details', error);
                // Fallback to IDs if fetch completely fails
                setAvailableBuildings(boardBuildingIds.map(id => ({ id, name: 'Unknown Building' })));
            }
        };

        fetchBuildingDetails();
    }, [user]);

    // Auto-select first building
    useEffect(() => {
        if (!selectedBuildingId && availableBuildings.length > 0) {
            // Try to use primary unit's building first
            const primaryUnit = user?.units?.find(u => u.is_primary && u.building_role === 'board');

            // Check if primary building is in available (fetching might strictly filter)
            const primaryId = primaryUnit?.building_id;
            const hasPrimaryAccess = primaryId && availableBuildings.some(b => b.id === primaryId);

            setSelectedBuildingId(hasPrimaryAccess ? primaryId : availableBuildings[0].id);
        }
    }, [availableBuildings, selectedBuildingId, user]);

    // Validate selection
    useEffect(() => {
        if (selectedBuildingId && availableBuildings.length > 0 && !availableBuildings.some(b => b.id === selectedBuildingId)) {
            // If selected building is no longer available, switch to first available
            setSelectedBuildingId(availableBuildings[0].id);
        }
    }, [availableBuildings, selectedBuildingId]);

    return (
        <BuildingContext.Provider
            value={{
                selectedBuildingId,
                setSelectedBuildingId,
                availableBuildings
            }}
        >
            {children}
        </BuildingContext.Provider>
    );
}

export function useBuildingContext() {
    const context = useContext(BuildingContext);
    if (context === undefined) {
        throw new Error('useBuildingContext must be used within a BuildingProvider');
    }
    return context;
}
