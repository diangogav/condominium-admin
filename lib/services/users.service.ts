import { apiClient } from '@/lib/api/client';
import type { User, UpdateUserDto } from '@/types/models';

export const usersService = {
    async getUsers(params?: {
        building_id?: string;
        role?: string;
        status?: string;
    }): Promise<User[]> {
        const { data } = await apiClient.get<User[]>('/users', { params });
        return data;
    },

    async getUserById(id: string): Promise<User> {
        const { data } = await apiClient.get<User>(`/users/${id}`);
        return data;
    },

    async updateUser(id: string, updates: UpdateUserDto): Promise<User> {
        const { data } = await apiClient.patch<User>(`/users/${id}`, updates);
        return data;
    },

    async approveUser(id: string): Promise<User> {
        const { data } = await apiClient.patch<User>(`/users/${id}`, { status: 'active' });
        return data;
    },

    async rejectUser(id: string): Promise<User> {
        const { data } = await apiClient.patch<User>(`/users/${id}`, { status: 'rejected' });
        return data;
    },

    async createUser(data: import('@/types/models').CreateUserDto): Promise<User> {
        const { data: user } = await apiClient.post<User>('/users', data);
        return user;
    },

    async deleteUser(id: string): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },
};
