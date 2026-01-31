import { apiClient } from '@/lib/api/client';
import type { Building, CreateBuildingDto, UpdateBuildingDto } from '@/types/models';

export const buildingsService = {
    async getBuildings(): Promise<Building[]> {
        const { data } = await apiClient.get<Building[]>('/buildings');
        return data;
    },

    async getBuildingById(id: string): Promise<Building> {
        const { data } = await apiClient.get<Building>(`/buildings/${id}`);
        return data;
    },

    async createBuilding(building: CreateBuildingDto): Promise<Building> {
        const { data } = await apiClient.post<Building>('/buildings', building);
        return data;
    },

    async updateBuilding(id: string, updates: UpdateBuildingDto): Promise<Building> {
        const { data } = await apiClient.put<Building>(`/buildings/${id}`, updates);
        return data;
    },

    async deleteBuilding(id: string): Promise<void> {
        await apiClient.delete(`/buildings/${id}`);
    },
};
