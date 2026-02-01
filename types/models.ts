export type PaymentMethod = 'PAGO_MOVIL' | 'TRANSFER' | 'CASH';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'resident' | 'board' | 'admin';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'rejected'; // Updated status list

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    unit?: string;
    building_id?: string;
    building?: Building;
    building_name?: string;
    role: UserRole;
    status?: UserStatus;
    created_at: string;
    updated_at: string;
}

export interface Building {
    id: string;
    name: string;
    address: string;
    rif?: string; // Added if needed, but keeping basic for now based on prompt
    total_units?: number;
    monthly_fee?: number;
    created_at?: string;
}

export interface Payment {
    id: string;
    user_id: string;
    user?: User;         // Backend might include user details
    amount: number;
    payment_date: string;
    method: PaymentMethod;
    reference?: string;
    bank?: string;       // Added bank field
    periods?: string[];  // Added periods array
    period?: string;     // Legacy support
    proof_url?: string;  // Full URL from backend
    status: PaymentStatus;
    notes?: string;      // Rejection reason or notes
    created_at: string;
    updated_at: string;
}

export interface DashboardStats {
    total_buildings?: number;
    total_users?: number; // Residents
    pending_payments: number;
    approved_payments?: number; // Optional
    total_revenue?: number; // Likely handled per building now
    solvency_rate?: number; // Backend calculated
}

export interface AuthResponse {
    token: {
        access_token: string;
        // refresh_token?: string; // Prompt only mentions access_token
    };
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface CreateBuildingDto {
    name: string;
    address: string;
}

export interface UpdateBuildingDto {
    name?: string;
    address?: string;
}

export interface UpdateUserDto {
    name?: string;
    phone?: string;
    unit?: string;
    building_id?: string;
    role?: UserRole;
    status?: UserStatus;
}

export interface CreateUserDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    building_id: string;
    unit?: string;
    phone?: string;
}

export interface UpdatePaymentDto {
    status: PaymentStatus;
    notes?: string;
    approved_periods?: string[]; // Optional partial approval
}

export interface Unit {
    id: string;
    name: string;
    floor: string;
    aliquot: number;
    building_id: string; // Likely included
}

export interface CreateUnitDto {
    name: string;
    floor: string;
    aliquot?: number;
}

export interface BatchUnitDto {
    floors: string[];
    unitsPerFloor: string[];
}
