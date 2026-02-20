'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Conversation = {
    id: string
    name: string | null
    type: 'GROUP' | 'DM' | 'POLE'
    updatedAt: string
    pole?: { name: string, color: string }
    participants: { user: { name: string, image: string | null } }[]
    messages: { content: string, createdAt: string }[]
}

export default function ConversationList({ basePath = '/chats' }: { basePath?: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const router = useRouter()

    useEffect(() => {
        // ... (fetch logic remains same)
        fetch('/api/chats')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setConversations(data)
                } else {
                    console.error("Chats data is not an array", data);
                    setConversations([])
                }
            })
            .catch(err => {
                console.error(err);
                setConversations([]);
            })
    }, [])

    // ... (helper functions remain same)
    const getDisplayName = (c: Conversation) => {
        if (c.name) return c.name;
        if (c.type === 'POLE' && c.pole) return `Pôle ${c.pole.name}`;
        // For DMs or unnamed groups, show participants
        return c.participants.map(p => p.user.name).join(', ') || 'Discussion sans nom';
    }

    const getLastMessage = (c: Conversation) => {
        if (c.messages.length > 0) return c.messages[0].content;
        return "Aucun message";
    }

    return (
        <div className="space-y-2">
            {conversations.map(c => (
                <Link
                    key={c.id}
                    href={`${basePath}/${c.id}`}
                    className="block bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                >
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-gray-800">
                            {c.type === 'POLE' && <span className="mr-2 text-xs bg-gray-200 px-1 rounded">POLE</span>}
                            {getDisplayName(c)}
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(c.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 truncate">
                        {getLastMessage(c)}
                    </div>
                </Link>
            ))}
            {conversations.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                    Aucune conversation pour le moment.
                </div>
            )}
        </div>
    )
}
