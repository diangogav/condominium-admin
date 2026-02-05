'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
}: StatsCardProps) {
    const [displayValue, setDisplayValue] = useState<string | number>(0);

    useEffect(() => {
        // Animate number values
        if (typeof value === 'number') {
            let start = 0;
            const duration = 1000;
            const increment = value / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                if (start >= value) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(start));
                }
            }, 16);

            return () => clearInterval(timer);
        } else {
            setDisplayValue(value);
        }
    }, [value]);

    return (
        <Card className={cn('group hover:shadow-xl transition-all duration-300 border-border/50 bg-card hover:bg-card/80 hover:-translate-y-2 hover:scale-105 relative overflow-hidden', className)}>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                    <Icon className="h-5 w-5 text-primary group-hover:text-purple-400 transition-colors" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-card-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text transition-all duration-300">
                    {displayValue}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-2 group-hover:text-muted-foreground/80 transition-colors">{description}</p>
                )}
                {trend && (
                    <p className={cn(
                        'text-xs mt-2 flex items-center font-medium transition-all',
                        trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                    )}>
                        <span className={cn(
                            'inline-block mr-1 text-base',
                            trend.isPositive ? 'animate-bounce' : ''
                        )}>
                            {trend.isPositive ? '↑' : '↓'}
                        </span>
                        {Math.abs(trend.value)}%
                        <span className="text-muted-foreground ml-1 font-normal opacity-70">vs last month</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
