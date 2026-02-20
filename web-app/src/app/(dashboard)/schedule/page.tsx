'use client'

import { useState, useEffect } from 'react'
import Scoreboard from '@/components/Scoreboard'
import { io } from "socket.io-client";

type Event = {
    id: string
    title: string
    startTime: string
    endTime: string
    location?: { name: string, address?: string | null }
    type: string
    match?: {
        id: string
        homeTeam: string
        awayTeam: string
        homeScore: number
        awayScore: number
        status: string
        sport: string
    }
}

export default function SchedulePage() {
    const [events, setEvents] = useState<Event[]>([])
    // Changed: Store ID instead of full object to ensure we always show latest state
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Derived state for the selected event - ensures modal updates when `events` updates!
    const selectedEvent = events.find(e => e.id === selectedEventId) || null

    useEffect(() => {
        fetchEvents()

        const socketUrl = typeof window !== 'undefined' ? undefined : "http://localhost:3001";
        const socket = io(socketUrl as any, { transports: ["websocket"] });
        socket.on('events-updates', (msg: any) => {
            console.log("Schedule WS Event:", msg);
            if (msg.type === 'score_update') {
                const update = msg.payload;
                setEvents(prev => prev.map(ev => {
                    if (ev.match && ev.match.id === update.matchId) {
                        return {
                            ...ev,
                            match: {
                                ...ev.match,
                                homeScore: update.homeScore,
                                awayScore: update.awayScore,
                                status: update.status
                            }
                        }
                    }
                    return ev;
                }))
            }
        })
        return () => { socket.disconnect() }
    }, [])

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/schedule')
            if (res.ok) setEvents(await res.json())
        } finally {
            setLoading(false)
        }
    }

    const openMap = (loc?: { name: string, address?: string | null }) => {
        if (!loc) return
        const query = loc.address
            ? encodeURIComponent(loc.address)
            : encodeURIComponent(`INSA Centre Val de Loire - ${loc.name}`)
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
    }

    return (
        <div className="p-4 pb-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">📅 Planning & Résultats</h1>

            {/* Live Scores */}
            <Scoreboard />

            {/* Timeline */}
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                {loading && <p className="text-gray-500 ml-6">Chargement du planning...</p>}
                {!loading && events.length === 0 && <p className="text-gray-500 ml-6">Aucun événement.</p>}

                {events.map((ev) => (
                    <div key={ev.id} className="ml-6 relative">
                        {/* Timeline Dot */}
                        <span className={`absolute -left-9 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white
                    ${ev.type === 'match' ? 'bg-red-100' : 'bg-blue-100'}
                `}>
                            <span className={`w-2 h-2 rounded-full ${ev.type === 'match' ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                        </span>

                        {/* Card */}
                        <div
                            onClick={() => setSelectedEventId(ev.id)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer active:scale-95"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-gray-500">
                                    {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {ev.match?.status === 'LIVE' && (
                                    <span className="text-xs font-bold px-2 py-0.5 bg-red-600 text-white rounded animate-pulse">LIVE</span>
                                )}
                                {ev.type === 'match' && ev.match?.status !== 'LIVE' && (
                                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">{ev.match?.sport || 'MATCH'}</span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">{ev.title}</h3>

                            <p className="text-sm text-gray-500 flex items-center mt-2 gap-1">
                                📍 {ev.location?.name || 'Non défini'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in" onClick={() => setSelectedEventId(null)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 pb-24 sm:pb-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-10"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold leading-tight pr-4">{selectedEvent.title}</h3>
                            <button onClick={() => setSelectedEventId(null)} className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">×</button>
                        </div>

                        <div className="space-y-6">
                            {/* Time */}
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="text-xl">🕒</span>
                                <div>
                                    <div className="font-bold">Horaire</div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="text-xl">📍</span>
                                <div className="flex-1">
                                    <div className="font-bold">Lieu</div>
                                    <div className="text-sm text-gray-800">{selectedEvent.location?.name || 'Non défini'}</div>
                                    {selectedEvent.location?.address && (
                                        <div className="text-xs text-gray-500 mt-0.5">{selectedEvent.location.address}</div>
                                    )}
                                </div>
                                {selectedEvent.location && (
                                    <button
                                        onClick={() => openMap(selectedEvent.location!)}
                                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full font-bold hover:bg-blue-700 shadow-lg"
                                    >
                                        📲 J'y vais
                                    </button>
                                )}
                            </div>

                            {/* Match Score Detail */}
                            {selectedEvent.match && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-500 uppercase text-xs mb-3 text-center tracking-wider">
                                        {selectedEvent.match.status === 'LIVE' ? '🔴 Score en Direct' : 'Résultat'}
                                    </h4>
                                    <div className="flex justify-between items-center">
                                        <div className="text-center w-5/12">
                                            <div className="font-bold truncate text-sm mb-1">{selectedEvent.match.homeTeam}</div>
                                            <div className="text-4xl font-black text-gray-800">{selectedEvent.match.homeScore}</div>
                                        </div>
                                        <div className="text-gray-400 font-black text-xl">VS</div>
                                        <div className="text-center w-5/12">
                                            <div className="font-bold truncate text-sm mb-1">{selectedEvent.match.awayTeam}</div>
                                            <div className="text-4xl font-black text-gray-800">{selectedEvent.match.awayScore}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
