'use client';

import { useEffect, useState, use } from 'react';
import { billingService } from '@/lib/services/billing.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { Invoice, InvoicePayment } from '@/types/models';

interface InvoiceDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const router = useRouter();
    const { id } = use(params);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [payments, setPayments] = useState<InvoicePayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [invoiceData, paymentsData] = await Promise.all([
                    billingService.getInvoiceById(id),
                    billingService.getInvoicePayments(id)
                ]);
                setInvoice(invoiceData);
                setPayments(paymentsData);
            } catch (error) {
                console.error('Failed to fetch invoice details:', error);
                toast.error('Failed to load invoice details');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Billing
                </Button>
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">Invoice not found</h2>
                </div>
            </div>
        );
    }

    const progress = (invoice.paid_amount / invoice.amount) * 100;
    const isPaid = invoice.status === 'PAID';

    // Fallback for period display
    const periodDisplay = (invoice.year && invoice.month)
        ? formatPeriod(`${invoice.year}-${String(invoice.month).padStart(2, '0')}`)
        : '--';

    // Fallback for Title
    const title = invoice.number ? `Invoice #${invoice.number}` : `Invoice ${periodDisplay}`;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">
                        {/* Show Unit ID if Name is missing */}
                        {invoice.unit?.name || (invoice.unit_id ? `Unit ID: ${invoice.unit_id}` : 'Unit N/A')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Main Invoice Info */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant={isPaid ? 'default' : 'outline'} className="mb-2 uppercase text-xs tracking-wider">
                                    {invoice.status}
                                </Badge>
                                <CardTitle className="text-3xl font-bold">
                                    {formatCurrency(invoice.amount)}
                                </CardTitle>
                                {invoice.due_date && (
                                    <CardDescription>
                                        Due Date: {formatDate(invoice.due_date)}
                                    </CardDescription>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-muted-foreground">Period</div>
                                <div className="text-lg font-semibold">{periodDisplay}</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Payment Progress</span>
                                <span className="font-medium">
                                    {formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.amount)}
                                </span>
                            </div>
                            <Progress value={progress} className="h-3 bg-muted" indicatorClassName={isPaid ? "bg-green-500" : "bg-yellow-500"} />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {invoice.issue_date && (
                                <div>
                                    <span className="text-muted-foreground block">Issued Date</span>
                                    <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground block">Building</span>
                                {/* Since we don't have building name, we try unit's building or generic */}
                                <span className="font-medium truncate">
                                    {invoice.unit?.building_id || 'Current Building'}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-muted-foreground block">Description</span>
                                <span className="font-medium">{invoice.description || 'Monthly Maintenance Fee'}</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl">Associated Payments</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Found: {payments.length} results
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No payments recorded for this invoice yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-1 rounded bg-primary/10 text-xs font-semibold text-primary">
                                                    {payment.method}
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {formatDate(payment.payment_date)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Ref: {payment.reference || '--'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-600">
                                                {formatCurrency(payment.allocated_amount)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                Total: {formatCurrency(payment.amount)}
                                            </div>
                                            <Badge variant={payment.status === 'APPROVED' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                                {payment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
