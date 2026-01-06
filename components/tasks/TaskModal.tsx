"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { User } from "@/lib/auth";
import { Task, TaskStatus, TaskTag } from "./types";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId: string;
    taskToEdit?: Task | null;
    projectDevelopers: any[]; // User type but with flexibility
    initialValues?: { title?: string; description?: string };
}

export default function TaskModal({ isOpen, onClose, onSuccess, projectId, taskToEdit, projectDevelopers, initialValues }: TaskModalProps) {
    const { addToast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
    }, []);

    const isDeveloper = user?.role === "DEVELOPER";
    const isManagerOrAdmin = ["BOSS", "SUPERADMIN", "PROJECT_MANAGER", "DEVOPS"].includes(user?.role || "");
    const canEditAllFields = isManagerOrAdmin || (taskToEdit && taskToEdit.createdBy?.id === user?.id);
    const isAssignee = taskToEdit?.assignees.some(a => a.id === user?.id);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: TaskStatus.OPEN,
        tags: [] as TaskTag[],
        dueDate: "",
        assigneeIds: [] as string[],
    });

    useEffect(() => {
        if (taskToEdit) {
            setFormData({
                title: taskToEdit.title,
                description: taskToEdit.description || "",
                status: taskToEdit.status,
                tags: taskToEdit.tags,
                dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 16) : "",
                assigneeIds: taskToEdit.assignees.map(a => a.id),
            });
        } else {
            setFormData({
                title: initialValues?.title || "",
                description: initialValues?.description || "",
                status: TaskStatus.OPEN,
                tags: [],
                dueDate: "",
                assigneeIds: [],
            });
        }
    }, [taskToEdit, isOpen, initialValues]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        if (formData.dueDate) {
            const selectedDate = new Date(formData.dueDate);
            const now = new Date();
            if (selectedDate < now) {
                addToast("Due date cannot be in the past", "error");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                projectId,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
            };

            if (taskToEdit) {
                await api.patch(`/tasks/${taskToEdit.id}`, payload);
                addToast("Task updated successfully");
            } else {
                await api.post("/tasks", payload);
                addToast("Task created successfully");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Failed to save task";
            addToast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!taskToEdit) return;

        setLoading(true);
        try {
            await api.delete(`/tasks/${taskToEdit.id}`);
            addToast("Task deleted successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast("Failed to delete task", "error");
        } finally {
            setLoading(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const toggleTag = (tag: TaskTag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const toggleAssignee = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            assigneeIds: prev.assigneeIds.includes(userId)
                ? prev.assigneeIds.filter(id => id !== userId)
                : [...prev.assigneeIds, userId]
        }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-900">
                            {taskToEdit ? "Edit Task" : "Create New Task"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500 px-3 py-2 border disabled:bg-gray-50 disabled:text-gray-500"
                                    placeholder="e.g. Implement login API"
                                    required
                                    disabled={!canEditAllFields}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500 px-3 py-2 border h-24 disabled:bg-gray-50 disabled:text-gray-500"
                                    placeholder="Details about the task..."
                                    disabled={!canEditAllFields}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500 px-3 py-2 border bg-white"
                                    >
                                        {Object.values(TaskStatus).map((s) => (
                                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500 px-3 py-2 border disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={!canEditAllFields}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(TaskTag).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            disabled={!canEditAllFields}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-50 ${formData.tags.includes(tag)
                                                ? "bg-brand-green-50 text-brand-green-700 border-brand-green-500 ring-1 ring-brand-green-500"
                                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                }`}
                                        >
                                            {formData.tags.includes(tag) && <Check className="w-3 h-3" />}
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                    {projectDevelopers.length > 0 ? projectDevelopers.map(dev => (
                                        <label key={dev.id} className={`flex items-center gap-2 p-1 rounded ${!canEditAllFields ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.assigneeIds.includes(dev.id)}
                                                onChange={() => toggleAssignee(dev.id)}
                                                disabled={!canEditAllFields}
                                                className="rounded text-brand-green-600 focus:ring-brand-green-500 disabled:bg-gray-100"
                                            />
                                            <span className="text-sm text-gray-700">{dev.firstName} {dev.lastName}</span>
                                        </label>
                                    )) : (
                                        <p className="text-sm text-gray-500 col-span-2 text-center py-2">No developers assigned to project</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between p-6 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10 rounded-b-xl">
                            {taskToEdit && canEditAllFields ? (
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2"
                                >
                                    Delete Task
                                </button>
                            ) : <div></div>}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 btn btn-primary text-sm font-medium text-white rounded-md disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : taskToEdit ? "Save Changes" : "Create Task"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="modal-overlay !z-[100]">
                    <div className="modal-card max-w-sm">
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Task?</h3>
                            <button onClick={() => setIsDeleteConfirmOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Are you sure you want to permanently delete <strong>"{taskToEdit?.title}"</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="btn btn-danger"
                                disabled={loading}
                            >
                                {loading ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
