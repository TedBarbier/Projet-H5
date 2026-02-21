'use client'

import { useState, useEffect } from 'react'

type Pole = {
    id: string, name: string, description: string, color: string,
    canManageAnnouncements: boolean,
    canManageUsers: boolean,
    canManageSchedule: boolean,
    canManageMatches: boolean,
    canManageScanner: boolean,
    _count: { members: number, memberships?: number }
}

export default function AdminPolesPage() {
    const [poles, setPoles] = useState<Pole[]>([])

    // Create Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#EF4444')
    const [perms, setPerms] = useState({ ancn: false, users: false, sched: false, match: false, scan: false })

    // Edit Modal State
    const [editingPole, setEditingPole] = useState<Pole | null>(null)
    const [editForm, setEditForm] = useState({ name: '', description: '', color: '', ancn: false, users: false, sched: false, match: false, scan: false })

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
            body: JSON.stringify({
                name, description, color,
                canManageAnnouncements: perms.ancn,
                canManageUsers: perms.users,
                canManageSchedule: perms.sched,
                canManageMatches: perms.match,
                canManageScanner: perms.scan
            })
        })
        setName(''); setDescription(''); setPerms({ ancn: false, users: false, sched: false, match: false, scan: false });
        fetchPoles()
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingPole) return;

        await fetch('/api/admin/poles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: editingPole.id,
                name: editForm.name,
                description: editForm.description,
                color: editForm.color,
                canManageAnnouncements: editForm.ancn,
                canManageUsers: editForm.users,
                canManageSchedule: editForm.sched,
                canManageMatches: editForm.match,
                canManageScanner: editForm.scan
            })
        })
        setEditingPole(null);
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

                        <div className="border-t pt-4">
                            <h3 className="font-bold text-sm mb-2 text-gray-700">Permissions Déléguées</h3>
                            <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={perms.ancn} onChange={e => setPerms({ ...perms, ancn: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4" />
                                    <span>📢 Faire des Annonces globales</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={perms.users} onChange={e => setPerms({ ...perms, users: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4" />
                                    <span>👥 Modifier les Joueurs (Sports)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={perms.sched} onChange={e => setPerms({ ...perms, sched: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4" />
                                    <span>🗓️ Gérer le Planning / Lieux</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={perms.match} onChange={e => setPerms({ ...perms, match: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4" />
                                    <span>⚽ Créer des Matchs & Scores</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={perms.scan} onChange={e => setPerms({ ...perms, scan: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4" />
                                    <span>🎫 Scanner & Gérer les Repas</span>
                                </label>
                            </div>
                        </div>

                        <button className="bg-purple-600 text-white font-bold py-2 w-full rounded hover:bg-purple-700 mt-4">Créer</button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {poles.map(pole => (
                        <div key={pole.id} className="bg-white p-4 rounded shadow border-l-4 flex justify-between items-center" style={{ borderLeftColor: pole.color }}>
                            <div>
                                <h3 className="font-bold text-lg">{pole.name}</h3>
                                <p className="text-gray-500 text-sm mb-1">{pole.description}</p>

                                {/* Permissions Badges */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {pole.canManageAnnouncements && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-medium">📢 Annonces</span>}
                                    {pole.canManageUsers && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">👥 Joueurs</span>}
                                    {pole.canManageSchedule && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded font-medium">🗓️ Planning</span>}
                                    {pole.canManageMatches && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-medium">⚽ Matchs</span>}
                                    {pole.canManageScanner && <span className="bg-pink-100 text-pink-800 text-xs px-2 py-0.5 rounded font-medium">🎫 Scan</span>}
                                </div>

                                <div className="px-1 py-1">
                                    <span className="font-bold text-gray-900">
                                        {(pole._count?.members || 0) + (pole._count?.memberships || 0)}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-1">
                                        ({pole._count?.members || 0} mbrs + {pole._count?.memberships || 0} staff)
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setEditingPole(pole);
                                        setEditForm({
                                            name: pole.name, description: pole.description || '', color: pole.color,
                                            ancn: pole.canManageAnnouncements, users: pole.canManageUsers,
                                            sched: pole.canManageSchedule, match: pole.canManageMatches,
                                            scan: pole.canManageScanner
                                        });
                                    }}
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold px-3 py-1 rounded text-sm"
                                >
                                    Modifier
                                </button>
                                <button onClick={() => handleDelete(pole.id)} className="bg-red-50 text-red-500 hover:bg-red-100 font-bold px-3 py-1 rounded text-sm">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* EDIT MODAL */}
            {editingPole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Modifier le Pôle : {editingPole.name}</h2>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold">Nom</label>
                                <input className="border p-2 w-full rounded" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Description</label>
                                <input className="border p-2 w-full rounded" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Couleur</label>
                                <div className="flex gap-2">
                                    <input type="color" className="h-10 w-10 border rounded" value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-bold text-sm mb-2 text-gray-700">Permissions Déléguées</h3>
                                <div className="space-y-2 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editForm.ancn} onChange={e => setEditForm({ ...editForm, ancn: e.target.checked })} className="rounded text-purple-600 h-4 w-4" />
                                        <span>📢 Faire des Annonces globales</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editForm.users} onChange={e => setEditForm({ ...editForm, users: e.target.checked })} className="rounded text-purple-600 h-4 w-4" />
                                        <span>👥 Modifier les Joueurs (Sports)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editForm.sched} onChange={e => setEditForm({ ...editForm, sched: e.target.checked })} className="rounded text-purple-600 h-4 w-4" />
                                        <span>🗓️ Gérer le Planning / Lieux</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editForm.match} onChange={e => setEditForm({ ...editForm, match: e.target.checked })} className="rounded text-purple-600 h-4 w-4" />
                                        <span>⚽ Créer des Matchs & Scores</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editForm.scan} onChange={e => setEditForm({ ...editForm, scan: e.target.checked })} className="rounded text-purple-600 h-4 w-4" />
                                        <span>🎫 Scanner & Gérer les Repas</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setEditingPole(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
