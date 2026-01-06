"use client";

import {
    Users,
    Briefcase,
    FileText,
    FileBarChart,
    TrendingUp,
    Activity
} from "lucide-react";

interface DashboardStatsProps {
    stats: {
        overview: {
            totalUsers: number;
            totalProjects: number;
            totalDocuments: number;
            totalReports: number;
        };
    };
    projects?: any[]; // Pass recent projects to calculate "New" stats
}

export function DashboardStats({ stats, projects = [] }: DashboardStatsProps) {
    if (!stats) return null;

    const { overview } = stats;

    // Calculate new projects in last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const newProjectsCount = projects ? projects.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length : 0;

    interface StatCard {
        label: string;
        value: any;
        icon: any;
        color: string;
        bg: string;
        trend?: string;
        trendUp?: boolean;
    }

    const cards: StatCard[] = stats.overview.totalUsers !== undefined ? [
        {
            label: "Total Users",
            value: stats.overview.totalUsers,
            icon: Users,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        },
        {
            label: "Active Projects",
            value: stats.overview.totalProjects,
            icon: Briefcase,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
            trend: `${newProjectsCount} new this month`,
            trendUp: newProjectsCount > 0
        },
        {
            label: "Documents",
            value: stats.overview.totalDocuments,
            icon: FileText,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        },
        {
            label: "Reports Generated",
            value: stats.overview.totalReports,
            icon: FileBarChart,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        },
    ] : [
        {
            label: "Assigned Projects",
            value: (stats.overview as any).assignedProjects,
            icon: Briefcase,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        },
        {
            label: "My Open Tasks",
            value: (stats.overview as any).assignedTasks,
            icon: Activity,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        },
        {
            label: "Team Updates",
            value: projects.length, // Rough proxy for activity
            icon: TrendingUp,
            color: "text-brand-green-700",
            bg: "bg-brand-green-50",
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 group"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">
                                {card.label}
                            </p>
                            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2 tracking-tight">
                                {card.value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                    </div>

                    {(card.trend) && (
                        <div className="mt-4 flex items-center text-xs font-medium">
                            {card.trendUp ? (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                    <TrendingUp className="h-3 w-3" />
                                    {card.trend}
                                </span>
                            ) : (
                                <span className="text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--bg-active)] px-2 py-1 rounded-full">
                                    <Activity className="h-3 w-3" />
                                    {card.trend}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
