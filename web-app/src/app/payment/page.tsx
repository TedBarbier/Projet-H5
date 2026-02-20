'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function PaymentPage() {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({ sport: '' });
    const [saving, setSaving] = useState(false);
    const [sportsList, setSportsList] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, sportsRes] = await Promise.all([
                    fetch('/api/user/profile'),
                    fetch('/api/sports')
                ]);

                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data);
                    if (data.sport) {
                        setFormData({ sport: data.sport });
                    }
                }

                if (sportsRes.ok) {
                    const sports = await sportsRes.json();
                    setSportsList(sports);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // We only send sport, school is read-only/auto-detected but API requires it for validation
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sport: formData.sport,
                    school: profile.school
                })
            });
            if (res.ok) {
                const updated = await res.json();
                await update({ user: { school: updated.user.school, sport: updated.user.sport } }); // Update session
                setProfile(updated.user); // Update local profile to switch view
            } else {
                alert("Erreur lors de la mise à jour du profil");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: 1000, currency: 'EUR' }) // 10.00 EUR
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = data.url;
            } else {
                const errorText = await response.text();
                alert(`Erreur (${response.status}): ${errorText}`);
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue.");
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;

    // View: Profile Completion
    if (!profile?.school || !profile?.sport) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Finaliser votre inscription</h1>
                    <p className="text-gray-500 mb-6 text-center">Veuillez renseigner votre sport pour continuer.</p>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">École INSA (Détectée)</label>
                            <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 text-gray-500 border">
                                {profile?.school ? profile.school.replace(/_/g, ' ') : "Non détectée (Contactez un admin)"}
                            </div>
                            {!profile?.school && (
                                <p className="text-xs text-red-500 mt-1">Impossible de détecter votre école via votre email.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sport</label>
                            <select
                                required
                                value={formData.sport}
                                onChange={e => setFormData({ ...formData, sport: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            >
                                <option value="">Choisir un sport...</option>
                                {sportsList.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                            {sportsList.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Aucun sport disponible. Contactez un administrateur.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={saving || !profile?.school} // Block if no school
                            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Enregistrement...' : 'Continuer vers le paiement'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // View: Payment
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Cotisation 2024</h1>
                <p className="text-gray-500 mb-6">Réglez votre cotisation pour valider votre inscription (École : {profile.school}, Sport : {profile.sport}).</p>

                <div className="text-4xl font-black text-indigo-600 mb-8">
                    10,00 €
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-[#D60057] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#B30048] transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? 'Redirection...' : 'Payer avec Lyf Pay'}
                </button>

                <p className="text-xs text-gray-400 mt-4">Paiement sécurisé via Lyf Pay</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Erreur de profil ? <button onClick={() => setProfile({ ...profile, school: null })} className="text-indigo-500 underline">Modifier</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
