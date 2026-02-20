'use client'

import { useState, useEffect } from 'react'

type Pole = { id: string, name: string, description: string, color: string, _count: { members: number } }

export default function AdminPolesPage() {
    const [poles, setPoles] = useState<Pole[]>([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#EF4444')

    useEffect(() => { fetchPoles() }, [])

    const fetchPoles = async () => {
        const res = await fetch('/api/admin/poles')
        if (res.ok) setPoles(await res.json())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/admin/poles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, color })
        })
        setName(''); setDescription('');
        fetchPoles()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce pôle ?")) return
        await fetch(`/api/admin/poles?id=${id}`, { method: 'DELETE' })
        fetchPoles()
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">🎯 Gestion des Pôles</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Form */}
                <div className="bg-white p-6 rounded-lg shadow h-fit">
                    <h2 className="text-xl font-semibold mb-4">Nouveau Pôle</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold">Nom (ex: Sport, Anim)</label>
                            <input className="border p-2 w-full rounded" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold">Description</label>
                            <input className="border p-2 w-full rounded" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold">Couleur (Code Hex)</label>
                            <div className="flex gap-2">
                                <input type="color" className="h-10 w-10 border rounded" value={color} onChange={e => setColor(e.target.value)} />
                                <input className="border p-2 w-full rounded" value={color} onChange={e => setColor(e.target.value)} />
                            </div>
                        </div>
                        <button className="bg-purple-600 text-white font-bold py-2 w-full rounded hover:bg-purple-700">Créer</button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {poles.map(pole => (
                        <div key={pole.id} className="bg-white p-4 rounded shadow border-l-4 flex justify-between items-center" style={{ borderLeftColor: pole.color }}>
                            <div>
                                <h3 className="font-bold text-lg">{pole.name}</h3>
                                <p className="text-gray-500 text-sm">{pole.description}</p>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-gray-900">
                                        {(pole._count?.members || 0) + (pole._count?.memberships || 0)}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-1">
                                        ({pole._count?.members || 0} mbrs + {pole._count?.memberships || 0} staff)
                                    </span>
                                </td></div>
                            <button onClick={() => handleDelete(pole.id)} className="text-red-500 hover:text-red-700 font-bold px-3 py-1">Supprimer</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
