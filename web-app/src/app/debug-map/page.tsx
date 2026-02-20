'use client'

import { useEffect, useState } from 'react';

export default function DebugMap() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetch('/api/locations')
            .then(res => res.json())
            .then(setData)
            .catch(setError);
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Map Data</h1>
            <h2 className="text-xl font-bold mt-4">API Response (/api/locations):</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
            </pre>
            {error && (
                <div className="text-red-600 mt-4">
                    <strong>Error:</strong> {JSON.stringify(error)}
                </div>
            )}
        </div>
    );
}
