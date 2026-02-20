
'use client'

import { useState, useEffect } from 'react'

export default function SportsAdminPage() {
    const [sports, setSports] = useState<{ id: string, name: string }[]>([])
    const [newSport, setNewSport] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSports()
    }, [])

    const fetchSports = async () => {
        try {
            const res = await fetch('/api/sports')
            if (res.ok) {
                const data = await res.json()
                setSports(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const addSport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSport.trim()) return

        try {
            const res = await fetch('/api/sports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSport })
            })
            if (res.ok) {
                setNewSport('')
                fetchSports()
            } else {
                alert("Erreur lors de l'ajout")
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Gestion des Sports</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">Ajouter un sport</h2>
                <form onSubmit={addSport} className="flex gap-4">
                    <input
                        type="text"
                        value={newSport}
                        onChange={(e) => setNewSport(e.target.value)}
                        placeholder="Nom du sport (ex: Escalade)"
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition"
                    >
                        Ajouter
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Liste des sports ({sports.length})</h2>
                {loading ? (
                    <p>Chargement...</p>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sports.map(sport => (
                            <li key={sport.id} className="p-3 border rounded flex justify-between items-center bg-gray-50">
                                <span className="font-medium">{sport.name}</span>
                                {/* Delete button could be added here if API supports DELETE */}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
