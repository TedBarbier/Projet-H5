'use client'

import { useState, useEffect } from 'react';

type AllowedEmailDomain = {
    id: string;
    domain: string;
    school: string;
};

// Define the school enum values that we can pick from
const SCHOOLS = [
    'LYON',
    'RENNES',
    'ROUEN',
    'STRASBOURG',
    'TOULOUSE',
    'CENTRE_VAL_DE_LOIRE',
    'HAUTS_DE_FRANCE'
];

export default function DomainsAdminPage() {
    const [domains, setDomains] = useState<AllowedEmailDomain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [newDomain, setNewDomain] = useState('');
    const [selectedSchool, setSelectedSchool] = useState(SCHOOLS[0]);

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/admin/domains');
            if (!res.ok) throw new Error('Erreur lors du chargement des domaines');
            const data = await res.json();
            setDomains(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/admin/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain, school: selectedSchool })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de la création');
            }

            setNewDomain('');
            await fetchDomains();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce domaine ?")) return;

        try {
            const res = await fetch('/api/admin/domains', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!res.ok) throw new Error('Erreur lors de la suppression');
            await fetchDomains();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Domaines Emails Autorisés</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleAddDomain} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-bold mb-4">Ajouter un domaine</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domaine (ex: insa-lyon.fr)</label>
                        <input
                            type="text"
                            required
                            value={newDomain}
                            onChange={e => setNewDomain(e.target.value)}
                            placeholder="insa-lyon.fr"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">École affectée</label>
                        <select
                            value={selectedSchool}
                            onChange={e => setSelectedSchool(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {SCHOOLS.map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                        Ajouter
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-700">Domaine</th>
                            <th className="p-4 font-semibold text-gray-700">École Associée</th>
                            <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {domains.map((d) => (
                            <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                <td className="p-4 text-gray-800 font-medium">@{d.domain}</td>
                                <td className="p-4 text-gray-600">{d.school.replace(/_/g, ' ')}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDelete(d.id)}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {domains.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">
                                    Aucun domaine autorisé configuré pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-blue-50 text-blue-800 p-4 rounded text-sm">
                <strong>Important :</strong> Si aucun domaine n'est défini, l'application devrait théoriquement bloquer toutes les nouvelles inscriptions (selon l'implémentation de la vérification). Assurez-vous d'ajouter au minimum un domaine.
            </div>
        </div>
    );
}
