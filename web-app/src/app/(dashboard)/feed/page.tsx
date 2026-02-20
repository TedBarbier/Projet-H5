'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

type NewsItem = {
    id: number
    title: string
    content: string
    time: string
}

export default function FeedPage() {
    const socket = useSocket()
    const [news, setNews] = useState<NewsItem[]>([])

    useEffect(() => {
        // Fetch historical announcements
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setNews(data);
                }
            })
            .catch(err => console.error("Failed to fetch initial news", err));
    }, []);

    useEffect(() => {
        if (!socket) return

        socket.on('events-updates', (payload: any) => {
            console.log("New event received:", payload)
            // Handle both structure types (/admin/announce vs /admin/announcements)
            const newItem: NewsItem = {
                id: payload.payload?.id || payload.id || Date.now(),
                title: payload.payload?.title || payload.title,
                content: payload.payload?.content || payload.content,
                time: payload.payload?.timestamp ? new Date(payload.payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            };
            setNews((prev) => [newItem, ...prev])
        })

        return () => {
            socket.off('events-updates')
        }
    }, [socket])

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                setUser(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const isPaid = user?.payments?.some((p: any) => p.status === 'PAID')

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-red-700 flex justify-between items-center">
                Fil d'actualité
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                    Live ●
                </span>
            </h1>

            {/* Registration Card - Only if not paid */}
            {!loading && !isPaid && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-2">Inscription à l'événement</h2>
                    <p className="mb-4 opacity-90">
                        Finalisez votre inscription pour participer aux épreuves et accéder à tous les services.
                    </p>
                    <a
                        href="/payment"
                        className="inline-block bg-white text-indigo-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Compléter mon inscription (10€) →
                    </a>
                </div>
            )}

            <div className="space-y-4">
                {news.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-red-600 transition-all duration-500 ease-in-out">
                        <div className="flex justify-between items-start">
                            <h2 className="font-bold text-lg">{item.title}</h2>
                            <span className="text-xs text-gray-500">{item.time}</span>
                        </div>
                        <p className="text-gray-700 mt-2">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
