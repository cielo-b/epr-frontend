"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushNotificationSubscribed, getNotificationPermission } from '@/lib/pushNotifications';
import { useToast } from './ToastProvider';
import api from '@/lib/api';

export function NotificationPermissionBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const { addToast } = useToast();

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const subscribed = await isPushNotificationSubscribed();
        const perm = getNotificationPermission();

        setIsSubscribed(subscribed);
        setPermission(perm);

        // Show banner if notifications are supported but not enabled
        if (perm === 'default' && !subscribed) {
            // Check if user has dismissed the banner before
            const dismissed = localStorage.getItem('notificationBannerDismissed');
            if (!dismissed) {
                setShowBanner(true);
            }
        }
    };

    const handleEnableNotifications = async () => {
        const success = await subscribeToPushNotifications();
        if (success) {
            addToast('Push notifications enabled successfully!', 'success');
            setIsSubscribed(true);
            setShowBanner(false);
            setPermission('granted');
        } else {
            addToast('Failed to enable push notifications', 'error');
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('notificationBannerDismissed', 'true');
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">Enable Notifications</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Stay updated with real-time notifications about your projects, tasks, and messages.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnableNotifications}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Enable
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Not Now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

export function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const subscribed = await isPushNotificationSubscribed();
        const perm = getNotificationPermission();

        setIsSubscribed(subscribed);
        setPermission(perm);
    };

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            if (isSubscribed) {
                const success = await unsubscribeFromPushNotifications();
                if (success) {
                    addToast('Push notifications disabled', 'info');
                    setIsSubscribed(false);
                } else {
                    addToast('Failed to disable notifications', 'error');
                }
            } else {
                const success = await subscribeToPushNotifications();
                if (success) {
                    addToast('Push notifications enabled!', 'success');
                    setIsSubscribed(true);
                    setPermission('granted');
                } else {
                    addToast('Failed to enable notifications', 'error');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show if notifications are not supported
    if (!('Notification' in window)) {
        return null;
    }

    const handleTestPush = async () => {
        try {
            await api.post('/notifications/push/test');
            addToast('Test request sent', 'info');
        } catch (err) {
            addToast('Failed to send test push', 'error');
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleToggle}
                disabled={isLoading || permission === 'denied'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSubscribed
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={permission === 'denied' ? 'Notifications are blocked. Please enable them in your browser settings.' : ''}
            >
                {isSubscribed ? (
                    <>
                        <Bell className="h-4 w-4" />
                        <span>Notifications On</span>
                    </>
                ) : (
                    <>
                        <BellOff className="h-4 w-4" />
                        <span>Notifications Off</span>
                    </>
                )}
            </button>
            {/* {isSubscribed && (
                <button
                    onClick={handleTestPush}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Test Push
                </button>
            )} */}
        </div>
    );
}
