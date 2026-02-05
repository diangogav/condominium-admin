'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Building2,
    CreditCard,
    FileText,
    LogOut,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'board'] },
    { name: 'Buildings', href: '/buildings', icon: Building2, roles: ['admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'board'] },
    { name: 'Billing', href: '/billing', icon: FileText, roles: ['admin', 'board', 'resident'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'board'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const { user, isSuperAdmin, isBoardMember, buildingId, buildingName, displayName } = usePermissions();
    const [open, setOpen] = useState(false);

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter(item =>
        user && item.roles.includes(user.role)
    );

    const SidebarContent = () => (
        <div className="flex bg-card/50 h-full flex-col justify-between py-6 backdrop-blur-xl border-r border-white/5">
            <div className="px-4">
                <div className="flex items-center gap-2 px-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Condominio
                    </span>
                </div>
                {isBoardMember && buildingName && (
                    <div className="px-2 mb-8">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                            {buildingName}
                        </p>
                    </div>
                )}
                <nav className="space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground/70")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="px-4">
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-4 mb-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/5 text-primary font-bold">
                            {displayName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-40">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-border/50 w-72">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-background/50 backdrop-blur-xl z-20">
                <SidebarContent />
            </div>
        </>
    );
}
