'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle auto-fit bounds
function BoundsFitter({ locations }: { locations: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (!locations || locations.length === 0) return;

        const bounds = L.latLngBounds(locations.map(loc => [parseFloat(loc.lat), parseFloat(loc.lng)]));

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, locations]);

    return null;
}

// Create a component that can handle the map
export default function Map({ locations }: { locations: any[] }) {
    // Default center (France) - used only if no locations
    const defaultPosition: [number, number] = [46.603354, 1.888334]

    // Debug loop to check data
    useEffect(() => {
        console.log("Map received locations:", locations);
    }, [locations]);

    if (typeof window === 'undefined') return null;

    const validLocations = (Array.isArray(locations) ? locations : []).filter(loc => {
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lng);
        return !isNaN(lat) && !isNaN(lng);
    });

    return (
        <MapContainer center={defaultPosition} zoom={6} style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '8px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <BoundsFitter locations={validLocations} />

            {validLocations.map((loc) => (
                <Marker key={loc.id} position={[parseFloat(loc.lat), parseFloat(loc.lng)]}>
                    <Popup>
                        <strong>{loc.name}</strong> <br />
                        {loc.address && <span className="text-gray-500 text-sm">{loc.address}</span>}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
