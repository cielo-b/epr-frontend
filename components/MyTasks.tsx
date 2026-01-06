"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import api from "@/lib/api";

interface Task {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
    project: {
        id: string;
        name: string;
    };
}

interface MyTasksProps {
    userId: string;
}

export function MyTasks({ userId }: MyTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMyTasks = async () => {
            try {
                // Fetch tasks assigned to current user
                const response = await api.get(`/tasks?assigneeId=${userId}`);
                setTasks(response.data || []);
            } catch (error) {
                console.error("Failed to load my tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadMyTasks();
        }
    }, [userId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <CheckCircle2 className="h-4 w-4 text-brand-green-500" />;
            case "IN_PROGRESS":
                return <Clock className="h-4 w-4 text-amber-500" />;
            case "ON_HOLD":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        <div className="h-10 bg-gray-100 rounded"></div>
                        <div className="h-10 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    const activeTasks = tasks.filter(t => t.status !== "COMPLETED");

    return (
        <section className="bg-white border border-brand-green-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">My Assigned Tasks</h3>
                    <p className="text-sm text-gray-500">You have {activeTasks.length} pending tasks</p>
                </div>
                <span className="px-3 py-1 bg-brand-green-50 text-brand-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    Roadmap
                </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px]">
                {tasks.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {tasks.slice(0, 5).map((task) => (
                            <Link
                                key={task.id}
                                href={`/projects/${task.project.id}?tab=tasks`}
                                className="block p-4 hover:bg-brand-green-50/30 transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusIcon(task.status)}
                                            <span className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-green-700 transition-colors">
                                                {task.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                                {task.project.name}
                                            </span>
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(task.dueDate), "MMM d")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-4 w-4 text-brand-green-500" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <CheckCircle2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium">No tasks assigned to you</p>
                        <p className="text-xs mt-1">Great job! You're all caught up.</p>
                    </div>
                )}
            </div>


        </section>
    );
}
