'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
    const [stats, setStats] = useState<{ totalUsers: number, paidUsers: number } | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err))
    }, [])

    const sendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            const res = await fetch('/api/admin/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, body: content }),
            })

            if (res.ok) {
                const data = await res.json();
                if (data.sent > 0) {
                    setStatus(`✅ Notifications envoyées avec succès à ${data.sent} appareils !`)
                } else if (data.totalDevices === 0) {
                    setStatus(`⚠️ Personne n'a encore activé les notifications.`)
                } else {
                    setStatus(`❌ Échec de la livraison.`)
                }
                setTitle('')
                setContent('')
            } else {
                setStatus('❌ Erreur lors de l\'envoi.')
            }
        } catch (error) {
            setStatus('❌ Erreur réseau.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de Bord Admin</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Inscrits</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats ? stats.totalUsers : '-'}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Cotisants</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900">{stats ? stats.paidUsers : '-'}</p>
                        {stats && <p className="text-sm text-gray-500 mb-1">({Math.round((stats.paidUsers / stats.totalUsers) * 100)}%)</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">Envoyer une notification Push</h2>
                <form onSubmit={sendAnnouncement} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Titre</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            placeholder="Ex: Retard Match Football"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contenu</label>
                        <textarea
                            required
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            placeholder="Détails de l'annonce..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white font-bold py-2 px-4 rounded ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {loading ? 'Envoi...' : 'Envoyer en direct 🚀'}
                    </button>

                    {status && <p className={`text-center mt-4 font-bold ${status.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{status}</p>}
                </form>
            </div>
        </div>
    )
}
