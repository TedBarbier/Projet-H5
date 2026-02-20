'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export const VAPID_PUBLIC_KEY = "BAhNnVh8vY-plKPwFVbTQ90e4HSlUnFl6HmefQEwI91ZH3CjsAkx2GWPS47kgul1GBlWUcj57T-hUUthomBIjV0";

export default function PushManager() {
    const { data: session } = useSession()
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (!session) return;

        // Only show banner if permission is not yet granted or denied, and push is supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            if (Notification.permission === 'default') {
                setShowBanner(true);
            }
        }
    }, [session]);

    const handleSubscribe = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');

                // User gesture required here for iOS Safari
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setShowBanner(false);
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });

                    await fetch('/api/push/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subscription)
                    });
                } else {
                    setShowBanner(false);
                }
            } catch (error) {
                console.error('Push Subscription failed:', error);
                setShowBanner(false);
            }
        }
    };

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-[100] flex justify-between items-center shadow-lg text-sm md:text-base px-4">
            <span>Voulez-vous recevoir les annonces importantes ?</span>
            <div className="flex gap-2">
                <button onClick={() => setShowBanner(false)} className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800">Non</button>
                <button onClick={handleSubscribe} className="px-3 py-1 bg-white text-blue-600 font-bold rounded hover:bg-gray-100">Activer</button>
            </div>
        </div>
    );
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
