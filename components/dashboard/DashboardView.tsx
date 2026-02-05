'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Building2, Users, CreditCard, DollarSign, TrendingUp, ArrowLeft, Search, FileText, Plus } from 'lucide-react';
import { InvoiceDialog } from '@/components/billing/InvoiceDialog';
import { UnitsTab } from '@/components/buildings/UnitsTab';
import { buildingsService } from '@/lib/services/buildings.service';
import { usersService } from '@/lib/services/users.service';
import { paymentsService } from '@/lib/services/payments.service';
import { billingService } from '@/lib/services/billing.service';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import type { Building, User, Payment, Invoice } from '@/types/models';

interface DashboardViewProps {
    buildingId?: string;
    showBuildingFilter?: boolean;
}

export function DashboardView({ buildingId, showBuildingFilter = false }: DashboardViewProps) {
    const { isSuperAdmin, user, buildingId: permissionsBuildingId, buildingName } = usePermissions();
    const router = useRouter();

    const effectiveBuildingId = buildingId || (!isSuperAdmin ? permissionsBuildingId : undefined);

    const [buildings, setBuildings] = useState<Building[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentBuildingName, setCurrentBuildingName] = useState<string>('');

    // Search State
    const [searchUsers, setSearchUsers] = useState('');
    const [searchPayments, setSearchPayments] = useState('');
    const [searchInvoices, setSearchInvoices] = useState('');
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Prepare filters
            const query: any = effectiveBuildingId ? { building_id: effectiveBuildingId } : {};

            const promises: [Promise<Building[]>, Promise<User[]>, Promise<Payment[]>, Promise<Invoice[]>] = [
                isSuperAdmin ? buildingsService.getBuildings() : Promise.resolve([]),
                usersService.getUsers(query),
                paymentsService.getPayments(query),
                billingService.getInvoices(query)
            ];

            const [buildingsData, usersData, paymentsData, invoicesData] = await Promise.all(promises);

            setBuildings(buildingsData);
            setUsers(usersData);
            setPayments(paymentsData);
            setInvoices(invoicesData);

            if (effectiveBuildingId) {
                // Try to find in profile first
                if (!isSuperAdmin && user?.building_name) {
                    setCurrentBuildingName(user.building_name);
                } else {
                    // Check if we have it in buildingsData (Super Admin list)
                    const b = buildingsData.find(b => b.id === effectiveBuildingId);
                    if (b) {
                        setCurrentBuildingName(b.name);
                    } else {
                        // Fetch directly if still missing
                        try {
                            const specificBuilding = await buildingsService.getBuildingById(effectiveBuildingId);
                            setCurrentBuildingName(specificBuilding.name);
                        } catch (e) {
                            console.error('Failed to fetch building details', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, user, effectiveBuildingId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    const approvedPayments = payments.filter(p => p.status === 'APPROVED');
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Debt Calculation
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
    const totalDebt = pendingInvoices.reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0);

    const isFilteredView = !!effectiveBuildingId;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
        user.unit?.toLowerCase().includes(searchUsers.toLowerCase())
    );

    const filteredPayments = payments.filter(payment =>
        searchPayments === '' ||
        payment.amount.toString().includes(searchPayments) ||
        payment.method.toLowerCase().includes(searchPayments.toLowerCase()) ||
        payment.period?.toLowerCase().includes(searchPayments.toLowerCase()) ||
        payment.user?.name.toLowerCase().includes(searchPayments.toLowerCase())
    );

    const filteredInvoices = invoices.filter(inv =>
        searchInvoices === '' ||
        inv.number?.toLowerCase().includes(searchInvoices.toLowerCase()) ||
        inv.user?.name?.toLowerCase().includes(searchInvoices.toLowerCase()) ||
        inv.unit?.name?.toLowerCase().includes(searchInvoices.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isFilteredView ? (currentBuildingName || buildingName || 'Building') : 'Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isFilteredView
                            ? 'Building specific overview'
                            : (isSuperAdmin ? 'System-wide overview' : 'Your building overview')
                        }
                    </p>
                </div>
                {isFilteredView && isSuperAdmin && showBuildingFilter && (
                    <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Overview
                    </Button>
                )}
                {effectiveBuildingId && !showBuildingFilter && isSuperAdmin && (
                    <Button variant="outline" onClick={() => router.push('/buildings')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Buildings
                    </Button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {!isFilteredView && isSuperAdmin && (
                    <Link href="/buildings" className="block transition-transform hover:scale-105 duration-200">
                        <StatsCard
                            title="Total Buildings"
                            value={buildings.length}
                            icon={Building2}
                            description="Active buildings"
                            className="h-full border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                        />
                    </Link>
                )}
                <StatsCard
                    title={isSuperAdmin ? 'Total Users' : 'Total Residents'}
                    value={users.length}
                    icon={Users}
                    description={isFilteredView ? 'In this building' : 'All users'}
                />
                <StatsCard
                    title="Total Debt"
                    value={formatCurrency(totalDebt)}
                    icon={FileText}
                    description={`${pendingInvoices.length} pending invoices`}
                    className="border-red-500/20 bg-red-500/5"
                />
                <StatsCard
                    title="Pending Payments"
                    value={pendingPayments.length}
                    icon={CreditCard}
                    description="Awaiting approval"
                    className="border-yellow-500/20 bg-yellow-500/5"
                />
                {(!isFilteredView && isSuperAdmin) && (
                    <StatsCard
                        title="Total Revenue"
                        value={formatCurrency(totalRevenue)}
                        icon={DollarSign}
                        description="Verified collections"
                    />
                )}
            </div>

            {/* Dashboard Content (Tabs for Building View) */}
            {isFilteredView ? (
                <Tabs defaultValue="residents" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="residents">Residents</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="units">Units</TabsTrigger>
                    </TabsList>

                    {/* Residents Tab */}
                    <TabsContent value="residents" className="space-y-4">
                        <Card className="border-border/50 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-foreground">Residents</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search residents..."
                                        className="pl-8"
                                        value={searchUsers}
                                        onChange={(e) => setSearchUsers(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredUsers.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        {searchUsers ? 'No residents match your search' : 'No residents found'}
                                    </p>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => router.push(`/payments?user_id=${user.id}`)}
                                                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 cursor-pointer ${user.role === 'board'
                                                    ? 'bg-primary/5 border-primary/20 shadow-sm hover:shadow-md'
                                                    : 'border-border/50 hover:bg-accent/50 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user.role === 'board' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground flex items-center gap-2">
                                                            {user.name}
                                                            {user.role === 'board' && (
                                                                <Badge variant="default" className="text-[10px] h-5 px-2">
                                                                    Board
                                                                </Badge>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.email} {user.unit ? `• Unit ${user.unit}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="capitalize">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invoices" className="space-y-4">
                        <Card className="border-border/50 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-foreground">Recent Invoices</CardTitle>
                                    <p className="text-xs text-muted-foreground font-normal">Manage building debts</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {(isSuperAdmin || user?.role === 'board') && (
                                        <Button size="sm" onClick={() => setIsInvoiceDialogOpen(true)} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Invoice
                                        </Button>
                                    )}
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search invoices..."
                                            className="pl-8"
                                            value={searchInvoices}
                                            onChange={(e) => setSearchInvoices(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredInvoices.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No invoices found.
                                    </p>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        {filteredInvoices.slice(0, 10).map((inv) => (
                                            <div
                                                key={inv.id}
                                                className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/50 transition-all duration-200"
                                            >
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        Invoice #{inv.number || inv.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {inv.unit?.name || 'Unit N/A'} • {inv.year}-{inv.month}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold text-foreground">
                                                        {formatCurrency(inv.amount)}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            inv.status === 'PAID'
                                                                ? 'default'
                                                                : inv.status === 'PENDING'
                                                                    ? 'secondary'
                                                                    : 'destructive'
                                                        }
                                                        className={inv.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' : ''}
                                                    >
                                                        {inv.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payments Tab */}
                    <TabsContent value="payments" className="space-y-4">
                        <Card className="border-border/50 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-foreground">Recent Payments</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search payments..."
                                        className="pl-8"
                                        value={searchPayments}
                                        onChange={(e) => setSearchPayments(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredPayments.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        {searchPayments ? 'No payments match your search' : 'No payments yet'}
                                    </p>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        {filteredPayments.slice(0, 10).map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/50 transition-all duration-200"
                                            >
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        Payment #{payment.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {payment.period} • {payment.method}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By: {payment.user?.name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold text-foreground">
                                                        {formatCurrency(payment.amount)}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            payment.status === 'APPROVED'
                                                                ? 'default'
                                                                : payment.status === 'PENDING'
                                                                    ? 'secondary'
                                                                    : 'destructive'
                                                        }
                                                    >
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Units Tab */}
                    <TabsContent value="units" className="space-y-4">
                        {effectiveBuildingId && <UnitsTab buildingId={effectiveBuildingId} />}
                    </TabsContent>
                </Tabs>
            ) : (
                /* Global Activity (Non - filtered) */
                <Card className="border-border/50 bg-card">
                    <CardHeader>
                        <CardTitle className="text-foreground">Recent Payments (Global)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No payments yet</p>
                        ) : (
                            <div className="space-y-4">
                                {payments.slice(0, 5).map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/50 transition-all duration-200"
                                    >
                                        <div>
                                            <p className="font-medium text-foreground">
                                                Payment #{payment.id.slice(0, 8)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {payment.period} • {payment.method}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-semibold text-foreground">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <Badge
                                                variant={
                                                    payment.status === 'APPROVED'
                                                        ? 'default'
                                                        : payment.status === 'PENDING'
                                                            ? 'secondary'
                                                            : 'destructive'
                                                }
                                            >
                                                {payment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <InvoiceDialog
                open={isInvoiceDialogOpen}
                onOpenChange={setIsInvoiceDialogOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}
