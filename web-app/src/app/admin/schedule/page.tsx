'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Location = { id: string, name: string, address?: string }
type Event = {
    id: string,
    title: string,
    startTime: string,
    endTime: string,
    location?: Location
}

export default function AdminSchedulePage() {
    console.log("Rendering AdminSchedulePage");
    const { data: session } = useSession()

    const [locations, setLocations] = useState<Location[]>([])
    const [events, setEvents] = useState<Event[]>([])

    // Forms
    const [newLocName, setNewLocName] = useState('')
    const [newLocAddress, setNewLocAddress] = useState('')
    const [eventTitle, setEventTitle] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [selectedLocId, setSelectedLocId] = useState('')

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchLocations()
        fetchEvents()
    }, [])

    const fetchLocations = async () => {
        const res = await fetch('/api/admin/locations')
        if (res.ok) setLocations(await res.json())
    }

    const fetchEvents = async () => {
        const res = await fetch('/api/admin/events')
        if (res.ok) setEvents(await res.json())
    }

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newLocName, address: newLocAddress })
            })
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur inconnue');
            }
            setNewLocName('')
            setNewLocAddress('')
            fetchLocations()
        } catch (e: any) {
            alert(`Erreur: ${e.message}`)
        } finally { setLoading(false) }
    }

    const handleDeleteLocation = async (id: string) => {
        if (!confirm("Supprimer ce lieu ?")) return
        await fetch(`/api/admin/locations?id=${id}`, { method: 'DELETE' })
        fetchLocations()
    }

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: eventTitle,
                    startTime,
                    endTime,
                    locationId: selectedLocId || null
                })
            })
            if (!res.ok) throw new Error('Erreur création événement')

            // Reset
            setEventTitle('')
            setStartTime('')
            setEndTime('')
            fetchEvents()
        } catch (e) {
            alert("Erreur lors de la création de l'événement.")
        } finally { setLoading(false) }
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Supprimer cet événement ?")) return
        await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' })
        fetchEvents()
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COL: LOCATIONS */}
            <div className="lg:col-span-1 border-r pr-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-bold mb-4">📍 Lieux</h2>

                    <form onSubmit={handleAddLocation} className="flex flex-col gap-3 mb-6">
                        <input
                            type="text"
                            placeholder="Nom du lieu (ex: Ruche)"
                            value={newLocName}
                            onChange={(e) => setNewLocName(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Adresse (pour GPS)"
                            value={newLocAddress}
                            onChange={(e) => setNewLocAddress(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full font-bold" disabled={loading}>
                            Ajouter
                        </button>
                    </form>

                    <div className="space-y-2">
                        {locations.map((loc: Location) => (
                            <div key={loc.id} className="flex justify-between items-center border-b py-2">
                                <div className="flex-1">
                                    <strong>{loc.name}</strong>
                                    {loc.address && <div className="text-gray-500 text-xs mt-0.5">{loc.address}</div>}
                                </div>
                                <button
                                    onClick={() => handleDeleteLocation(loc.id)}
                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded ml-2"
                                    disabled={loading}
                                    title="Supprimer"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        {locations.length === 0 && <p className="text-gray-500 italic">Aucun lieu.</p>}
                    </div>
                </div>
            </div>

            {/* RIGHT COL: SCHEDULE */}
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-4">📅 Planning</h2>

                {/* Add Event Form */}
                <form onSubmit={handleAddEvent} className="bg-white p-4 rounded shadow-md mb-8 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold mb-1">Titre</label>
                        <input className="border p-2 w-full rounded" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Début</label>
                        <input type="datetime-local" className="border p-2 w-full rounded" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Fin</label>
                        <input type="datetime-local" className="border p-2 w-full rounded" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold mb-1">Lieu</label>
                        <select className="border p-2 w-full rounded" value={selectedLocId} onChange={e => setSelectedLocId(e.target.value)}>
                            <option value="">-- Aucun lieu défini --</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <button disabled={loading} className="col-span-2 bg-blue-600 text-white font-bold py-2 rounded">
                        Ajouter au Planning
                    </button>
                </form>

                {/* Events List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-3 text-left">Heure</th>
                                <th className="p-3 text-left">Événement</th>
                                <th className="p-3 text-left">Lieu</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm">
                                        {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <br />
                                        <span className="text-gray-400 text-xs">
                                            {new Date(ev.startTime).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium">{ev.title}</td>
                                    <td className="p-3 text-sm text-gray-600">{ev.location?.name || '-'}</td>
                                    <td className="p-3 text-right">
                                        {session?.user?.role === 'ADMIN' && (
                                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-red-600 hover:underline">Suppr.</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}
