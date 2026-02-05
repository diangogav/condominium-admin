'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { billingService } from '@/lib/services/billing.service';
import { unitsService } from '@/lib/services/units.service';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { Unit } from '@/types/models';

const invoiceSchema = z.object({
    unit_id: z.string().min(1, 'Unit is required'),
    amount: z.number().positive('Amount must be positive'),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    due_date: z.string().optional(),
});

type InvoiceFormValues = {
    unit_id: string;
    amount: number;
    period: string;
    description: string;
    due_date?: string;
};

interface InvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialUnitId?: string;
}

export function InvoiceDialog({ open, onOpenChange, onSuccess, initialUnitId }: InvoiceDialogProps) {
    const { buildingId } = usePermissions();
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            unit_id: initialUnitId || '',
            amount: 0,
            period: new Date().toISOString().slice(0, 7),
            description: '',
            due_date: '',
        },
    });

    useEffect(() => {
        if (open && buildingId) {
            const fetchUnits = async () => {
                try {
                    setIsLoadingUnits(true);
                    const data = await unitsService.getUnits(buildingId);
                    setUnits(data);
                } catch (error) {
                    console.error('Failed to fetch units', error);
                    toast.error('Failed to load units');
                } finally {
                    setIsLoadingUnits(false);
                }
            };
            fetchUnits();
        }
    }, [open, buildingId]);

    useEffect(() => {
        if (initialUnitId && open) {
            form.setValue('unit_id', initialUnitId);
        }
    }, [initialUnitId, open, form]);

    const onSubmit = async (values: InvoiceFormValues) => {
        try {
            // Explicitly cast or convert amount to number if it's not already
            const payload = {
                ...values,
                amount: Number(values.amount)
            };
            await billingService.loadDebt(payload);
            toast.success('Invoice created successfully');
            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            console.error('Failed to create invoice', error);
            toast.error(error.response?.data?.message || 'Failed to create invoice');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                        Load a new debt to a specific unit.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="unit_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <Select
                                        disabled={!!initialUnitId || isLoadingUnits}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id}>
                                                    {unit.name} {unit.floor ? `(Floor ${unit.floor})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Period (YYYY-MM)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="2026-02" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Monthly maintenance fee" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Creating...' : 'Create Invoice'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
