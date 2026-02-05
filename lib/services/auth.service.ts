
import { apiClient } from '@/lib/api/client';
import type { AuthResponse, LoginCredentials, User } from '@/types/models';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);

        console.log('Login response data:', data);

        // Handle potential response structure variations
        // Structure A: { token: { access_token: ... }, user: ... }
        // Structure B: { access_token: ..., user: ... }
        const accessToken = data.token?.access_token || (data as any).access_token;
        const refreshToken = data.token?.refresh_token || (data as any).refresh_token;

        if (!accessToken) {
            console.error('Login failed: Missing access_token in response', data);
            throw new Error('Authentication failed: Invalid server response.');
        }

        // Store tokens immediately
        localStorage.setItem('access_token', accessToken);

        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }

        console.log('Login response user:', data.user);

        // Rule: Only users with role: 'admin' or role: 'board' should access the panel.
        const allowedRoles = ['admin', 'board'];
        // Normalize role to lowercase to handle backend inconsistency
        const userRole = data.user.role?.toLowerCase() as string;

        if (!allowedRoles.includes(userRole)) {
            console.error(`Access denied: Role '${data.user.role}' is not allowed.`);
            // Clean up
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw new Error('Access denied. Only administrators and board members can access this panel.');
        }

        // Rule: Check status
        if (data.user.status === 'pending') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw new Error('Your account is pending approval.');
        }

        if (data.user.status === 'rejected') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw new Error('Your account has been rejected.');
        }

        if (data.user.status === 'inactive') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw new Error('Your account is inactive.');
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
