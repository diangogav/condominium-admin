import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { unitsService } from '@/lib/services/units.service';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(1, 'Unit name is required'),
    floor: z.string().min(1, 'Floor is required'),
    aliquot: z.any(), // Using any to bypass Zod/Resolver type mismatch during build
});

type FormData = z.infer<typeof schema>;

interface CreateUnitDialogProps {
    buildingId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUnitDialog({ buildingId, isOpen, onClose, onSuccess }: CreateUnitDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            floor: '',
            aliquot: 0,
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            await unitsService.createUnit(buildingId, data);
            toast.success('Unit created successfully');
            onSuccess();
            onClose();
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create unit');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Unit</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit Name / Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 1A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="floor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Floor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="aliquot"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aliquot (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 1.5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Unit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
