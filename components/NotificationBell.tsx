"use client";

import { useNotifications } from "@/lib/notifications-context";
import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            await markAsRead(notif.id);
        }

        // Parse notification to determine navigation
        // For task notifications, try to extract task/project info from message
        if (notif.title.includes("Task")) {
            // Try to navigate to projects page - user can find their task there
            router.push("/projects");
        }

        setIsOpen(false);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "SUCCESS":
                return "✅";
            case "WARNING":
                return "⚠️";
            case "ERROR":
                return "❌";
            default:
                return "ℹ️";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                aria-label="View notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[32rem] flex flex-col">
                    <div className="py-3 px-4 flex justify-between items-center border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">You'll see updates here</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${notification.isRead ? "opacity-60" : "bg-blue-50"
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex space-x-3">
                                            <div className="flex-shrink-0 text-xl">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 whitespace-nowrap">
                                                        {new Date(notification.createdAt).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(notification.createdAt).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <span className="flex-shrink-0 inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
