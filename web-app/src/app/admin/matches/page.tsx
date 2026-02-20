'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Match = {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    status: string
    sport: string
    event: {
        title: string
        startTime: string
        location?: { name: string }
    }
}

export default function AdminMatchesPage() {
    const { data: session } = useSession()
    const [matches, setMatches] = useState<Match[]>([])

    // Create Form
    const [homeTeam, setHomeTeam] = useState('')
    const [awayTeam, setAwayTeam] = useState('')
    const [sport, setSport] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [locations, setLocations] = useState<any[]>([])
    const [locationId, setLocationId] = useState('')

    useEffect(() => {
        fetchMatches()
        fetchLocations()
    }, [])

    const fetchMatches = async () => {
        const res = await fetch('/api/admin/matches')
        if (res.ok) setMatches(await res.json())
    }

    const fetchLocations = async () => {
        const res = await fetch('/api/admin/locations')
        if (res.ok) setLocations(await res.json())
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/admin/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `${sport}: ${homeTeam} vs ${awayTeam}`,
                startTime, endTime, locationId,
                homeTeam, awayTeam, sport
            })
        })
        setHomeTeam(''); setAwayTeam('');
        fetchMatches()
    }

    const updateScore = async (matchId: string, h: number, a: number, status: string) => {
        // Optimistic
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore: h, awayScore: a, status } : m))

        await fetch('/api/admin/matches', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: matchId, homeScore: h, awayScore: a, status })
        })
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">⚽️ Gestion des Matchs & Scores</h1>

            {/* Creation */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-bold mb-4">Nouveau Match</h2>
                <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input placeholder="Sport (ex: Foot)" className="border p-2 rounded" value={sport} onChange={e => setSport(e.target.value)} required />
                    <select className="border p-2 rounded" value={locationId} onChange={e => setLocationId(e.target.value)}>
                        <option value="">-- Lieu --</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="datetime-local" className="border p-2 rounded" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    <input type="datetime-local" className="border p-2 rounded" value={endTime} onChange={e => setEndTime(e.target.value)} required />

                    <input placeholder="Équipe Domicile" className="border p-2 rounded" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} required />
                    <input placeholder="Équipe Extérieure" className="border p-2 rounded" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} required />

                    <button className="col-span-2 bg-green-600 text-white font-bold py-2 rounded">Planifier le Match</button>
                </form>
            </div>

            {/* Live Helper */}
            <h2 className="text-xl font-bold mb-4">Tableau de Bord Live</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map(m => (
                    <div key={m.id} className={`p-4 rounded shadow border-l-4 ${m.status === 'LIVE' ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-gray-500 uppercase">{m.sport}</span>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${m.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200'}`}>
                                {m.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center my-4">
                            {/* Home */}
                            <div className="text-center w-1/3">
                                <p className="font-bold truncate">{m.homeTeam}</p>
                                <div className="text-3xl font-black">{m.homeScore}</div>
                                <div className="flex gap-1 justify-center mt-2">
                                    <button onClick={() => updateScore(m.id, m.homeScore + 1, m.awayScore, m.status)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">+</button>
                                    <button onClick={() => updateScore(m.id, Math.max(0, m.homeScore - 1), m.awayScore, m.status)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">-</button>
                                </div>
                            </div>

                            <div className="text-center w-1/3 text-gray-400 font-bold">VS</div>

                            {/* Away */}
                            <div className="text-center w-1/3">
                                <p className="font-bold truncate">{m.awayTeam}</p>
                                <div className="text-3xl font-black">{m.awayScore}</div>
                                <div className="flex gap-1 justify-center mt-2">
                                    <button onClick={() => updateScore(m.id, m.homeScore, m.awayScore + 1, m.status)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">+</button>
                                    <button onClick={() => updateScore(m.id, m.homeScore, Math.max(0, m.awayScore - 1), m.status)} className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">-</button>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-4 flex gap-2">
                            {m.status === 'SCHEDULED' && (
                                <button onClick={() => updateScore(m.id, m.homeScore, m.awayScore, 'LIVE')} className="w-full bg-green-500 text-white py-1 rounded">Démarrer Match</button>
                            )}
                            {m.status === 'LIVE' && (
                                <button onClick={() => updateScore(m.id, m.homeScore, m.awayScore, 'FINISHED')} className="w-full bg-gray-800 text-white py-1 rounded">Terminer Match</button>
                            )}
                            {m.status === 'FINISHED' && (
                                <button onClick={() => updateScore(m.id, m.homeScore, m.awayScore, 'LIVE')} className="w-full bg-yellow-500 text-white py-1 rounded">Rouvrir Match</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
