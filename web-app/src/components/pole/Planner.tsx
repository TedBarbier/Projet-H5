'use client'

import { useState, useEffect } from 'react';

type Meeting = {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
}

export default function Planner({ poleId }: { poleId: string }) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        fetchMeetings();
    }, [poleId]);

    const fetchMeetings = async () => {
        const res = await fetch(`/api/poles/${poleId}/meetings`);
        if (res.ok) setMeetings(await res.json());
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        const res = await fetch(`/api/poles/${poleId}/meetings`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                description,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                poleId
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsCreating(false);
            setTitle(''); setDescription(''); setDate(''); setStartTime(''); setEndTime('');
            fetchMeetings();
        }
    };

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-700">Prochaines Réunions</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700"
                >
                    {isCreating ? 'Annuler' : '+ Planifier'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="p-2 border rounded" placeholder="Titre de la réunion" value={title} onChange={e => setTitle(e.target.value)} required />
                        <input className="p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        <input className="p-2 border rounded" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        <input className="p-2 border rounded" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                        <textarea className="p-2 border rounded md:col-span-2" placeholder="Description / Ordre du jour" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <button className="mt-4 w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Confirmer</button>
                </form>
            )}

            <div className="space-y-4">
                {meetings.map(meeting => (
                    <div key={meeting.id} className="bg-white border-l-4 border-purple-500 shadow-sm p-4 rounded hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{meeting.title}</h3>
                                <p className="text-gray-500 text-sm mt-1">{meeting.description}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-purple-700 text-lg">
                                    {new Date(meeting.startTime).toLocaleDateString()}
                                </div>
                                <div className="text-gray-500 text-sm font-mono">
                                    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {meetings.length === 0 && <p className="text-gray-400 text-center py-10">Aucune réunion prévue.</p>}
            </div>
        </div>
    );
}
