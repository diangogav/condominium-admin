import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const buildingSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().min(1, 'Address is required'),
    total_units: z.number().int().positive().optional(),
    monthly_fee: z.number().positive().optional(),
});

export const userSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    phone: z.string().optional(),
    unit: z.string().optional(),
    building_id: z.string().uuid().optional(),
    role: z.enum(['resident', 'board', 'admin']).optional(),
    status: z.enum(['pending', 'active']).optional(),
});

export const paymentApprovalSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().optional(),
});
