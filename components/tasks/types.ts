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
    [TaskStatus.OPEN]: "bg-brand-green-50 text-brand-green-700 border-brand-green-200",
    [TaskStatus.IN_PROGRESS]: "bg-brand-green-100 text-brand-green-800 border-brand-green-300",
    [TaskStatus.ON_HOLD]: "bg-gray-100 text-gray-700 border-gray-300",
    [TaskStatus.COMPLETED]: "bg-brand-green-600 text-white border-brand-green-700",
};

export const TASK_TAG_COLORS: Record<TaskTag, string> = {
    [TaskTag.BACKEND]: "bg-brand-green-900 text-white",
    [TaskTag.FRONTEND]: "bg-brand-green-700 text-white",
    [TaskTag.DESIGN]: "bg-brand-green-600 text-white",
    [TaskTag.DEVOPS]: "bg-brand-green-800 text-white",
    [TaskTag.QA]: "bg-brand-green-500 text-white",
    [TaskTag.MANAGEMENT]: "bg-brand-green-400 text-white",
    [TaskTag.OTHER]: "bg-gray-200 text-gray-800",
};
