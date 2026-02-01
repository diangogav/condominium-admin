import { apiClient } from '@/lib/api/client';
import type { Payment, UpdatePaymentDto } from '@/types/models';

export const paymentsService = {
    async getPayments(params?: {
        building_id?: string;
        user_id?: string;
        unit_id?: string; // Added
        status?: string;
        period?: string;
        year?: string;
    }): Promise<Payment[]> {
        const { data } = await apiClient.get<Payment[]>('/payments/admin/payments', { params });
        return data;
    },

    async getPaymentById(id: string): Promise<Payment> {
        const { data } = await apiClient.get<Payment>(`/payments/${id}`);
        return data;
    },

    async updatePaymentStatus(id: string, update: UpdatePaymentDto): Promise<Payment> {
        const { data } = await apiClient.patch<Payment>(`/payments/admin/payments/${id}`, update);
        return data;
    },

    async approvePayment(id: string, notes?: string, approved_periods?: string[]): Promise<Payment> {
        return this.updatePaymentStatus(id, { status: 'APPROVED', notes, approved_periods });
    },

    async rejectPayment(id: string, notes?: string): Promise<Payment> {
        return this.updatePaymentStatus(id, { status: 'REJECTED', notes });
    },
};
