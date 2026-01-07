import api from './api';

// VAPID public key - this should match the one in your backend .env
// You'll need to generate VAPID keys and add them to your backend .env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported in this browser');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
        console.log('Service Worker registered successfully:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('Notifications are not supported in this browser');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
}

export async function subscribeToPushNotifications(): Promise<boolean> {
    try {
        // Check if notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return false;
        }

        // Request notification permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return false;
        }

        // Register service worker
        const registration = await registerServiceWorker();
        if (!registration) {
            console.error('Service worker registration failed');
            return false;
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe to push notifications
            if (!VAPID_PUBLIC_KEY) {
                console.error('VAPID public key is not configured');
                return false;
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            });
        }

        // Send subscription to backend
        const subscriptionJSON = subscription.toJSON();
        await api.post('/notifications/push/subscribe', {
            endpoint: subscriptionJSON.endpoint,
            keys: subscriptionJSON.keys,
        });

        console.log('Successfully subscribed to push notifications');
        return true;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return false;
    }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const subscriptionJSON = subscription.toJSON();

            // Unsubscribe from browser
            await subscription.unsubscribe();

            // Remove from backend
            await api.delete('/notifications/push/unsubscribe', {
                data: { endpoint: subscriptionJSON.endpoint },
            });

            console.log('Successfully unsubscribed from push notifications');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
    }
}

export async function isPushNotificationSubscribed(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        console.error('Error checking push notification subscription:', error);
        return false;
    }
}

export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}
