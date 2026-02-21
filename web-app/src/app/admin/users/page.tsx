
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type User = {
    id: string
    name: string | null
    email: string | null
    role: string
    school: string | null
    sport: string | null
    memberships: { poleId: string, role: string }[]
    payments: { status: string }[]
}

type Pole = { id: string, name: string }

export default function AdminUsersPage() {
    const { data: session } = useSession()
    const [users, setUsers] = useState<User[]>([])
    const [poles, setPoles] = useState<Pole[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'users' | 'cotisants' | 'staff'>('users')

    // Filters
    const [filterSchool, setFilterSchool] = useState('')
    const [filterSport, setFilterSport] = useState('')

    // Modals
    const [showUserModal, setShowUserModal] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '', sport: '' })

    const [showStaffModal, setShowStaffModal] = useState(false)
    const [selectedUserStaff, setSelectedUserStaff] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedPole, setSelectedPole] = useState('')

    // Push Modal
    const [showPushModal, setShowPushModal] = useState(false)
    const [selectedUserForPush, setSelectedUserForPush] = useState<User | null>(null)
    const [pushForm, setPushForm] = useState({ title: '', body: '' })
    const [isSendingPush, setIsSendingPush] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [resUsers, resPoles] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/poles')
            ]);
            if (resUsers.ok) setUsers(await resUsers.json())
            if (resPoles.ok) setPoles(await resPoles.json())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // --- User Management Actions ---

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setEditForm({ name: user.name || '', email: user.email || '', password: '', sport: user.sport || '' })
        setShowUserModal(true)
    }

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    name: editForm.name,
                    email: editForm.email,
                    sport: editForm.sport,
                    password: editForm.password || undefined
                })
            })
            if (res.ok) {
                setShowUserModal(false)
                fetchData()
            } else {
                alert("Erreur lors de la modification")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Supprimer cet utilisateur ? Irréversible.")) return;
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch (error) { console.error(error); }
    }

    // --- Payment Actions ---

    const togglePayment = async (userId: string, currentStatus: boolean) => {
        const newStatus = currentStatus ? 'CANCELLED' : 'PAID';
        try {
            const res = await fetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: newStatus })
            })
            if (res.ok) fetchData()
        } catch (error) { console.error(error); }
    }

    // --- Staff Actions ---

    const openAddStaffModal = (userId?: string) => {
        setSelectedUserStaff(userId || '');
        setSelectedRole('');
        setSelectedPole('');
        setShowStaffModal(true);
    }

    const handleAddStaffSubmit = async () => {
        if (!selectedUserStaff || !selectedRole) return;

        try {
            if (['ADMIN', 'SUPER_ADMIN'].includes(selectedRole)) {
                await fetch('/api/admin/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: selectedUserStaff, role: selectedRole })
                })
            } else {
                if (!selectedPole) { alert("Pôle requis"); return; }
                await fetch('/api/admin/memberships', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: selectedUserStaff, poleId: selectedPole, role: selectedRole })
                })
            }
            setShowStaffModal(false)
            fetchData()
        } catch (e) { console.error(e) }
    }

    const removeStaffRole = async (userId: string, roleType: 'GLOBAL' | 'POLE', poleId?: string) => {
        if (!confirm("Retirer ce rôle ?")) return;
        try {
            if (roleType === 'GLOBAL') {
                await fetch('/api/admin/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, role: 'USER' })
                })
            } else {
                await fetch(`/api/admin/memberships?userId=${userId}&poleId=${poleId}`, { method: 'DELETE' })
            }
            fetchData()
        } catch (e) { console.error(e) }
    }

    // --- Custom Push Action ---
    const handleSendPush = async () => {
        if (!pushForm.title || !pushForm.body) return;
        setIsSendingPush(true)
        try {
            // Include userId only if a specific user was selected (null means global broadcast)
            const payload = {
                title: pushForm.title,
                body: pushForm.body,
                ...(selectedUserForPush ? { userId: selectedUserForPush.id } : {})
            };

            const res = await fetch('/api/admin/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const data = await res.json();
                if (data.sent > 0) {
                    alert(`✅ Notification envoyée et reçue par ${data.sent} appareil(s).`);
                } else if (data.totalDevices === 0) {
                    alert(`⚠️ Cet utilisateur n'a activé les notifications sur aucun appareil.`);
                } else {
                    alert(`❌ Échec de la livraison. Les abonnements peuvent être expirés.`);
                }
                setShowPushModal(false);
                setPushForm({ title: '', body: '' })
            } else {
                alert("❌ Erreur d'envoi");
            }
        } catch (error) {
            console.error(error)
            alert("❌ Erreur serveur");
        } finally {
            setIsSendingPush(false)
        }
    }

    // --- Render Helpers ---

    const isPaid = (u: User) => u.payments.some(p => p.status === 'PAID');
    const isStaff = (u: User) => ['ADMIN', 'SUPER_ADMIN'].includes(u.role) || u.memberships.length > 0;
    const getPoleName = (id: string) => poles.find(p => p.id === id)?.name || id;

    // Derived lists for filters
    const uniqueSchools = Array.from(new Set(users.map(u => u.school).filter(Boolean)))
    const uniqueSports = Array.from(new Set(users.map(u => u.sport).filter(Boolean)))

    const filteredUsers = () => {
        if (activeTab === 'cotisants') {
            return users.filter(u => {
                const matchSchool = filterSchool ? u.school === filterSchool : true;
                const matchSport = filterSport ? u.sport === filterSport : true;
                return matchSchool && matchSport;
            });
        }
        if (activeTab === 'staff') return users.filter(isStaff);
        return users; // 'users' tab shows all
    }

    const list = filteredUsers();

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Administration</h1>

            {/* Tabs & Global Actions */}
            <div className="flex border-b border-gray-200 mb-6 justify-between items-end">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-4 font-bold ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Utilisateurs
                    </button>
                    <button
                        onClick={() => setActiveTab('cotisants')}
                        className={`py-2 px-4 font-bold ${activeTab === 'cotisants' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Cotisants
                    </button>
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`py-2 px-4 font-bold ${activeTab === 'staff' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Staff & Grades
                    </button>
                </div>

                <div className="pb-2">
                    <button
                        onClick={() => {
                            setSelectedUserForPush(null); // null means "Everyone"
                            setShowPushModal(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
                    >
                        <span>📢</span> Push Global
                    </button>
                </div>
            </div>

            {/* Tab: Users (Edit Info) */}
            {activeTab === 'users' && (
                <div className="bg-white rounded shadow p-4 overflow-x-auto">
                    <p className="mb-4 text-sm text-gray-500">Gestion des informations personnelles (Nom, Email, Mot de passe).</p>
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase bg-gray-100">
                                <th className="px-4 py-3">Nom</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">École</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="px-4 py-3 font-semibold">{user.name || '-'}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.school || '-'}</td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedUserForPush(user);
                                                setShowPushModal(true);
                                            }}
                                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold hover:bg-purple-200"
                                        >
                                            🔔 Push
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={user.id === session?.user?.id}
                                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 disabled:opacity-50"
                                        >
                                            Supr.
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab: Cotisants (Payment & Sport) */}
            {activeTab === 'cotisants' && (
                <div className="bg-white rounded shadow p-4 overflow-x-auto">
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex gap-4 items-center w-full md:w-auto">
                            <h2 className="font-bold text-gray-700">Filtres :</h2>
                            <select
                                className="border p-2 rounded text-sm flex-1"
                                value={filterSchool}
                                onChange={e => setFilterSchool(e.target.value)}
                            >
                                <option value="">Toutes les écoles</option>
                                {uniqueSchools.map(s => <option key={s as string} value={s as string}>{s}</option>)}
                            </select>

                            <select
                                className="border p-2 rounded text-sm flex-1"
                                value={filterSport}
                                onChange={e => setFilterSport(e.target.value)}
                            >
                                <option value="">Tous les sports</option>
                                {uniqueSports.map(s => <option key={s as string} value={s as string}>{s}</option>)}
                            </select>

                            {(filterSchool || filterSport) && (
                                <button
                                    onClick={() => { setFilterSchool(''); setFilterSport(''); }}
                                    className="text-red-500 text-sm hover:underline font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{list.length} résultats</p>
                    </div>

                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase bg-gray-100">
                                <th className="px-4 py-3">Utilisateur</th>
                                <th className="px-4 py-3">Sport</th>
                                <th className="px-4 py-3">Statut Cotisation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(user => {
                                const paid = isPaid(user);
                                return (
                                    <tr key={user.id} className="border-b">
                                        <td className="px-4 py-3">
                                            <div className="font-bold">{user.name || user.email}</div>
                                            <div className="text-xs text-gray-500">{user.school}</div>
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-[10px] text-blue-600 hover:underline mt-1"
                                            >
                                                Modifier infos
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.sport ? (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                                                    {user.sport}
                                                </span>
                                            ) : <span className="text-gray-400 text-xs">Non défini</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-5 w-5 text-green-600"
                                                    checked={paid}
                                                    onChange={() => togglePayment(user.id, paid)}
                                                />
                                                <span className={`ml-2 text-sm font-bold ${paid ? 'text-green-700' : 'text-red-700'}`}>
                                                    {paid ? 'PAYÉ ✅' : 'NON PAYÉ ❌'}
                                                </span>
                                            </label>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab: Staff (Roles) */}
            {activeTab === 'staff' && (
                <div className="bg-white rounded shadow p-4 overflow-x-auto">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Gestion des rôles et des accès Staff.</p>
                        <button
                            onClick={() => openAddStaffModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-700"
                        >
                            + Nouveau Staff
                        </button>
                    </div>

                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase bg-gray-100">
                                <th className="px-4 py-3">Utilisateur</th>
                                <th className="px-4 py-3">Rôles Globaux</th>
                                <th className="px-4 py-3">Rôles Pôles</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="font-bold">{user.name || user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.role}
                                                {session?.user?.role === 'SUPER_ADMIN' && user.id !== session.user.id && (
                                                    <button onClick={() => removeStaffRole(user.id, 'GLOBAL')} className="ml-2 text-red-600 hover:text-red-900">x</button>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 flex flex-wrap gap-2">
                                        {user.memberships.map(m => {
                                            const canRemoveStaff = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN' || (session?.user as any)?.poleId === m.poleId || (session?.user as any)?.memberships?.some((um: any) => um.poleId === m.poleId && um.role === 'RESP');
                                            return (
                                                <span key={m.poleId} className={`inline-flex items-center px-2 py-1 rounded text-xs border ${m.role === 'RESP' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
                                                    }`}>
                                                    {m.role} @ {getPoleName(m.poleId)}
                                                    {canRemoveStaff && (
                                                        <button onClick={() => removeStaffRole(user.id, 'POLE', m.poleId)} className="ml-2 text-gray-400 hover:text-red-600">x</button>
                                                    )}
                                                </span>
                                            )
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openAddStaffModal(user.id)}
                                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 border border-gray-300"
                                            title="Ajouter un grade"
                                        >
                                            ➕ Grade
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: Edit User */}
            {showUserModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Modifier {editingUser.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Nom</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Email</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder={editingUser.email || ''}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    className="w-full border p-2 rounded"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Sport</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={editForm.sport}
                                    onChange={e => setEditForm({ ...editForm, sport: e.target.value })}
                                    placeholder="Ex: Football, Tennis..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                                <button onClick={handleSaveUser} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Add Staff */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Ajouter un Grade / Staff</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Utilisateur</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={selectedUserStaff}
                                    onChange={e => setSelectedUserStaff(e.target.value)}
                                // Disable selection if modal was opened for specific user
                                // But keep enabled to allow flexibility? Let's keep enabled.
                                >
                                    <option value="">Choisir un utilisateur...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Role</label>
                                <select className="w-full border p-2 rounded" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                    <option value="">Sélectionner...</option>
                                    <option value="STAFF">Staff Pôle</option>
                                    <option value="RESP">Resp Pôle</option>
                                    {session?.user?.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin Global</option>}
                                    {session?.user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                                </select>
                            </div>

                            {['STAFF', 'RESP'].includes(selectedRole) && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Pôle Concerné</label>
                                    <select className="w-full border p-2 rounded" value={selectedPole} onChange={e => setSelectedPole(e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {poles.filter(p => session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || (session?.user as any)?.poleId === p.id || (session?.user as any)?.memberships?.some((um: any) => um.poleId === p.id && um.role === 'RESP')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowStaffModal(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                                <button onClick={handleAddStaffSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Valider</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Send Custom Push */}
            {showPushModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">
                            {selectedUserForPush ? `Notification Push (${selectedUserForPush.name || selectedUserForPush.email})` : '📢 Notification Push Globale (Tous les membres)'}
                        </h3>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-2">Cette notification s'affichera directement sur l'écran du joueur sans passer par le fil d'actualité global.</p>
                            <div>
                                <label className="block text-sm font-bold mb-1">Titre</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={pushForm.title}
                                    onChange={e => setPushForm({ ...pushForm, title: e.target.value })}
                                    placeholder="⚠️ Alerte Match"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Message</label>
                                <textarea
                                    className="w-full border p-2 rounded h-24"
                                    value={pushForm.body}
                                    onChange={e => setPushForm({ ...pushForm, body: e.target.value })}
                                    placeholder="Rendez-vous sur le terrain 3 immédiatement."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowPushModal(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                                <button onClick={handleSendPush} disabled={isSendingPush} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold disabled:opacity-50">
                                    {isSendingPush ? 'Envoi...' : '🔔 Envoyer Direct'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
