import { User } from "@/lib/auth";

export enum TaskStatus {
    BACKLOG = "BACKLOG",
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ON_HOLD = "ON_HOLD",
}

export enum TaskTag {
    BACKEND = "BACKEND",
    FRONTEND = "FRONTEND",
    DESIGN = "DESIGN",
    DEVOPS = "DEVOPS",
    QA = "QA",
    MANAGEMENT = "MANAGEMENT",
    OTHER = "OTHER",
}

export type Task = {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    tags: TaskTag[];
    dueDate?: string;
    projectId: string;
    createdById: string;
    createdBy: User;
    assignees: User[];
    createdAt: string;
    updatedAt: string;
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    [TaskStatus.BACKLOG]: "bg-gray-50 text-gray-600 border-gray-200",
    [TaskStatus.OPEN]: "bg-blue-50 text-blue-700 border-blue-200",
    [TaskStatus.IN_PROGRESS]: "bg-amber-50 text-amber-700 border-amber-200",
    [TaskStatus.ON_HOLD]: "bg-red-50 text-red-700 border-red-200",
    [TaskStatus.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const TASK_TAG_COLORS: Record<TaskTag, string> = {
    [TaskTag.BACKEND]: "bg-purple-100 text-purple-700",
    [TaskTag.FRONTEND]: "bg-pink-100 text-pink-700",
    [TaskTag.DESIGN]: "bg-indigo-100 text-indigo-700",
    [TaskTag.DEVOPS]: "bg-orange-100 text-orange-700",
    [TaskTag.QA]: "bg-teal-100 text-teal-700",
    [TaskTag.MANAGEMENT]: "bg-blue-100 text-blue-700",
    [TaskTag.OTHER]: "bg-gray-100 text-gray-700",
};
