'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Building2, Users, CreditCard, DollarSign, TrendingUp, ArrowLeft, Search } from 'lucide-react';
import { buildingsService } from '@/lib/services/buildings.service';
import { usersService } from '@/lib/services/users.service';
import { paymentsService } from '@/lib/services/payments.service';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import type { Building, User, Payment } from '@/types/models';

interface DashboardViewProps {
    buildingId?: string;
    showBuildingFilter?: boolean; // For global dashboard to allow filtering or showing all
}

export function DashboardView({ buildingId, showBuildingFilter = false }: DashboardViewProps) {
    const { isSuperAdmin, user } = usePermissions();
    const router = useRouter();

    // effectiveBuildingId: 
    // If passed buildingId (e.g. from route), use it.
    // Else if user is not super admin, use their building_id.
    // If super admin and no buildingId passed, it's global view (undefined).
    const effectiveBuildingId = buildingId || (!isSuperAdmin ? user?.building_id : undefined);

    const [buildings, setBuildings] = useState<Building[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentBuildingName, setCurrentBuildingName] = useState<string>('');

    // Search State
    const [searchUsers, setSearchUsers] = useState('');
    const [searchPayments, setSearchPayments] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Prepare filters
                const query = effectiveBuildingId ? { building_id: effectiveBuildingId } : {};

                const promises: [Promise<Building[]>, Promise<User[]>, Promise<Payment[]>] = [
                    isSuperAdmin ? buildingsService.getBuildings() : Promise.resolve([]),
                    usersService.getUsers(query),
                    paymentsService.getPayments(query),
                ];

                const [buildingsData, usersData, paymentsData] = await Promise.all(promises);

                setBuildings(buildingsData);
                setUsers(usersData);
                setPayments(paymentsData);

                if (effectiveBuildingId && isSuperAdmin) {
                    // Try to find name in fetched buildings if available, otherwise might need to fetch single building
                    const b = buildingsData.find(b => b.id === effectiveBuildingId);
                    if (b) {
                        setCurrentBuildingName(b.name);
                    } else {
                        // Fallback: fetch specific building if not in list (though list should have it)
                        try {
                            const specificBuilding = await buildingsService.getBuildingById(effectiveBuildingId);
                            setCurrentBuildingName(specificBuilding.name);
                        } catch (e) {
                            console.error('Failed to fetch building details', e);
                        }
                    }
                } else if (!isSuperAdmin && user?.building_name) {
                    setCurrentBuildingName(user.building_name);
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin, user, effectiveBuildingId]);

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
    const solvencyRate = users.length > 0
        ? Math.round((approvedPayments.length / users.length) * 100)
        : 0;

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isFilteredView ? `${currentBuildingName || 'Building'} Dashboard` : 'Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isFilteredView
                            ? 'Building specific overview'
                            : (isSuperAdmin ? 'System-wide overview' : 'Your building overview')
                        }
                    </p>
                </div>
                {isFilteredView && isSuperAdmin && showBuildingFilter && (
                    // If we are in global dashboard but filtered, show back button.
                    // But if we are in dedicated building dashboard, maybe show "Back to Buildings"?
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
                    title="Pending Payments"
                    value={pendingPayments.length}
                    icon={CreditCard}
                    description="Awaiting approval"
                />
                {(!isFilteredView && isSuperAdmin) ? (
                    <StatsCard
                        title="Total Revenue"
                        value={formatCurrency(totalRevenue)}
                        icon={DollarSign}
                        description="Current month"
                    />
                ) : (
                    <StatsCard
                        title="Solvency Rate"
                        value={`${solvencyRate}%`}
                        icon={TrendingUp}
                        description="Residents up-to-date"
                    />
                )}
            </div>

            {/* Dashboard Content (Tabs for Building View) */}
            {isFilteredView ? (
                <Tabs defaultValue="residents" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="residents">Building Residents</TabsTrigger>
                        <TabsTrigger value="payments">Recent Payments</TabsTrigger>
                    </TabsList>

                    {/* Residents Tab */}
                    <TabsContent value="residents" className="space-y-4">
                        <Card className="border-border/50 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-foreground">Building Residents</CardTitle>
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
        </div>
    );
}
