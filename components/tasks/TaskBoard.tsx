"use client";

import { useEffect, useState } from "react";
import { Plus, Filter } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import { Task, TaskStatus } from "./types";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import { useToast } from "@/components/ToastProvider";


interface TaskBoardProps {
    projectId: string;
    projectDevelopers: any[];
    canCreate: boolean;
    initialData?: { title?: string; description?: string } | null;
}

export default function TaskBoard({ projectId, projectDevelopers, canCreate, initialData }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tasks?projectId=${projectId}`);
            setTasks(res.data || []);
        } catch (error) {
            addToast("Failed to load tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [projectId]);

    useEffect(() => {
        if (initialData) {
            setEditingTask(null);
            setIsModalOpen(true);
        }
    }, [initialData]);

    const handleCreate = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as TaskStatus;
        const oldStatus = source.droppableId as TaskStatus;

        if (newStatus === oldStatus) {
            // We don't support reordering yet (no position field in DB)
            return;
        }

        // Optimistic Update
        const taskIndex = tasks.findIndex(t => t.id === draggableId);
        if (taskIndex === -1) return;

        const updatedTask = { ...tasks[taskIndex], status: newStatus };
        const newTasks = [...tasks];
        newTasks[taskIndex] = updatedTask;

        setTasks(newTasks);

        try {
            await api.patch(`/tasks/${draggableId}`, { status: newStatus });
            addToast(`Task moved to ${newStatus.replace("_", " ")}`);
        } catch (error) {
            addToast("Failed to update task status", "error");
            loadTasks(); // Revert
        }
    };

    const filteredTasks = statusFilter === "ALL"
        ? tasks
        : tasks.filter(t => t.status === statusFilter);

    // Group by status for Kanban-like feel, or just list? 
    // Requirement says "Granular Task Management... track status".
    // Let's do a simple Column layout for statuses if space allows, or a clean grid.
    // Given "Task Board" usually implies columns. 

    const COLUMNS = Object.values(TaskStatus);

    if (loading || !isBrowser) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Task Board
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Mobile Filter */}
                    <select
                        className="sm:hidden block w-full rounded-md border-gray-300 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Statuses</option>
                        {COLUMNS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {canCreate && (
                        <button
                            onClick={handleCreate}
                            className="btn btn-primary btn-sm flex items-center gap-1 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Kanban Board Layout */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                    <div className="flex gap-6 min-w-full h-full">
                        {COLUMNS.map((status) => {
                            const statusTasks = filteredTasks.filter(t => t.status === status);
                            return (
                                <Droppable key={status} droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-shrink-0 w-80 flex flex-col h-full rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className={`flex justify-between items-center mb-4 px-4 py-3 rounded-t-xl border-b-2 bg-white shadow-sm ${status === TaskStatus.BACKLOG ? "border-gray-300" :
                                                status === TaskStatus.OPEN ? "border-blue-300" :
                                                    status === TaskStatus.IN_PROGRESS ? "border-amber-300" :
                                                        status === TaskStatus.ON_HOLD ? "border-red-300" :
                                                            "border-emerald-300"
                                                }`}>
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{status.replace("_", " ")}</h4>
                                                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                                            </div>

                                            <div className="flex-1 bg-gray-50/50 rounded-b-xl border border-gray-200 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                                {statusTasks.length > 0 ? (
                                                    statusTasks.map((task, index) => (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                    className={`${snapshot.isDragging ? "opacity-90 rotate-2 scale-105" : ""}`}
                                                                >
                                                                    <TaskCard task={task} onClick={handleEdit} />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                ) : (
                                                    !snapshot.isDraggingOver && (
                                                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                                                            <p className="text-gray-400 text-xs font-medium">No tasks</p>
                                                        </div>
                                                    )
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadTasks}
                projectId={projectId}
                taskToEdit={editingTask}
                projectDevelopers={projectDevelopers}
                initialValues={initialData || undefined}
            />
        </div>
    );
}
