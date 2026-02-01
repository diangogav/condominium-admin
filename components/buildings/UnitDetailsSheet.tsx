import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Unit, User, Payment } from '@/types/models';
import { useEffect, useState, useMemo } from 'react';
import { usersService } from '@/lib/services/users.service';
import { paymentsService } from '@/lib/services/payments.service';
import { Loader2, User as UserIcon, CreditCard, History, Users } from 'lucide-react';

interface UnitDetailsSheetProps {
    unit: Unit | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UnitDetailsSheet({ unit, open, onOpenChange }: UnitDetailsSheetProps) {
    const [residents, setResidents] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (unit && open) {
            fetchDetails();
        }
    }, [unit, open]);

    const fetchDetails = async () => {
        if (!unit) return;
        try {
            setIsLoading(true);

            // 1. Fetch residents for this unit
            // Note: This relies on exact string match of 'unit' field. 
            // In a real app, might want a robust relation, but strict string matching works for now per models.
            const allUsers = await usersService.getUsers({ building_id: unit.building_id });
            // Filter client-side if API doesn't support strict unit filtering yet, or use specific API if available.
            // usersService.getUsers supports query params. Let's assume we filter client side for better accuracy with "1-A" vs "1-A " etc if needed,
            // or better yet, if backend supports it.
            // Let's filter client side to be safe for now, as API might be broad.
            const unitResidents = allUsers.filter(u => u.unit === unit.name);
            setResidents(unitResidents);

            // 2. Fetch payments for these residents
            if (unitResidents.length > 0) {
                const residentIds = unitResidents.map(u => u.id);
                // We need to fetch payments for ALL these users. 
                // paymentsService doesn't accept array of IDs. We might need to fetch by building and filter, 
                // or fetch individually. Fetching by building is safer for batch.
                const allBuildingPayments = await paymentsService.getPayments({ building_id: unit.building_id });
                const unitPayments = allBuildingPayments.filter(p => residentIds.includes(p.user_id));
                setPayments(unitPayments);
            } else {
                setPayments([]);
            }

        } catch (error) {
            console.error("Failed to fetch unit details", error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalPaid = useMemo(() =>
        payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.amount, 0),
        [payments]);

    const pendingAmount = useMemo(() =>
        payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
        [payments]);

    if (!unit) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Unit {unit.name}</SheetTitle>
                    <SheetDescription>
                        Floor {unit.floor} • Aliquot {unit.aliquot}%
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 pt-4">
                                    <div className="text-sm font-medium text-muted-foreground">Total Paid</div>
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 pt-4">
                                    <div className="text-sm font-medium text-muted-foreground">Pending</div>
                                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="residents">
                            <TabsList className="w-full">
                                <TabsTrigger value="residents" className="flex-1">Residents</TabsTrigger>
                                <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
                            </TabsList>

                            <TabsContent value="residents" className="mt-4 space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Current Residents
                                </h3>
                                {residents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No residents assigned to this unit.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {residents.map(resident => (
                                            <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <UserIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{resident.name}</p>
                                                        <p className="text-xs text-muted-foreground">{resident.email}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="capitalize">{resident.role}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="payments" className="mt-4 space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <History className="h-4 w-4" /> Payment History
                                </h3>

                                {payments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No payments found for this unit.</p>
                                ) : (
                                    <div className="h-[400px] w-full pr-4 overflow-y-auto">
                                        <div className="space-y-3">
                                            {payments.map(payment => (
                                                <div key={payment.id} className="flex flex-col p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {payment.period || formatDate(payment.payment_date)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
                                                        </div>
                                                        <Badge variant={
                                                            payment.status === 'APPROVED' ? 'default' :
                                                                payment.status === 'PENDING' ? 'secondary' : 'destructive'
                                                        }>
                                                            {payment.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">{payment.method}</span>
                                                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                                    </div>
                                                    {payment.user && (
                                                        <p className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                                                            By: {payment.user.name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
