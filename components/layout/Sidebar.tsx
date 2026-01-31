'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'board'] },
    { name: 'Buildings', href: '/buildings', icon: Building2, roles: ['admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'board'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'board'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, isSuperAdmin } = usePermissions();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const filteredNavigation = navigation.filter(item => {
        if (item.roles.includes('admin') && !item.roles.includes('board')) {
            return isSuperAdmin;
        }
        return item.roles.some(role => user?.role === role || (user?.role === 'admin'));
    });

    const NavContent = (
        <>
            <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
                <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-sidebar-foreground tracking-tight">Condominio</span>
            </div>
            <nav className="flex-1 space-y-1.5 px-3 py-6">
                {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                        >
                            <item.icon className={cn(
                                "mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto border-t border-sidebar-border/50">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-sidebar-foreground">{user?.name}</span>
                        <span className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</span>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="ml-2 text-lg font-bold text-sidebar-foreground">Condominio</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Mobile sidebar */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-2xl transform transition-transform" onClick={(e) => e.stopPropagation()}>
                        {NavContent}
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
                {NavContent}
            </div>
        </>
    );
}
