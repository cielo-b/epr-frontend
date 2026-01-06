"use client";

import { useState } from "react";
import Link from "next/link";

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
}

interface QuickActionsPanelProps {
    onAssignDeveloper: () => void;
    onCreateProject: () => void;
    onSendUpdateRequest: () => void;
    onScheduleMeeting: () => void;
    onAnnouncement?: () => void; // Optional for Secretaries
    userRole?: string;
}

export function QuickActionsPanel({
    onAssignDeveloper,
    onCreateProject,
    onSendUpdateRequest,
    onScheduleMeeting,
    onAnnouncement,
    userRole
}: QuickActionsPanelProps) {

    // Define all possible actions
    const allActions = {
        assignDev: {
            id: "assign-dev",
            title: "Assign Developer",
            description: "Quickly assign a developer to a project",
            color: "border-brand-green-100 hover:bg-brand-green-50 text-brand-green-700",
            action: onAssignDeveloper,
            icon: (
                <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
        },
        createProject: {
            id: "create-project",
            title: "Create Project",
            description: "Start a new project quickly",
            color: "border-brand-green-100 hover:bg-brand-green-50 text-brand-green-700",
            action: onCreateProject,
            icon: (
                <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
        },
        updateRequest: {
            id: "update-request",
            title: "Request Update",
            description: "Ask team for project updates",
            color: "border-brand-green-100 hover:bg-brand-green-50 text-brand-green-700",
            action: onSendUpdateRequest,
            icon: (
                <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
        },
        meeting: {
            id: "meeting",
            title: "Schedule Meeting",
            description: "Set up a team meeting",
            color: "border-brand-green-100 hover:bg-brand-green-50 text-brand-green-700",
            action: onScheduleMeeting,
            icon: (
                <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        announcement: {
            id: "announcement",
            title: "New Announcement",
            description: "Post a company-wide update",
            color: "border-brand-green-100 hover:bg-brand-green-50 text-brand-green-700",
            action: onAnnouncement || (() => { }),
            icon: (
                <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
            ),
        }
    };

    let visibleActions: QuickAction[] = [];

    if (userRole === "SECRETARY") {
        visibleActions = [
            allActions.meeting,
            allActions.announcement
        ];
    } else if (["PROJECT_MANAGER", "SUPERADMIN", "BOSS"].includes(userRole || "")) {
        // PM / SuperAdmin / Boss
        visibleActions = [
            allActions.assignDev,
            allActions.createProject,
            allActions.updateRequest,
            allActions.meeting,
            allActions.announcement
        ];
    } else {
        // Developers and others
        visibleActions = [];
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Common tasks at your fingertips</p>
                </div>
                <svg className="w-8 h-8 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {visibleActions.map((action) => (
                    <button
                        key={action.id}
                        onClick={action.action}
                        className={`bg-white border ${action.color} rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md group`}
                    >
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-3 bg-brand-green-50 rounded-xl group-hover:bg-brand-green-100 transition-all">
                                {action.icon}
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-tight">{action.title}</div>
                                <div className="text-xs text-gray-500 mt-1 hidden sm:block leading-relaxed">{action.description}</div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
