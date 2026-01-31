'use client';

import { useCallback, useEffect, useState } from 'react';
import { paymentsService } from '@/lib/services/payments.service';
import { buildingsService } from '@/lib/services/buildings.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Payment, Building } from '@/types/models';
import { formatCurrency, formatDate, formatPaymentMethod } from '@/lib/utils/format';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

import { useSearchParams } from 'next/navigation';

export default function PaymentsPage() {
    const { isSuperAdmin, user } = usePermissions();
    const searchParams = useSearchParams();
    const userIdParam = searchParams.get('user_id');

    const [payments, setPayments] = useState<Payment[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [filterBuildingId, setFilterBuildingId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
    const [filterPeriod, setFilterPeriod] = useState<string>(''); // Optional period filter

    // Proof Dialog
    const [proofUrl, setProofUrl] = useState<string | null>(null);

    // Approval Dialog State
    const [approvalPaymentId, setApprovalPaymentId] = useState<string | null>(null);
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Determine building ID
            let buildingId = undefined;
            if (isSuperAdmin) {
                if (filterBuildingId && filterBuildingId !== 'all') {
                    buildingId = filterBuildingId;
                }
            } else {
                buildingId = user?.building_id;
            }

            const query: Record<string, string> = {};
            if (userIdParam) {
                query.user_id = userIdParam;
                // If filtering by user, we might want to ignore other filters or set defaults?
                // For now, let's allow combining, but user might expect to see ALL history for that user.
                // Let's loosen year filter if userIdParam is present
                if (filterYear) query.year = filterYear;
            } else {
                if (buildingId) query.building_id = buildingId;
                if (filterYear) query.year = filterYear;
            }

            if (filterStatus && filterStatus !== 'all') query.status = filterStatus;
            if (filterPeriod) query.period = filterPeriod;

            const [paymentsData, buildingsData] = await Promise.all([
                paymentsService.getPayments(query),
                isSuperAdmin ? buildingsService.getBuildings() : Promise.resolve([])
            ]);

            setPayments(paymentsData);
            setBuildings(buildingsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to fetch payments');
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, user, filterBuildingId, filterStatus, filterPeriod, filterYear, userIdParam]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openApprovalDialog = (payment: Payment) => {
        setApprovalPaymentId(payment.id);
        const periods = payment.periods || (payment.period ? [payment.period] : []);
        setAvailablePeriods(periods);
        setSelectedPeriods(periods); // Default select all
    };

    const togglePeriod = (period: string) => {
        setSelectedPeriods(prev =>
            prev.includes(period)
                ? prev.filter(p => p !== period)
                : [...prev, period]
        );
    };

    const handleConfirmApprove = async () => {
        if (!approvalPaymentId) return;

        try {
            // If all periods selected, send undefined to let backend handle default (or send full array)
            // Backend spec says: "If omitted, all requested periods are approved."
            // So if selectedPeriods.length === availablePeriods.length, we can pass undefined.
            // But confirming sending the array is safer if logic is complex.
            // However, let's follow spec: send array if subset.

            const isSubset = selectedPeriods.length < availablePeriods.length;
            const periodsToSend = isSubset ? selectedPeriods : undefined;

            if (selectedPeriods.length === 0) {
                toast.error('Must select at least one period to approve');
                return;
            }

            await paymentsService.approvePayment(approvalPaymentId, undefined, periodsToSend);
            toast.success('Payment approved successfully');
            setApprovalPaymentId(null);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to approve payment');
        }
    };

    const handleReject = async (paymentId: string) => {
        const reason = prompt('Reason for rejection:');
        if (reason === null) return; // Cancelled

        try {
            await paymentsService.rejectPayment(paymentId, reason);
            toast.success('Payment rejected');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to reject payment');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Payments</h1>
                    <p className="text-muted-foreground mt-1">Manage and review payments</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 border-border/50 bg-card">
                <div className="flex flex-wrap gap-4">
                    {isSuperAdmin && (
                        <div className="w-full md:w-64">
                            <Select value={filterBuildingId} onValueChange={setFilterBuildingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Building" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Buildings</SelectItem>
                                    {buildings.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="w-full md:w-48">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-32">
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-48">
                        <Input
                            placeholder="Period (e.g. 2024-01)"
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <Card className="border-border/50 bg-card">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Periods</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ref</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Proof</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 bg-card">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading payments...</td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No payments found.</td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-accent/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                {formatDate(payment.payment_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                {payment.user?.name || 'Unknown'} <br />
                                                <span className="text-xs text-muted-foreground">{payment.user?.building_name || ''} {payment.user?.unit ? `Unit ${payment.user.unit}` : ''}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {payment.periods ? payment.periods.join(', ') : (payment.period || '-')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {formatPaymentMethod(payment.method)} <br />
                                                <span className="text-xs">{payment.reference}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {payment.proof_url ? (
                                                    <Button variant="ghost" size="sm" onClick={() => setProofUrl(payment.proof_url!)}>
                                                        <Eye className="h-4 w-4 mr-1" /> View
                                                    </Button>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    className={
                                                        payment.status === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' :
                                                            payment.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                                                                'bg-red-500 hover:bg-red-600'
                                                    }
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {payment.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openApprovalDialog(payment)}
                                                            className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(payment.id)}
                                                            className="h-8 w-8 p-0"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Proof Dialog */}
            <Dialog open={!!proofUrl} onOpenChange={(open) => !open && setProofUrl(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Payment Proof</DialogTitle>
                    </DialogHeader>
                    {proofUrl && (
                        <div className="relative w-full h-[600px]">
                            {/* Use standard img tag if external URL not configured in next.config.js, or try Image with unoptimized */}
                            <Image
                                src={proofUrl}
                                alt="Payment Proof"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approval Dialog */}
            <Dialog open={!!approvalPaymentId} onOpenChange={(open) => !open && setApprovalPaymentId(null)}>
                <DialogContent className="sm:max-w-[425px] bg-background">
                    <DialogHeader>
                        <DialogTitle>Approve Payment</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <h4 className="mb-4 text-sm font-medium leading-none">Select Periods to Approve</h4>
                        <div className="grid gap-2">
                            {availablePeriods.map((period) => (
                                <div key={period} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={period}
                                        checked={selectedPeriods.includes(period)}
                                        onChange={() => togglePeriod(period)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label
                                        htmlFor={period}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {period}
                                    </label>
                                </div>
                            ))}
                            {availablePeriods.length === 0 && (
                                <p className="text-sm text-muted-foreground">No specific periods listed.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setApprovalPaymentId(null)}>Cancel</Button>
                        <Button onClick={handleConfirmApprove}>Confirm Approval</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
