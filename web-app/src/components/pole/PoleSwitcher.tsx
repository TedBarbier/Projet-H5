'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type Pole = {
    id: string
    name: string
}

export default function PoleSwitcher({ poles, currentPoleId }: { poles: Pole[], currentPoleId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const viewPole = searchParams.get('viewPole');
    const activePoleId = viewPole || currentPoleId;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (selectedId) {
            params.set('viewPole', selectedId);
        } else {
            params.delete('viewPole');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Voir en tant que</label>
            <select
                value={activePoleId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
                <option value="">-- Sélectionner un Pôle --</option>
                {poles.map(pole => (
                    <option key={pole.id} value={pole.id}>{pole.name}</option>
                ))}
            </select>
        </div>
    );
}
