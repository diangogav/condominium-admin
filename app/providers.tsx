'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';
import { Toaster } from 'sonner';
import { BuildingProvider } from '@/lib/contexts/BuildingContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <BuildingProvider>
                {children}
                <Toaster position="top-right" richColors />
            </BuildingProvider>
        </AuthProvider>
    );
}
