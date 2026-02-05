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
    FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { usersService } from '@/lib/services/users.service';
import { unitsService } from '@/lib/services/units.service';
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

    const schema = z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: user
            ? z.string().optional()
            : z.string().min(6, 'Password is required for new users'),
        phone: z.string().optional(),
        unit_ids: z.array(z.string()).optional(), // Changed to array
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
            unit_ids: [],
            building_id: '',
            role: 'resident',
            status: 'active',
        },
    });

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

    // Reset form when user changes
    useEffect(() => {
        if (user) {
            // Extract unit IDs from user object
            let initialUnitIds: string[] = [];
            if (user.units && user.units.length > 0) {
                // Handle both UserUnit (unit_id) and raw Unit (id) structures
                initialUnitIds = user.units.map(u => u.unit_id || (u as any).id).filter(Boolean);
            } else if (user.unit_id) {
                initialUnitIds = [user.unit_id];
            }

            // Robust building ID extraction
            // Check root, then building object, then first unit's building
            const buildingId = user.building_id ||
                user.building?.id ||
                (user.units && user.units.length > 0 ? user.units[0].building_id : '') ||
                '';

            form.reset({
                name: user.name,
                email: user.email,
                password: '',
                phone: user.phone || '',
                unit_ids: initialUnitIds,
                building_id: buildingId,
                role: user.role,
                status: user.status || 'active',
            });
        } else {
            form.reset({
                name: '',
                email: '',
                password: '',
                phone: '',
                unit_ids: [],
                building_id: '',
                role: 'resident',
                status: 'active',
            });
        }
    }, [user, form]);

    const onSubmit = async (data: UserFormData) => {
        try {
            // Data transformation
            const payload = {
                ...data,
                // We send unit_ids. 
                // Legacy 'unit' name string support: join names of selected units
                unit: units
                    .filter(u => data.unit_ids?.includes(u.id))
                    .map(u => u.name)
                    .join(', '),
            };

            if (user) {
                const updateData: any = { ...payload };
                if (!updateData.password) delete updateData.password;

                await usersService.updateUser(user.id, updateData);
                toast.success('User updated successfully');
            } else {
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                            name="unit_ids"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Units</FormLabel>
                                        <FormDescription>
                                            Select all units owned/occupied by this user.
                                        </FormDescription>
                                    </div>
                                    <div className="border rounded-md p-4">
                                        {!selectedBuildingId ? (
                                            <p className="text-sm text-muted-foreground text-center">Select a building first</p>
                                        ) : units.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center">Loading units...</p>
                                        ) : (
                                            <ScrollArea className="h-[150px]">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {units.map((unit) => (
                                                        <FormField
                                                            key={unit.id}
                                                            control={form.control}
                                                            name="unit_ids"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={unit.id}
                                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(unit.id)}
                                                                                onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                                                    return checked === true
                                                                                        ? field.onChange([...(field.value || []), unit.id])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== unit.id
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal cursor-pointer">
                                                                            {unit.name}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
