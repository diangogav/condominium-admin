'use client';

import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buildingsService } from '@/lib/services/buildings.service';
import type { Building } from '@/types/models';

const buildingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    rif: z.string().optional(),
});

type BuildingFormData = z.infer<typeof buildingSchema>;

interface BuildingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    building: Building | null;
    onSuccess: () => void;
}

export function BuildingDialog({ open, onOpenChange, building, onSuccess }: BuildingDialogProps) {
    const form = useForm<BuildingFormData>({
        resolver: zodResolver(buildingSchema),
        defaultValues: {
            name: '',
            address: '',
            rif: '',
        },
    });

    useEffect(() => {
        if (building) {
            form.reset({
                name: building.name,
                address: building.address,
                rif: building.rif || '',
            });
        } else {
            form.reset({
                name: '',
                address: '',
                rif: '',
            });
        }
    }, [building, form]);

    const onSubmit = async (data: BuildingFormData) => {
        try {
            if (building) {
                await buildingsService.updateBuilding(building.id, data);
                toast.success('Building updated successfully');
            } else {
                await buildingsService.createBuilding(data);
                toast.success('Building created successfully');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save building');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{building ? 'Edit Building' : 'Create Building'}</DialogTitle>
                    <DialogDescription>
                        {building ? 'Update building details.' : 'Add a new building to the system.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Residencias Example" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Calle 123..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rif"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RIF (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="J-12345678-9" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
