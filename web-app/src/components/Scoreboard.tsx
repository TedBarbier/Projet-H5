'use client'

import { useState, useEffect } from 'react'
import Redis from 'ioredis'
// NOTE: We cannot use ioredis in Client Component directly for listening unless we use a Socket.io bridge or Server Sent Events (SSE).
// Since we set up WebSocket Server in Phase 4 (server.js), we should use Socket.io client here.

import { io } from "socket.io-client";

type ScoreUpdate = {
    matchId: string
    homeScore: number
    awayScore: number
    status: string
    homeTeam: string
    awayTeam: string
    sport?: string
}

export default function Scoreboard() {
    const [liveMatches, setLiveMatches] = useState<ScoreUpdate[]>([])

    useEffect(() => {
        // Connect to WebSocket Server (Phase 4)
        const socketUrl = typeof window !== 'undefined' ? undefined : "http://localhost:3001";
        const socket = io(socketUrl as any, { transports: ["websocket"] });

        socket.on('connect', () => {
            console.log("Connected to Live Scores");
        });

        socket.on('events-updates', (msg: any) => {
            if (msg.type === 'score_update') {
                const data = msg.payload;
                setLiveMatches(prev => {
                    const index = prev.findIndex(m => m.matchId === data.matchId);
                    if (index > -1) {
                        const newMatches = [...prev];
                        // Merge to preserve existing fields like sport if missing (though we fixed API)
                        newMatches[index] = { ...newMatches[index], ...data };
                        return newMatches;
                    }
                    return [...prev, data];
                });
            }
        });

        // Also fetch initial live matches
        fetchLiveMatches();

        return () => {
            socket.disconnect();
        };
    }, [])

    const fetchLiveMatches = async () => {
        // We need an endpoint for live matches or just use the general one
        const res = await fetch('/api/live-matches'); // To be created
        if (res.ok) setLiveMatches(await res.json());
    }

    if (liveMatches.length === 0) return null;

    return (
        <div className="mb-6 overflow-x-auto flex gap-4 pb-2">
            {liveMatches.map(match => (
                <div key={match.matchId} className="min-w-[250px] bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-700 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-2 font-bold uppercase">
                        <span className="text-red-500 animate-pulse">● LIVE</span>
                        <span>{match.sport}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-center">
                            <div className="font-bold text-lg truncate w-20">{match.homeTeam}</div>
                            <div className="text-3xl font-black text-yellow-400">{match.homeScore}</div>
                        </div>
                        <div className="text-gray-600 font-bold px-2">VS</div>
                        <div className="text-center">
                            <div className="font-bold text-lg truncate w-20">{match.awayTeam}</div>
                            <div className="text-3xl font-black text-yellow-400">{match.awayScore}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
