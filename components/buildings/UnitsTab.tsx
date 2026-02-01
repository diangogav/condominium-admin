import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wand2, User as UserIcon } from 'lucide-react';
import { unitsService } from '@/lib/services/units.service';
import { usersService } from '@/lib/services/users.service';
import type { Unit, User } from '@/types/models';
import { toast } from 'sonner';
import { CreateUnitDialog } from './CreateUnitDialog';
import { BatchUnitWizard } from './BatchUnitWizard';
import { UnitDetailsSheet } from './UnitDetailsSheet';
import { Badge } from '@/components/ui/badge';

interface UnitsTabProps {
    buildingId: string;
}

export function UnitsTab({ buildingId }: UnitsTabProps) {
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBatchOpen, setIsBatchOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [unitsData, usersData] = await Promise.all([
                unitsService.getUnits(buildingId),
                usersService.getUsers({ building_id: buildingId })
            ]);
            setUnits(unitsData);
            setUsers(usersData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch units data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (buildingId) {
            fetchData();
        }
    }, [buildingId]);

    // Helper to find resident for a unit
    const getUnitResident = (unitName: string) => {
        return users.find(u => u.unit === unitName);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Units ({units.length})</h3>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Unit
                    </Button>
                    <Button onClick={() => setIsBatchOpen(true)} className="bg-primary">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Auto-Generate
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Unit Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Floor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Current Resident</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Aliquot (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading units...</td>
                                    </tr>
                                ) : units.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No units found. Create one or use the generator!</td>
                                    </tr>
                                ) : (
                                    units.map((unit) => {
                                        const resident = getUnitResident(unit.name);
                                        return (
                                            <tr
                                                key={unit.id}
                                                className="hover:bg-accent/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedUnit(unit)}
                                            >
                                                <td className="px-6 py-4 font-medium text-primary">{unit.name}</td>
                                                <td className="px-6 py-4">{unit.floor}</td>
                                                <td className="px-6 py-4">
                                                    {resident ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                                                <UserIcon className="h-3 w-3" />
                                                            </div>
                                                            <span className="text-sm font-medium">{resident.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm italic">Vacant</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">{unit.aliquot}%</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <CreateUnitDialog
                buildingId={buildingId}
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchData}
            />

            <BatchUnitWizard
                buildingId={buildingId}
                isOpen={isBatchOpen}
                onClose={() => setIsBatchOpen(false)}
                onSuccess={fetchData}
            />

            <UnitDetailsSheet
                unit={selectedUnit}
                open={!!selectedUnit}
                onOpenChange={(open) => !open && setSelectedUnit(null)}
            />
        </div>
    );
}
