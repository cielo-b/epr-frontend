import { Task, TaskStatus, TaskTag, TASK_STATUS_COLORS, TASK_TAG_COLORS } from "./types";
import { User } from "@/lib/auth";
import { Calendar, User as UserIcon, Tag, Clock } from "lucide-react";

interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
    return (
        <div
            onClick={() => onClick(task)}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-3 group"
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-green-600 transition-colors">
                    {task.title}
                </h4>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${TASK_STATUS_COLORS[task.status]}`}>
                    {task.status.replace("_", " ")}
                </div>
            </div>

            <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                    <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TASK_TAG_COLORS[tag]}`}>
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2">
                    {task.assignees.length > 0 ? (
                        <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((user) => (
                                <div
                                    key={user.id}
                                    className="w-6 h-6 rounded-full bg-brand-green-100 border border-white flex items-center justify-center text-[10px] font-bold text-brand-green-700"
                                    title={`${user.firstName} ${user.lastName}`}
                                >
                                    {user.firstName[0]}
                                    {user.lastName[0]}
                                </div>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-600">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 italic flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> Unassigned
                        </span>
                    )}
                </div>

                {task.dueDate && (
                    <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
}
