'use client'

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io } from "socket.io-client";

type Message = {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        name: string
        image: string
    }
}

export default function Chat({ poleId }: { poleId: string }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        const socket = io('http://localhost:3001');
        socket.on('connect', () => {
            console.log("Connected to Chat");
        });

        socket.on('events-updates', (msg: any) => {
            if (msg.type === 'pole_message' && msg.poleId === poleId) {
                setMessages(prev => [...prev, msg.payload]);
                scrollToBottom();
            }
        });

        return () => { socket.disconnect() };
    }, [poleId]);

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const fetchMessages = async () => {
        const res = await fetch(`/api/poles/${poleId}/messages`);
        if (res.ok) {
            setMessages(await res.json());
            scrollToBottom();
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Optimistic UI? Maybe wait for ack to prevent out of order
        // Let's just send and wait for socket reflection or response
        await fetch(`/api/poles/${poleId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: input }),
            headers: { 'Content-Type': 'application/json' }
        });
        setInput('');
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b font-bold text-gray-700 flex justify-between items-center">
                <span>💬 Discussion d'Équipe</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, i) => {
                    const isMe = msg.author.id === session?.user?.id;
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                                {msg.author.image ? <img src={msg.author.image} alt={msg.author.name} /> : <span className="text-xs">{msg.author.name?.[0]}</span>}
                            </div>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'
                                }`}>
                                {!isMe && <div className="text-xs font-bold text-gray-500 mb-1">{msg.author.name}</div>}
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
