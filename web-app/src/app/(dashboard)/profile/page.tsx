'use client'

import { useSession, signOut } from "next-auth/react"
import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const [qrValue, setQrValue] = useState<string | null>(null)

    // Fetch dynamic token every 30s
    useEffect(() => {
        if (status !== 'authenticated' || !session) return;

        const fetchToken = async () => {
            try {
                const res = await fetch('/api/user/badge');
                if (res.ok) {
                    const data = await res.json();
                    setQrValue(data.token);
                }
            } catch (e) {
                console.error("Failed to fetch badge", e);
            }
        };

        fetchToken(); // Initial fetch
        const interval = setInterval(fetchToken, 30000); // Refresh every 30s

        return () => clearInterval(interval);
    }, [session, status]);

    if (status === "loading") {
        return <div className="p-8 text-center">Chargement de la session...</div>
    }

    if (status === "unauthenticated") {
        return (
            <div className="p-8 text-center">
                <p className="mb-4">Vous n'êtes pas connecté.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                >
                    Retour à l'accueil
                </button>
            </div>
        )
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-red-700 mb-8">Mon Profil</h1>

            {session?.user ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                            👤
                        </div>
                        <div>
                            <p className="font-bold text-lg">{session.user.name || 'Participant'}</p>
                            <p className="text-gray-500 text-sm">{session.user.email}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-600">École & Sport</p>
                        <p className="text-lg font-bold">
                            {(session.user as any).school?.replace(/_/g, ' ') || 'École non définie'}
                            {' - '}
                            {(session.user as any).sport || 'Sport non défini'}
                        </p>
                    </div>

                    <div className="border-t pt-6 flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Mon Badge Repas (Dynamique)</p>
                        <div className="bg-white p-2 rounded shadow-inner border relative">
                            {qrValue ? (
                                <>
                                    <QRCodeSVG value={qrValue} size={150} />
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-white"></div>
                                </>
                            ) : (
                                <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center text-gray-400">
                                    Chargement...
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Ce code change toutes les 30 secondes</p>

                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full mt-8 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition"
                    >
                        Déconnexion
                    </button>
                </div>
            ) : (
                <p>Chargement...</p>
            )}
        </div>
    )
}
