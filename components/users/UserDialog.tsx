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
import { usersService } from '@/lib/services/users.service';
import { unitsService } from '@/lib/services/units.service'; // Added
import type { User, Building, Unit } from '@/types/models';


interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    buildings: Building[];
    onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, buildings, onSuccess }: UserDialogProps) {
    const [units, setUnits] = useState<Unit[]>([]);

    // Dynamic schema based on user prop
    const schema = z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: user
            ? z.string().optional()
            : z.string().min(6, 'Password is required for new users'),
        phone: z.string().optional(),
        unit_id: z.string().optional(), // Changed from unit to unit_id
        building_id: z.string().min(1, 'Building is required'),
        role: z.enum(['resident', 'board', 'admin']),
        status: z.enum(['active', 'pending', 'inactive', 'rejected']),
    });

    type UserFormData = z.infer<typeof schema>;

    const form = useForm<UserFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            phone: '',
            unit_id: '',
            building_id: '',
            role: 'resident',
            status: 'active',
        },
    });

    // Watch building_id to fetch units
    const selectedBuildingId = form.watch('building_id');

    useEffect(() => {
        const fetchUnits = async () => {
            if (selectedBuildingId) {
                try {
                    const fetchedUnits = await unitsService.getUnits(selectedBuildingId);
                    setUnits(fetchedUnits);
                } catch (error) {
                    console.error("Failed to fetch units", error);
                    toast.error("Failed to load units for selected building");
                    setUnits([]);
                }
            } else {
                setUnits([]);
            }
        };
        fetchUnits();
    }, [selectedBuildingId]);

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                password: '', // Don't fill password on edit
                phone: user.phone || '',
                unit_id: user.unit_id || '', // Use unit_id if available, fallback handled via logic? user.unit_id is strict now
                building_id: user.building_id || '',
                role: user.role,
                status: user.status || 'active',
            });
            // Ideally if user has unit_id, we fetch units for that building so the dropdown is populated
            // The useEffect on selectedBuildingId will handle fetching units when form resets building_id
        } else {
            form.reset({
                name: '',
                email: '',
                password: '',
                phone: '',
                unit_id: '',
                building_id: '',
                role: 'resident', // Default to resident, user can change to board
                status: 'active',
            });
        }
    }, [user, form]);

    const onSubmit = async (data: UserFormData) => {
        try {
            // Find selected unit name to optionally send it too? 
            // The DTO now supports unit_id. The backend should handle the relation.
            // If backend strictly needs unit name for legacy, we might need to send it.
            // Let's assume we send unit_id and backend updates relation.

            // Map unit_id to unit name if we need to support legacy field or if API expects it
            const selectedUnitIdx = units.find(u => u.id === data.unit_id);
            const payload = {
                ...data,
                unit: selectedUnitIdx?.name, // Send name for legacy/display compatibility
            };

            if (user) {
                // Update
                const updateData: any = { ...payload };
                if (!updateData.password) delete updateData.password; // Remove empty password if not changing

                await usersService.updateUser(user.id, updateData);
                toast.success('User updated successfully');
            } else {
                // Create
                if (!data.password) {
                    form.setError('password', { message: 'Password is required' });
                    return;
                }
                await usersService.createUser({
                    ...payload,
                    password: data.password,
                });
                toast.success('User created successfully');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error(user ? 'Failed to update user' : 'Failed to create user');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Update user details.' : 'Add a new user to the system.'}
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
                                        <Input {...field} placeholder="John Doe" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="john@example.com" disabled={!!user} />
                                    </FormControl>
                                    {user && <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed.</p>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{user ? 'New Password (Optional)' : 'Password'}</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" placeholder={user ? 'Leave blank to keep current' : '******'} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="+58..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="building_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Building</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select building" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {buildings.map((b) => (
                                                    <SelectItem key={b.id} value={b.id}>
                                                        {b.name}
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
                                name="unit_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                            disabled={!selectedBuildingId || units.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={selectedBuildingId ? (units.length === 0 ? "Loading..." : "Select unit") : "Select building first"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {units.map((u) => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="resident">Resident</SelectItem>
                                                <SelectItem value="board">Board Member</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{user ? 'Save Changes' : 'Create User'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
