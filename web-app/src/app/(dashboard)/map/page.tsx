'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function MapPage() {
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/locations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLocations(data)
                } else {
                    console.error("Map data is not an array:", data);
                    setLocations([])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLocations([])
                setLoading(false)
            })
    }, [])

    return (
        <div className="p-4 flex flex-col h-[calc(100vh-80px)]">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Carte des Événements</h1>

            <div className="flex-1 bg-white rounded-lg shadow border p-2 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                        Chargement de la carte...
                    </div>
                ) : (
                    <Map locations={locations} />
                )}
            </div>

            <p className="mt-4 text-center text-gray-600 text-sm">
                Retrouvez ici la localisation de toutes les épreuves et lieux de restauration.
            </p>
        </div>
    )
}
