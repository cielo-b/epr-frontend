"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { authService } from "./auth";
import api, { API_URL } from "./api";
import { usePathname } from "next/navigation";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationsContextValue {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const pathname = usePathname();
    const currentUserIdRef = useRef<string | null>(null);

    const getSocketUrl = (apiUrl: string) => {
        try {
            const url = new URL(apiUrl);
            return url.origin;
        } catch {
            return "http://localhost:5005";
        }
    };

    const loadNotifications = async () => {
        try {
            console.log("📥 Loading historical notifications...");
            const response = await api.get("/notifications");
            console.log(`✅ Loaded ${response.data.length} notifications from server`);
            setNotifications(response.data);
        } catch (error) {
            console.error("❌ Failed to load notifications", error);
        }
    };

    useEffect(() => {
        const user = authService.getUser();
        const userId = user?.id || null;

        // If user changed (login, logout, or user switch)
        if (userId !== currentUserIdRef.current) {
            // Cleanup old socket if exists
            if (socket) {
                console.log("User changed, disconnecting old socket");
                socket.disconnect();
                setSocket(null);
                setNotifications([]);
            }

            // Update ref
            currentUserIdRef.current = userId;

            // Connect new socket if user exists
            if (userId && user) {
                console.log("Connecting notification socket for user:", user.email);
                loadNotifications();

                const socketUrl = getSocketUrl(API_URL);
                const newSocket = io(socketUrl + "/notifications", {
                    query: { userId },
                    transports: ["websocket"],
                    reconnectionAttempts: 5,
                });

                newSocket.on("connect", () => {
                    console.log("✅ Notification socket connected");
                });

                newSocket.on("connect_error", (err) => {
                    console.error("❌ Socket connection error:", err);
                });

                newSocket.on("notification", (notification: Notification) => {
                    console.log("🔔 New notification received:", notification);
                    setNotifications((prev) => [notification, ...prev]);
                });

                setSocket(newSocket);
            }
        }
    }, [pathname]); // Re-check on path change (e.g., after login redirect)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                console.log("Unmounting NotificationsProvider, disconnecting socket");
                socket.disconnect();
            }
        };
    }, [socket]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationsContext.Provider>
    );
};
