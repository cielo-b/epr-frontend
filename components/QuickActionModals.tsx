"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface Project {
    id: string;
    name: string;
}

interface Developer {
    id: string;
    firstName: string;
    lastName: string;
}

interface QuickActionModalsProps {
    type: "assign-dev" | "announcement" | "meeting" | "update-request" | "milestone" | "pulse" | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

export function QuickActionModals({ type, onClose, onSuccess }: QuickActionModalsProps) {
    const { addToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedDevId, setSelectedDevId] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState("low");
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
    const [pulseStatus, setPulseStatus] = useState<"ON_TRACK" | "DELAYED" | "COMPLETED">("ON_TRACK");

    useEffect(() => {
        if (type) {
            loadInitialData();
        }
    }, [type]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const projectsRes = await api.get("/projects");
            setProjects(projectsRes.data);

            if (type === "assign-dev") {
                const usersRes = await api.get("/users");
                setDevelopers(usersRes.data.filter((u: any) => u.role === "DEVELOPER"));
            } else if (type === "meeting") {
                const usersRes = await api.get("/users");
                setDevelopers(usersRes.data); // All users for meetings
            } else if (type === "update-request" || type === "milestone") {
                // Just projects needed
            }
        } catch (error) {
            addToast("Failed to load necessary data", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendee = (id: string) => {
        setAttendeeIds(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (type === "assign-dev") {
                await api.post(`/projects/${selectedProjectId}/assign-developer`, {
                    developerId: selectedDevId,
                });
                onSuccess("Developer assigned successfully!");
            } else if (type === "announcement") {
                await api.post("/announcements", {
                    message,
                    priority,
                    projectId: selectedProjectId || undefined,
                });
                onSuccess("Announcement posted successfully!");
            } else if (type === "meeting") {
                await api.post("/meetings", {
                    title,
                    startTime,
                    endTime,
                    meetingLink,
                    projectId: selectedProjectId || undefined,
                    attendeeIds,
                });
                onSuccess("Meeting scheduled successfully! Attendees will be notified via email.");
            } else if (type === "update-request") {
                await api.post(`/projects/${selectedProjectId}/request-update`);
                onSuccess("Status update request sent to all developers on project!");
            } else if (type === "milestone") {
                await api.post(`/projects/${selectedProjectId}/milestones`, {
                    title: title,
                    description: message,
                    date: new Date().toISOString()
                });
                onSuccess("Project milestone recorded successfully!");
            } else if (type === "pulse") {
                await api.post(`/projects/${selectedProjectId}/pulse`, {
                    status: pulseStatus,
                    message: message
                });
                onSuccess("Status pulse sent to your project manager!");
            }
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.message || "Action failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!type) return null;

    const renderForm = () => {
        switch (type) {
            case "assign-dev":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Select a project...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Developer</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedDevId}
                                onChange={(e) => setSelectedDevId(e.target.value)}
                            >
                                <option value="">Select a developer...</option>
                                {developers.map((d) => (
                                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </>
                );
            case "announcement":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project (Optional)</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Select a project...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1 italic">
                                Note: If no project is selected, the announcement will be visible to all users.
                            </p>
                        </div>
                        <div className="mt-4 text-gray-900">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                rows={3}
                                placeholder="What's the update?"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </>
                );
            case "meeting":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                            <input
                                required
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                placeholder="e.g. Daily Standup"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Invite Participants</label>
                            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/30">
                                {developers.map(user => (
                                    <label key={user.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={attendeeIds.includes(user.id)}
                                            onChange={() => toggleAttendee(user.id)}
                                            className="h-4 w-4 border-gray-300 text-brand-green-600 rounded focus:ring-brand-green-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.firstName} {user.lastName}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{(user as any).role}</span>
                                        </div>
                                    </label>
                                ))}
                                {developers.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No users found</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "milestone":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Select a project...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
                            <input
                                required
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                placeholder="e.g. Beta Version Released"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                rows={2}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                );
            case "update-request":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Select a project for update request...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-sm text-gray-500 italic">
                            All developers assigned to this project will receive a notification to provide a status update.
                        </p>
                    </div>
                );
            case "pulse":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Select project to update...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status Pulse</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'ON_TRACK', label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200' },
                                    { id: 'DELAYED', label: 'Delayed', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                    { id: 'COMPLETED', label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setPulseStatus(s.id as any)}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${pulseStatus === s.id ? `${s.color} ring-2 ring-offset-1 ring-gray-200` : 'bg-white text-gray-500 border-gray-100'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brief Note (Optional)</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                                rows={2}
                                placeholder="e.g. Completed the authentication module."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (type) {
            case "assign-dev": return "Assign Developer";
            case "announcement": return "Create Announcement";
            case "meeting": return "Schedule Meeting";
            case "update-request": return "Request Project Update";
            case "milestone": return "Mark Project Milestone";
            case "pulse": return "Send Status Pulse";
            default: return "";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">{getTitle()}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="h-8 w-8 border-4 border-brand-green-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {renderForm()}
                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-brand-green-600 text-white rounded-xl font-medium hover:bg-brand-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {type === "meeting" ? "Schedule Meeting" : type === "update-request" ? "Send Request" : type === "milestone" ? "Mark Milestone" : type === "pulse" ? "Send Pulse" : "Save Changes"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
