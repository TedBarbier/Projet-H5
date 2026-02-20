'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    name: string | null
    email: string | null
    school: string | null
}

export default function CreateChatModal({ onClose }: { onClose: () => void }) {
    const router = useRouter()
    const [step, setStep] = useState<'search' | 'details'>('search')
    const [tab, setTab] = useState<'users' | 'poles'>('users')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])

    // Poles Logic
    const [poles, setPoles] = useState<{ id: string, name: string }[]>([])
    const [selectedPoles, setSelectedPoles] = useState<{ id: string, name: string }[]>([])

    const [chatName, setChatName] = useState('')
    const [loading, setLoading] = useState(false)

    // Load available poles once
    const loadPoles = async () => {
        if (poles.length > 0) return;
        try {
            const res = await fetch('/api/poles');
            if (res.ok) setPoles(await res.json());
        } catch (e) {
            console.error(e);
        }
    }

    const handleSearch = async (q: string) => {
        setSearchQuery(q)
        if (q.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
            if (res.ok) {
                setSearchResults(await res.json())
            }
        } catch (e) {
            console.error(e)
        }
    }

    const toggleUser = (user: User) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers([...selectedUsers, user])
        }
    }

    const togglePole = (pole: { id: string, name: string }) => {
        if (selectedPoles.some(p => p.id === pole.id)) {
            setSelectedPoles(selectedPoles.filter(p => p.id !== pole.id))
        } else {
            setSelectedPoles([...selectedPoles, pole])
        }
    }

    const handleCreate = async () => {
        if (selectedUsers.length === 0 && selectedPoles.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: chatName || (selectedPoles.length > 0 ? `Discussion Pôles (${selectedPoles.map(p => p.name).join(', ')})` : undefined),
                    type: 'GROUP',
                    participantIds: selectedUsers.map(u => u.id),
                    targetPoleIds: selectedPoles.map(p => p.id)
                })
            });

            if (res.ok) {
                const chat = await res.json();
                router.push(`/chats/${chat.id}`);
                onClose();
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">Nouvelle Discussion</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>

                {/* TABS */}
                <div className="flex border-b">
                    <button
                        onClick={() => setTab('users')}
                        className={`flex-1 py-3 font-bold text-sm ${tab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Par Utilisateur
                    </button>
                    <button
                        onClick={() => { setTab('poles'); loadPoles(); }}
                        className={`flex-1 py-3 font-bold text-sm ${tab === 'poles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Par Pôle
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Common Summary of Selection */}
                    {(selectedUsers.length > 0 || selectedPoles.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded">
                            {selectedUsers.map(u => (
                                <span key={u.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    👤 {u.name} <button onClick={() => toggleUser(u)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                            {selectedPoles.map(p => (
                                <span key={p.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    🏢 {p.name} <button onClick={() => togglePole(p)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Chat Name (Optional) */}
                    {(selectedUsers.length > 1 || selectedPoles.length > 0) && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Nom du groupe (optionnel)</label>
                            <input
                                className="w-full border p-2 rounded"
                                placeholder={selectedPoles.length > 0 ? "Ex: Inter-pôle Sécu/Bar..." : "Ex: Projet H5..."}
                                value={chatName}
                                onChange={e => setChatName(e.target.value)}
                            />
                        </div>
                    )}

                    {/* CONTENT BASED ON TAB */}
                    {tab === 'users' && (
                        <>
                            <div>
                                <label className="block text-sm font-bold mb-1">Rechercher</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    placeholder="Nom ou email..."
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1 mt-2">
                                {searchResults.map(user => {
                                    const isSelected = selectedUsers.some(u => u.id === user.id)
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => toggleUser(user)}
                                            className={`w-full text-left p-2 rounded flex items-center justify-between ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                        >
                                            <div>
                                                <div className="font-bold text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.school}</div>
                                            </div>
                                            {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {tab === 'poles' && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 mb-2">Ajoute tous les membres du pôle à la discussion.</p>
                            {poles.length === 0 && <p className="text-center text-gray-400">Chargement...</p>}
                            {poles.map(pole => {
                                const isSelected = selectedPoles.some(p => p.id === pole.id)
                                return (
                                    <button
                                        key={pole.id}
                                        onClick={() => togglePole(pole)}
                                        className={`w-full text-left p-3 rounded border flex items-center justify-between transition-colors ${isSelected ? 'bg-purple-50 border-purple-300' : 'hover:bg-gray-50 border-gray-100'}`}
                                    >
                                        <span className="font-bold text-gray-800">{pole.name}</span>
                                        {isSelected && <span className="text-purple-600 font-bold">✓</span>}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={handleCreate}
                        disabled={(selectedUsers.length === 0 && selectedPoles.length === 0) || loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                        {loading ? 'Création...' : 'Créer la discussion'}
                    </button>
                </div>
            </div>
        </div>
    )
}
