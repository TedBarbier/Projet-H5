'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

export default function ClientNavLink({
    href,
    icon,
    children
}: {
    href: string,
    icon: string,
    children: React.ReactNode
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const viewPole = searchParams.get('viewPole');

    let finalHref = href;
    if (viewPole) {
        // Append viewPole param
        const separator = href.includes('?') ? '&' : '?';
        finalHref = `${href}${separator}viewPole=${viewPole}`;
    }

    const isActive = pathname === href;

    return (
        <Link
            href={finalHref}
            className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <span className="text-xl">{icon}</span>
            <span>{children}</span>
        </Link>
    );
}
