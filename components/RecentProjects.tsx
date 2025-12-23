"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, User as UserIcon } from "lucide-react";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    manager: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

interface RecentProjectsProps {
    projects: Project[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
    const recent = useMemo(() => {
        return projects ? projects.slice(0, 5) : [];
    }, [projects]);

    if (!recent.length) {
        return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="bg-[var(--bg-root)] p-4 rounded-full mb-3">
                    <Calendar className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">No Projects Yet</h3>
                <p className="text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
                    Start by creating your first project to track progress and team performance.
                </p>
                <Link
                    href="/projects" // Using /projects as /projects/new might not exist directly without a list
                    className="text-sm font-medium bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition"
                >
                    Create Project
                </Link>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20";
            case "completed":
                return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20";
            case "pending":
                return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800 ring-1 ring-amber-500/20";
            case "cancelled":
                return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800 ring-1 ring-rose-500/20";
            default:
                return "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-800 ring-1 ring-slate-500/20";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status.toLowerCase()) {
            case "active": return "bg-emerald-500";
            case "completed": return "bg-blue-500";
            case "pending": return "bg-amber-500";
            case "cancelled": return "bg-rose-500";
            default: return "bg-slate-500";
        }
    };

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        Recent Projects
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Latest 5 active projects
                    </p>
                </div>
                <Link
                    href="/projects"
                    className="text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 dark:text-brand-blue-400 dark:hover:text-brand-blue-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/20"
                >
                    View All <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-active)] text-[var(--text-secondary)] font-medium uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Project Details</th>
                            <th className="px-6 py-4">Manager</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Created Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {recent.map((project) => (
                            <tr
                                key={project.id}
                                className="hover:bg-[var(--bg-active)]/50 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[var(--text-primary)] group-hover:text-brand-blue-600 transition-colors text-base">
                                            {project.name}
                                        </span>
                                        {project.description && (
                                            <span className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-1 max-w-[200px]">
                                                {project.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-xs shadow-sm">
                                            {project.manager
                                                ? `${project.manager.firstName[0]}${project.manager.lastName[0]}`
                                                : "?"}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-primary)] font-medium">
                                                {project.manager
                                                    ? `${project.manager.firstName} ${project.manager.lastName}`
                                                    : "Unassigned"}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(project.status)}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(project.status)}`} />
                                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-[var(--text-secondary)] font-medium">
                                    {format(new Date(project.createdAt), "MMM d, yyyy")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
