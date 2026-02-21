'use client'

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [hasDismissed, setHasDismissed] = useState(false)

    useEffect(() => {
        // Run only on client
        if (typeof window === 'undefined') return;

        // Check if user dismissed the prompt previously
        const dismissed = localStorage.getItem('ios-install-prompt-dismissed') === 'true';
        setHasDismissed(dismissed);

        // Detect iOS (iPhone, iPad, iPod)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Detect if already installed / running in standalone mode
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
        setIsStandalone(isStandaloneMode);
    }, [])

    const dismissPrompt = () => {
        setHasDismissed(true);
        localStorage.setItem('ios-install-prompt-dismissed', 'true');
    }

    // Only show if: on iOS, NOT already installed, and NOT dismissed
    if (!isIOS || isStandalone || hasDismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl animate-in slide-in-from-bottom flex flex-col items-center">

            <button
                onClick={dismissPrompt}
                className="absolute top-3 right-4 text-gray-400 font-bold px-2 py-1 text-sm bg-gray-50 rounded-full"
            >
                Fermer
            </button>

            <div className="bg-red-100 p-3 rounded-2xl mb-3 mt-2 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-1 text-center">Installez l'application H5 !</h3>
            <p className="text-gray-500 text-sm text-center px-4 mb-4">
                Pour recevoir les notifications et accéder rapidement aux plannings, ajoutez H5 à votre écran d'accueil.
            </p>

            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl w-full max-w-sm justify-center mb-2">
                <span className="text-gray-500">1. Appuyez sur</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 15V3m0 0L8 7m4-4l4 4" />
                </svg>
                <span className="text-gray-500">Partager</span>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl w-full max-w-sm justify-center">
                <span className="text-gray-500">2. Sélectionnez</span>
                <span className="font-bold text-gray-800 border border-gray-200 bg-white px-2 py-1 rounded">+ Sur l'écran d'accueil</span>
            </div>

            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-white absolute -bottom-[10px] drop-shadow-md"></div>
        </div>
    )
}
