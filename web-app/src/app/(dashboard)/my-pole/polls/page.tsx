'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'

type PollOption = {
    id: string
    text: string
    _count: { votes: number }
    votes: { userId: string }[]
}

type Poll = {
    id: string
    title: string
    description: string | null
    createdAt: string
    creator: { id: string, name: string, image: string | null }
    options: PollOption[]
    hasVoted: boolean
}

export default function PollsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [polls, setPolls] = useState<Poll[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [options, setOptions] = useState<string[]>(['', ''])
    const [submitting, setSubmitting] = useState(false)

    // Get poleId from current path or context
    const [poleId, setPoleId] = useState<string | null>(null)

    useEffect(() => {
        // Fetch user data to get their poleId
        fetch('/api/user/me').then(res => res.json()).then(data => {
            if (data.poleId) {
                setPoleId(data.poleId)
            } else if (data.memberships && data.memberships.length > 0) {
                setPoleId(data.memberships[0].poleId)
            }
        })
    }, [])

    useEffect(() => {
        if (poleId) {
            fetchPolls()
        }
    }, [poleId])

    const fetchPolls = async () => {
        if (!poleId) return
        try {
            const res = await fetch(`/api/poles/${poleId}/polls`)
            if (res.ok) {
                const data = await res.json()
                setPolls(data)
            }
        } catch (error) {
            console.error('Failed to fetch polls:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!poleId || title.trim() === '' || options.some(o => o.trim() === '')) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/poles/${poleId}/polls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    options: options.filter(o => o.trim() !== '')
                })
            })

            if (res.ok) {
                setShowForm(false)
                setTitle('')
                setDescription('')
                setOptions(['', ''])
                fetchPolls()
            }
        } catch (error) {
            console.error('Failed to create poll:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleVote = async (pollId: string, optionId: string) => {
        if (!poleId) return
        try {
            const res = await fetch(`/api/poles/${poleId}/polls/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optionId })
            })

            if (res.ok) {
                fetchPolls()
            }
        } catch (error) {
            console.error('Failed to vote:', error)
        }
    }

    const handleAddOption = () => setOptions([...options, ''])
    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        }
    }
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des sondages...</div>
    if (!poleId) return <div className="p-8 text-center text-gray-500">Pôle non trouvé.</div>

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">🗳️ Sondages</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    {showForm ? 'Annuler' : 'Créer un sondage'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <h2 className="text-lg font-bold mb-4">Nouveau sondage</h2>
                    <form onSubmit={handleCreatePoll} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                placeholder="Posez une question à votre pôle..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={e => handleOptionChange(index, e.target.value)}
                                            className="flex-1 border-gray-300 rounded-lg shadow-sm p-2 border"
                                            placeholder={`Option ${index + 1}`}
                                            required
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                            >
                                + Ajouter une option
                            </button>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Création...' : 'Créer le sondage'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {polls.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <div className="text-4xl mb-3">🗳️</div>
                        <h3 className="text-lg font-medium text-gray-900">Aucun sondage</h3>
                        <p className="text-gray-500">Créez le premier sondage pour votre pôle !</p>
                    </div>
                ) : (
                    polls.map(poll => {
                        const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.votes, 0)

                        return (
                            <div key={poll.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{poll.title}</h3>
                                        {poll.description && <p className="text-gray-600 mt-1">{poll.description}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {poll.options.map(option => {
                                        const percentage = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
                                        const isSelected = option.votes.some(v => v.userId === session?.user?.id)

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleVote(poll.id, option.id)}
                                                className="w-full text-left relative overflow-hidden rounded-lg border focus:outline-none transition-all duration-200 group"
                                            >
                                                <div
                                                    className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                                <div className={`relative p-3 flex justify-between items-center ${isSelected ? 'border-blue-500 font-medium text-blue-900' : 'border-gray-200 text-gray-700'}`}>
                                                    <span className="flex items-center gap-2 z-10">
                                                        {isSelected && <span className="text-blue-500">✓</span>}
                                                        {option.text}
                                                    </span>
                                                    <span className="text-sm font-medium z-10">{percentage}% ({option._count.votes})</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                            {poll.creator.image ? (
                                                <img src={poll.creator.image} alt={poll.creator.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{poll.creator.name?.[0]}</span>
                                            )}
                                        </div>
                                        <span>Proposé par {poll.creator.name}</span>
                                    </div>
                                    <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
