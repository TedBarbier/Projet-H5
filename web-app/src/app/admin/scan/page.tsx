'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function AdminScanPage() {
    const [tokenInput, setTokenInput] = useState('')
    const [scanResult, setScanResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [isMealActive, setIsMealActive] = useState(false)
    const [recentScans, setRecentScans] = useState<any[]>([])

    // Camera State
    const [showCamera, setShowCamera] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    const scannerRef = useRef<Html5Qrcode | null>(null)
    const isProcessingRef = useRef(false) // Lock to prevent multi-scan

    useEffect(() => {
        fetchData()

        // Poll every 5 seconds to keep devices in sync
        const interval = setInterval(fetchData, 5000);

        // Cleanup on unmount
        return () => {
            clearInterval(interval);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Create clear", err));
            }
        };
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/scan')
            if (res.ok) {
                const data = await res.json()
                setIsMealActive(data.settings?.isMealActive || false)
                setRecentScans(data.recentScans || [])
            }
        } catch (e) {
            console.error("Failed to fetch data", e)
        }
    }

    const startScanner = async () => {
        console.log("Starting scanner...");
        setShowCamera(true); // Ensure UI container exists
        setCameraError(null);
        isProcessingRef.current = false; // Reset lock

        try {
            // Need a slight delay for React to render the div "reader"
            setTimeout(async () => {
                try {
                    // Check if element exists
                    if (!document.getElementById("reader")) {
                        throw new Error("Element 'reader' introuvable");
                    }

                    // If a scanner instance already exists, clear it first
                    if (scannerRef.current) {
                        try { await scannerRef.current.clear(); } catch (e) { }
                    }

                    const scanner = new Html5Qrcode("reader");
                    scannerRef.current = scanner;

                    await scanner.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        (decodedText) => {
                            // Check lock
                            if (isProcessingRef.current) return;
                            isProcessingRef.current = true;

                            console.log("Scan success:", decodedText);
                            stopScanner();
                            submitScan(decodedText);
                        },
                        (errorMessage) => {
                            // parse error, ignore
                        }
                    );
                    setIsScanning(true);
                } catch (err: any) {
                    console.error("Camera start error:", err);
                    let msg = "Impossible d'accéder à la caméra.";

                    if (err?.name === "NotAllowedError") msg = "Permission refusée. Vérifiez les réglages.";
                    else if (err?.name === "NotFoundError") msg = "Aucune caméra trouvée.";
                    else if (err?.name === "NotReadableError") msg = "Caméra occupée ou inaccessible.";
                    else if (err?.message?.includes("streaming not supported") || err?.name === "NotSupportedError") msg = "Navigateur non-sécurisé (HTTP). Utilisez HTTPS ou localhost.";
                    else if (typeof err === 'string') msg = err;

                    setCameraError(`${msg} (${err?.name || 'Erreur inconnue'})`);
                    setIsScanning(false);
                    setShowCamera(false);
                }
            }, 300);
        } catch (e) {
            console.error("Scanner init error", e);
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                // We don't check isScanning here strictly because we want to force stop
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error("Stop failed", err);
            }
        }
        setIsScanning(false);
        setShowCamera(false);
    }

    const toggleMealActive = async () => {
        const newState = !isMealActive
        setIsMealActive(newState) // Optimistic update
        try {
            const res = await fetch('/api/admin/scan', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMealActive: newState })
            })
            if (!res.ok) {
                console.error("Toggle failed, reverting");
                setIsMealActive(!newState);
            } else {
                fetchData(); // Refresh to be sure
            }
        } catch (e) {
            console.error("Toggle network error", e);
            setIsMealActive(!newState);
        }
    }

    const submitScan = async (token: string) => {
        setTokenInput(token) // for display
        setLoading(true)
        setScanResult(null)

        try {
            const res = await fetch('/api/admin/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            })

            const data = await res.json()
            setScanResult(data)
            fetchData() // Refresh list

        } catch (error) {
            setScanResult({ valid: false, message: 'Erreur réseau' })
        } finally {
            setLoading(false)
        }
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitScan(tokenInput)
    }

    const resetScan = () => {
        setScanResult(null)
        setTokenInput('')
        startScanner();
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex justify-between items-center">
                <span>Scanner Repas</span>
                <button
                    onClick={toggleMealActive}
                    className={`text-sm px-4 py-2 rounded-full font-bold ${isMealActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                    {isMealActive ? '🟢 Service Ouvert' : '🔴 Service Fermé'}
                </button>
            </h1>

            {!isMealActive && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700 font-bold">Le service est fermé.</p>
                    <p className="text-red-600 text-sm">Les scans seront refusés. Activez le service ci-dessus pour commencer.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Scanner */}
                <div className="space-y-6">

                    {/* Camera Scanner */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">📷 Caméra Mobile</h2>

                        {/* Security Warning (Local IP) */}
                        {typeof window !== 'undefined' && !window.isSecureContext && (
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
                                <h4 className="font-bold">⚠️ Accès Caméra Bloqué (Sécurité)</h4>
                                <p className="mt-1">
                                    Les navigateurs bloquent la caméra un site non-sécurisé (HTTP).
                                    Pour scanner depuis votre téléphone :
                                </p>
                                <ul className="list-disc ml-4 mt-2">
                                    <li>Utilisez <strong>HTTPS</strong> si possible.</li>
                                    <li>Ou connectez-vous via <strong>localhost</strong> sur le même appareil.</li>
                                    <li>Sinon, utilisez une <strong>douchette USB</strong> ou saisissez le code manuellement ci-dessous.</li>
                                </ul>
                            </div>
                        )}

                        {/* Error Message */}
                        {cameraError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {cameraError}
                            </div>
                        )}

                        {showCamera ? (
                            <div className="space-y-4">
                                <div id="reader" className="w-full bg-black min-h-[300px]"></div>
                                <button
                                    onClick={stopScanner}
                                    className="w-full bg-gray-500 text-white py-2 rounded"
                                >
                                    Fermer la caméra
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startScanner}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition"
                                disabled={!isMealActive}
                            >
                                📷 Ouvrir le Scanner
                            </button>
                        )}

                        {/* Result Display */}
                        {scanResult && (
                            <div className={`mt-6 p-6 rounded-lg shadow-inner text-center ${scanResult.allowed ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                                <div className="text-6xl mb-2">{scanResult.allowed ? '✅' : '⛔️'}</div>
                                <h3 className={`text-xl font-bold ${scanResult.allowed ? 'text-green-800' : 'text-red-800'}`}>
                                    {scanResult.message}
                                </h3>
                                {scanResult.user && (
                                    <div className="mt-2 bg-white/60 p-2 rounded">
                                        <p className="font-bold">{scanResult.user.name}</p>
                                        <p className="text-sm opacity-75">{scanResult.user.school}</p>
                                    </div>
                                )}
                                <button
                                    onClick={resetScan}
                                    className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-gray-800"
                                >
                                    Scanner le suivant
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Manual Input (Fallback) */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-gray-500 text-sm font-semibold mb-2 uppercase">Scan Manuel / Douchette</h2>
                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 rounded-md border-gray-300 shadow-sm border p-2 font-mono text-sm"
                                placeholder="Token..."
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                disabled={!isMealActive}
                            />
                            <button
                                type="submit"
                                disabled={loading || !isMealActive}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                OK
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">🕒 Historique (10 derniers)</h2>
                        <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Rafraîchir</button>
                    </div>

                    <div className="space-y-3">
                        {recentScans.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-bold text-gray-900">{log.user?.name || "Inconnu"}</p>
                                    <p className="text-xs text-gray-500">{log.user?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono text-gray-600">
                                        {new Date(log.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Validé</span>
                                </div>
                            </div>
                        ))}
                        {recentScans.length === 0 && (
                            <p className="text-gray-500 italic text-center py-4">Aucun scan récent.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
