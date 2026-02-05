import { apiClient } from '@/lib/api/client';
import type { Invoice, InvoicePayment, UnitBalance, BillingDebtPayload } from '@/types/models';

export const billingService = {

    async getInvoices(params?: {
        building_id?: string;
        unit_id?: string;
        status?: string;
        month?: number;
        year?: number;
        user_id?: string;
    }): Promise<Invoice[]> {
        const { data } = await apiClient.get<Invoice[]>('/billing/invoices', { params });
        return data;
    },

    async getInvoiceById(id: string): Promise<Invoice> {
        const { data } = await apiClient.get<Invoice>(`/billing/invoices/${id}`);
        return data;
    },

    // Returns the payments with allocation info included
    async getInvoicePayments(id: string): Promise<InvoicePayment[]> {
        const { data } = await apiClient.get<InvoicePayment[]>(`/billing/invoices/${id}/payments`);
        return data;
    },

    async getUnitInvoices(unitId: string): Promise<Invoice[]> {
        const { data } = await apiClient.get<Invoice[]>(`/billing/units/${unitId}/invoices`);
        return data;
    },

    async getUnitBalance(unitId: string): Promise<UnitBalance> {
        const { data } = await apiClient.get<UnitBalance>(`/billing/units/${unitId}/balance`);
        return data;
    },

    async loadDebt(payload: BillingDebtPayload): Promise<Invoice> {
        const { data } = await apiClient.post<Invoice>('/billing/debt', payload);
        return data;
    },
};
