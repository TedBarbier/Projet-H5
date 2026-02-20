'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export const VAPID_PUBLIC_KEY = "BAhNnVh8vY-plKPwFVbTQ90e4HSlUnFl6HmefQEwI91ZH3CjsAkx2GWPS47kgul1GBlWUcj57T-hUUthomBIjV0";

export default function PushManager() {
    const { data: session } = useSession()

    useEffect(() => {
        if (!session) return;

        async function registerPush() {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered with scope:', registration.scope);

                    // Request permission and subscribe
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });

                        // Send to server
                        await fetch('/api/push/subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subscription)
                        });
                    }
                } catch (error) {
                    console.error('Service Worker Registration or Push Subscription failed:', error);
                }
            }
        }

        registerPush();
    }, [session]);

    return null;
}

// Utility function
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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
