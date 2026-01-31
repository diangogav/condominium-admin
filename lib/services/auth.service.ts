import { apiClient } from '@/lib/api/client';
import type { AuthResponse, LoginCredentials, User } from '@/types/models';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);

        // Rule: Only users with role: 'admin' or role: 'board' should access the panel.
        const allowedRoles = ['admin', 'board'];
        if (!allowedRoles.includes(data.user.role)) {
            throw new Error('Access denied. Only administrators and board members can access this panel.');
        }

        // Rule: Login: Users with PENDING status cannot log in.
        if (data.user.status === 'pending') {
            throw new Error('Your account is pending approval.');
        }

        if (data.user.status === 'rejected') {
            throw new Error('Your account has been rejected.');
        }

        if (data.user.status === 'inactive') {
            throw new Error('Your account is inactive.');
        }

        // Store tokens
        localStorage.setItem('access_token', data.token.access_token);
        // refresh_token is not in the new spec, but keeping it if backend sends it is harmless.
        // We cast to unknown first to avoid TS error since it's not in the type.
        const tokenData = data.token as unknown as Record<string, unknown>;
        if (typeof tokenData.refresh_token === 'string') {
            localStorage.setItem('refresh_token', tokenData.refresh_token);
        }

        return data;
    },

    async getCurrentUser(): Promise<User> {
        // Backend user endpoint might be /users/me or just /auth/me depending on implementation
        // Prompt says "Unsure", but usually it's /auth/me or /users/me.
        // Existing was /users/me. Keep it for now.
        const { data } = await apiClient.get<User>('/users/me'); // Or /auth/me?
        // Prompt doesn't specify "Get Current User" endpoint explicitly, but "List Users" is /users.
        // Assuming /users/me or /auth/me exists for profile.
        // Let's assume /auth/me is more common in new backends or keep /users/me if that was the convention.
        // The prompt description for "Authentication Module" lists Login.
        // It doesn't explicitly list "Get Me".
        // I'll stick with /users/me but if it fails I might need to change it later or infer from "List Users" endpoint.
        // Actually, often backend returns user in login.
        return data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },

    getAccessToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token');
        }
        return null;
    },

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    },
};
