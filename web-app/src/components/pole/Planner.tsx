'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Attendance = {
    userId: string;
    status: 'PENDING' | 'PRESENT' | 'ABSENT';
    user: {
        name: string;
        image: string | null;
    }
};

type Meeting = {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    location?: string | null
    attendances?: Attendance[]
}

export default function Planner({ poleId }: { poleId: string }) {
    const { data: session } = useSession();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        fetchMeetings();
    }, [poleId]);

    const fetchMeetings = async () => {
        try {
            const res = await fetch(`/api/poles/${poleId}/meetings`);
            if (res.ok) {
                const fetchedMeetings: Meeting[] = await res.json();

                // Fetch attendance for each meeting
                const meetingsWithAttendance = await Promise.all(
                    fetchedMeetings.map(async (meeting) => {
                        const attRes = await fetch(`/api/poles/${poleId}/meetings/${meeting.id}/attendance`);
                        let attendances: Attendance[] = [];
                        if (attRes.ok) {
                            attendances = await attRes.json();
                        }
                        return { ...meeting, attendances };
                    })
                );

                setMeetings(meetingsWithAttendance);
            }
        } catch (error) {
            console.error("Failed to fetch meetings or attendances", error);
        }
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
                location,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                poleId
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsCreating(false);
            setTitle(''); setDescription(''); setDate(''); setStartTime(''); setEndTime(''); setLocation('');
            fetchMeetings();
        }
    };

    const handleRSVP = async (meetingId: string, status: 'PRESENT' | 'ABSENT') => {
        try {
            const res = await fetch(`/api/poles/${poleId}/meetings/${meetingId}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchMeetings(); // Refresh the list
            }
        } catch (error) {
            console.error("Failed to RSVP", error);
        }
    };

    return (
        <div className="h-full pb-24">
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
                        <input className="p-2 border rounded" placeholder="Lieu ou Lien (Zoom, Teams...)" value={location} onChange={e => setLocation(e.target.value)} />
                        <input className="p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        <input className="p-2 border rounded" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        <input className="p-2 border rounded mt-4 md:mt-0" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                        <textarea className="p-2 border rounded md:col-span-2 mt-4 md:mt-0" placeholder="Description / Ordre du jour" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <button className="mt-4 w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Confirmer</button>
                </form>
            )}

            <div className="space-y-4">
                {meetings.map((meeting) => {
                    const attendances = meeting.attendances || [];
                    const myAttendance = attendances.find(a => a.userId === session?.user?.id);
                    const presents = attendances.filter(a => a.status === 'PRESENT');
                    const absents = attendances.filter(a => a.status === 'ABSENT');

                    return (
                        <div key={meeting.id} className="bg-white border-l-4 border-purple-500 shadow-sm p-4 rounded-xl hover:shadow-md transition">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{meeting.title}</h3>
                                    {meeting.location && (
                                        <div className="text-sm font-medium mt-1 flex items-center gap-1">
                                            <span>📍</span>
                                            {meeting.location.startsWith('http') ? (
                                                <a href={meeting.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                    {meeting.location}
                                                </a>
                                            ) : (
                                                <span className="text-gray-700">{meeting.location}</span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-gray-500 text-sm mt-1">{meeting.description}</p>
                                </div>
                                <div className="text-left md:text-right shrink-0">
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

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="text-sm">
                                    <div className="font-medium text-gray-700 mb-1">Présences :</div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1 text-green-600">
                                            <span className="font-bold">{presents.length}</span> Présents
                                        </div>
                                        <div className="flex items-center gap-1 text-red-500">
                                            <span className="font-bold">{absents.length}</span> Absents
                                        </div>
                                    </div>
                                    {presents.length > 0 && (
                                        <div className="flex -space-x-2 mt-2">
                                            {presents.map(p => (
                                                <div key={p.userId} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden" title={p.user.name}>
                                                    {p.user.image ? <img src={p.user.image} alt={p.user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{p.user.name?.[0]}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col w-full md:w-auto shrink-0 bg-gray-50 p-3 rounded-lg border">
                                    <div className="text-xs font-bold text-center text-gray-500 uppercase mb-2">Serez-vous présent ?</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRSVP(meeting.id, 'PRESENT')}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded font-bold text-sm transition ${myAttendance?.status === 'PRESENT' ? 'bg-green-600 text-white shadow-inner' : 'bg-white text-gray-700 border hover:bg-green-50'}`}
                                        >
                                            Oui
                                        </button>
                                        <button
                                            onClick={() => handleRSVP(meeting.id, 'ABSENT')}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded font-bold text-sm transition ${myAttendance?.status === 'ABSENT' ? 'bg-red-500 text-white shadow-inner' : 'bg-white text-gray-700 border hover:bg-red-50'}`}
                                        >
                                            Non
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {meetings.length === 0 && <p className="text-gray-400 text-center py-10 bg-white rounded-xl border border-gray-200">Aucune réunion prévue.</p>}
            </div>
        </div>
    );
}
