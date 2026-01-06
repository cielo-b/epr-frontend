"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Announcement {
    id: string;
    projectId: string;
    projectName: string;
    message: string;
    author: string;
    createdAt: string;
    priority: "low" | "medium" | "high";
}

interface Activity {
    id: string;
    action: string;
    description: string;
    timestamp: string;
    actor: {
        firstName: string;
        lastName: string;
    };
    project?: {
        name: string;
    };
}

interface CommunicationHubProps {
    announcements?: Announcement[];
    activities?: Activity[];
    onCreateAnnouncement?: () => void;
    onViewComments: (projectId: string) => void;
}

export function CommunicationHub({
    announcements = [],
    activities = [],
    onCreateAnnouncement,
    onViewComments,
}: CommunicationHubProps) {
    const [activeTab, setActiveTab] = useState<"announcements" | "activity">("announcements");
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const fetchComments = async (announcementId: string) => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/comments/announcement/${announcementId}`);
            setComments(res.data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (announcementId: string) => {
        if (!comment.trim()) return;
        try {
            await api.post("/comments", {
                content: comment,
                announcementId,
            });
            setComment("");
            fetchComments(announcementId);
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    const toggleComments = (id: string) => {
        if (selectedAnnouncement === id) {
            setSelectedAnnouncement(null);
        } else {
            setSelectedAnnouncement(id);
            fetchComments(id);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-brand-green-700 text-white border-brand-green-800";
            case "medium":
                return "bg-brand-green-500 text-white border-brand-green-600";
            default:
                return "bg-brand-green-50 text-brand-green-700 border-brand-green-200";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "high":
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case "medium":
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Communication Hub</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Team updates and announcements</p>
                    </div>
                    {onCreateAnnouncement && (
                        <button
                            onClick={onCreateAnnouncement}
                            className="px-4 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Announcement
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex px-6 -mb-px">
                    <button
                        onClick={() => setActiveTab("announcements")}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "announcements"
                            ? "border-brand-green-600 text-brand-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            Announcements
                            {announcements.length > 0 && (
                                <span className="px-2 py-0.5 bg-brand-green-100 text-brand-green-700 rounded-full text-xs font-semibold">
                                    {announcements.length}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("activity")}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "activity"
                            ? "border-brand-green-600 text-brand-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Recent Activity
                        </div>
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === "announcements" ? (
                    <div className="space-y-4">
                        {announcements.length > 0 ? (
                            announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold border flex items-center gap-1 ${getPriorityColor(announcement.priority)}`}>
                                                {getPriorityIcon(announcement.priority)}
                                                {announcement.priority.toUpperCase()}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">{announcement.projectName}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(announcement.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3">{announcement.message}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {announcement.author}
                                        </div>
                                        <button
                                            onClick={() => toggleComments(announcement.id)}
                                            className="text-xs text-brand-green-600 hover:text-brand-green-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            {selectedAnnouncement === announcement.id ? "Hide Comments" : "Comments"}
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {selectedAnnouncement === announcement.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                                {loadingComments ? (
                                                    <div className="flex justify-center py-2">
                                                        <div className="h-4 w-4 border-2 border-brand-green-600 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                ) : comments.length > 0 ? (
                                                    comments.map((c: any) => (
                                                        <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-gray-900">{c.author?.firstName} {c.author?.lastName}</span>
                                                                <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600">{c.content}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-2 italic">No comments yet</p>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(announcement.id)}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green-600"
                                                />
                                                <button
                                                    onClick={() => handleAddComment(announcement.id)}
                                                    disabled={!comment.trim()}
                                                    className="p-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition disabled:opacity-50"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                                <p className="text-gray-500 text-sm font-medium">No announcements yet</p>
                                <p className="text-gray-400 text-xs mt-1">Create your first announcement to keep your team informed</p>
                                {onCreateAnnouncement && (
                                    <button
                                        onClick={onCreateAnnouncement}
                                        className="mt-4 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Create Announcement
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.length > 0 ? (
                            <>
                                {activities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {activity.actor.firstName} {activity.actor.lastName}
                                                </p>
                                                <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                            {activity.project && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green-400"></span>
                                                    <span className="text-xs font-medium text-brand-green-700">{activity.project.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {activities.length > 5 && (
                                    <Link
                                        href="/projects"
                                        className="block w-full text-center py-2.5 text-sm font-semibold text-brand-green-700 border border-brand-green-200 rounded-lg hover:bg-brand-green-50 transition-colors mt-2"
                                    >
                                        Show More Activity →
                                    </Link>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <p className="text-gray-500 text-sm font-medium">No recent activity</p>
                                <p className="text-gray-400 text-xs mt-1">Activities will appear here as the team works</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
