'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const buildingId = searchParams.get('buildingId') || undefined;

    return <DashboardView buildingId={buildingId} showBuildingFilter={!!buildingId} />;
}
