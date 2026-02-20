'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Announcement = {
    id: string
    title: string
    content: string
    createdAt: string
    author: { name: string }
}

export default function AdminAnnouncementsPage() {
    const { data: session } = useSession()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        const res = await fetch('/api/admin/announcements')
        if (res.ok) {
            setAnnouncements(await res.json())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            })

            if (res.ok) {
                setTitle('')
                setContent('')
                fetchAnnouncements() // Refresh list
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette annonce ?")) return;

        try {
            await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
            setAnnouncements(prev => prev.filter(a => a.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">📢 Gestion des Annonces</h1>

            {/* Create Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Nouvelle Annonce</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Titre</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contenu</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 h-24"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {loading ? 'Publication...' : 'Publier & Diffuser'}
                    </button>
                </form>
            </div>

            {/* History List */}
            <h2 className="text-xl font-semibold mb-4">Historique</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Auteur</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.map((a) => (
                            <tr key={a.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {new Date(a.createdAt).toLocaleString()}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-bold">
                                    {a.title}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {a.author?.name || 'Inconnu'}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right space-x-3">
                                    {/* @ts-ignore */}
                                    {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? (
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-2 py-1 rounded"
                                        >
                                            Supprimer
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
