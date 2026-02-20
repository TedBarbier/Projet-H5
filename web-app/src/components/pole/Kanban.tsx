'use client'

import { useState, useEffect } from 'react';

type Task = {
    id: string
    title: string
    description: string | null
    status: string
    assignees: { id: string, name: string, image: string | null }[]
    checklist: { id?: string, content: string, isDone: boolean }[]
}

type Member = {
    id: string
    name: string
    image: string | null
}

export default function Kanban({ poleId }: { poleId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

    // Checklist State
    const [checklist, setChecklist] = useState<{ content: string, isDone: boolean }[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchMembers();
    }, [poleId]);

    const fetchTasks = async () => {
        const res = await fetch(`/api/poles/${poleId}/tasks`);
        if (res.ok) setTasks(await res.json());
    };

    const fetchMembers = async () => {
        const res = await fetch(`/api/poles/${poleId}/members`);
        if (res.ok) setMembers(await res.json());
    };

    const openModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setTitle(task.title);
            setDescription(task.description || '');
            setSelectedAssignees(task.assignees ? task.assignees.map(a => a.id) : []);
            setChecklist(task.checklist ? task.checklist.map(c => ({ content: c.content, isDone: c.isDone })) : []);
        } else {
            setEditingTask(null);
            setTitle('');
            setDescription('');
            setSelectedAssignees([]);
            setChecklist([]);
        }
        setNewChecklistItem('');
        setIsModalOpen(true);
    }

    const addChecklistItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChecklistItem.trim()) return;
        setChecklist([...checklist, { content: newChecklistItem, isDone: false }]);
        setNewChecklistItem('');
    };

    const removeChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index));
    };

    const toggleChecklistItem = (index: number) => {
        const updated = [...checklist];
        updated[index].isDone = !updated[index].isDone;
        setChecklist(updated);
    };

    const toggleAssignee = (memberId: string) => {
        if (selectedAssignees.includes(memberId)) {
            setSelectedAssignees(selectedAssignees.filter(id => id !== memberId));
        } else {
            setSelectedAssignees([...selectedAssignees, memberId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const url = `/api/poles/${poleId}/tasks`;
        const method = editingTask ? 'PATCH' : 'POST';
        const body = {
            taskId: editingTask?.id,
            title,
            description,
            assignees: selectedAssignees,
            checklist
        };

        const res = await fetch(url, {
            method,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchTasks();
        } else {
            alert("Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async () => {
        if (!editingTask || !confirm("Supprimer cette tâche ?")) return;

        const res = await fetch(`/api/poles/${poleId}/tasks`, {
            method: 'DELETE',
            body: JSON.stringify({ taskId: editingTask.id }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchTasks();
        } else {
            alert("Erreur lors de la suppression");
        }
    };

    const updateStatus = async (taskId: string, newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await fetch(`/api/poles/${poleId}/tasks`, {
            method: 'PATCH',
            body: JSON.stringify({ taskId, status: newStatus }),
            headers: { 'Content-Type': 'application/json' }
        });
    };

    const columns = ['TODO', 'IN_PROGRESS', 'DONE'];

    return (
        <div className="h-full flex flex-col relative">
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow-sm"
                >
                    + Nouvelle Tâche
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {columns.map(status => (
                    <div key={status} className="bg-gray-100 rounded-xl p-4 flex flex-col h-full">
                        <h3 className="font-bold text-gray-500 mb-4 uppercase text-sm tracking-wider flex justify-between">
                            {status.replace('_', ' ')}
                            <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-xs py-0.5">
                                {tasks.filter(t => t.status === status).length}
                            </span>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {tasks.filter(t => t.status === status).map(task => {
                                const doneItems = task.checklist ? task.checklist.filter(i => i.isDone).length : 0;
                                const totalItems = task.checklist ? task.checklist.length : 0;

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => openModal(task)}
                                        className="bg-white p-3 rounded shadow-sm border border-gray-200 group hover:shadow-md transition cursor-pointer relative"
                                    >
                                        <h4 className="font-bold text-gray-800">{task.title}</h4>

                                        {/* Checklist Progress */}
                                        {totalItems > 0 && (
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <span className={doneItems === totalItems ? "text-green-600 font-bold" : ""}>
                                                    ☑ {doneItems}/{totalItems}
                                                </span>
                                            </div>
                                        )}

                                        {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>}

                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex -space-x-1 overflow-hidden">
                                                {task.assignees && task.assignees.length > 0 ? task.assignees.map(a => (
                                                    <div
                                                        key={a.id}
                                                        className="inline-block h-6 w-6 rounded-full bg-blue-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-blue-800"
                                                        title={a.name}
                                                    >
                                                        {a.name.charAt(0)}
                                                    </div>
                                                )) : (
                                                    <span className="text-xs text-gray-400 italic">Non assigné</span>
                                                )}
                                            </div>

                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                {status !== 'TODO' && (
                                                    <button onClick={() => updateStatus(task.id, columns[columns.indexOf(status) - 1])} className="p-1 hover:bg-gray-100 rounded text-gray-500">⬅️</button>
                                                )}
                                                {status !== 'DONE' && (
                                                    <button onClick={() => updateStatus(task.id, columns[columns.indexOf(status) + 1])} className="p-1 hover:bg-gray-100 rounded text-gray-500">➡️</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {tasks.filter(t => t.status === status).length === 0 && (
                                <div className="text-center text-gray-400 text-sm italic py-4">Vide</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Titre</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                            placeholder="Titre de la tâche"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={4}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                            placeholder="Détails..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Assigné à</label>
                                        <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
                                            {members.map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => toggleAssignee(m.id)}
                                                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${selectedAssignees.includes(m.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssignees.includes(m.id)}
                                                        readOnly
                                                        className="pointer-events-none"
                                                    />
                                                    <span className="text-sm">{m.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Checklist */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Checklist</label>

                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={e => setNewChecklistItem(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addChecklistItem(e as any);
                                                }
                                            }}
                                            className="flex-1 border p-2 rounded text-sm"
                                            placeholder="Ajouter une étape..."
                                        />
                                        <button
                                            type="button"
                                            onClick={addChecklistItem}
                                            className="bg-gray-200 px-3 rounded hover:bg-gray-300"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {checklist.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 group">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isDone}
                                                    onChange={() => toggleChecklistItem(idx)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className={`flex-1 text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                    {item.content}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeChecklistItem(idx)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {checklist.length === 0 && (
                                            <p className="text-sm text-gray-400 italic">Aucune étape.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t mt-4">
                                <div>
                                    {editingTask && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-bold"
                                        >
                                            Supprimer
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-bold"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
