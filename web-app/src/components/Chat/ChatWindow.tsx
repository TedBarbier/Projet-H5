'use client'

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io } from "socket.io-client";

type Message = {
    id: string
    content: string
    createdAt: string
    sender: {
        id: string
        name: string
        image: string | null
    }
}

export default function ChatWindow({ conversationId, conversationName }: { conversationId: string, conversationName: string }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        // Polling fallback to guarantee dynamic chat
        const intervalId = setInterval(() => {
            fetchMessages();
        }, 3000);

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const socketIo = io(socketUrl);

        socketIo.on('connect', () => {
            console.log("Connected to Chat Socket");
        });

        socketIo.on('events-updates', (msg: any) => {
            // Check if message belongs to this conversation
            if (msg.type === 'CHAT_MESSAGE' && msg.conversationId === conversationId) {
                setMessages(prev => {
                    const exists = prev.some(m => m.id === msg.message.id);
                    if (exists) return prev;
                    scrollToBottom();
                    return [...prev, msg.message];
                });
            }
        });

        return () => {
            clearInterval(intervalId);
            socketIo.disconnect();
        };
    }, [conversationId]);

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const fetchMessages = async () => {
        const res = await fetch(`/api/chats/${conversationId}`);
        if (res.ok) {
            const newData = await res.json();
            setMessages(prev => {
                if (prev.length !== newData.length) {
                    scrollToBottom();
                }
                return newData;
            });
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const res = await fetch(`/api/chats/${conversationId}`, {
            method: 'POST',
            body: JSON.stringify({ content: input }),
            headers: { 'Content-Type': 'application/json' }
        });
        setInput('');

        if (res.ok) {
            const newMessage = await res.json();
            setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
            scrollToBottom();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b font-bold text-gray-700 flex justify-between items-center">
                <span>💬 {conversationName}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                    const isMe = msg.sender.id === session?.user?.id;
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                                {msg.sender.image ? <img src={msg.sender.image} alt={msg.sender.name} /> : <span className="text-xs">{msg.sender.name?.[0]}</span>}
                            </div>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'
                                }`}>
                                {!isMe && <div className="text-xs font-bold text-gray-500 mb-1">{msg.sender.name}</div>}
                                <p>{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Écrire un message..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                    ➤
                </button>
            </form>
        </div>
    );
}
