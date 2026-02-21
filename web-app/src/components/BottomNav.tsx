'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function BottomNav() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const navItems = [
        { name: 'Fil d\'actu', href: '/feed', icon: '📰' },
        { name: 'Planning', href: '/schedule', icon: '📅' },
        { name: 'Carte', href: '/map', icon: '🗺️' },
        { name: 'Profil', href: '/profile', icon: '👤' },
    ]

    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const memberships = session?.user?.memberships || [];
    const hasPole = !!session?.user?.poleId || memberships.length > 0;
    const hasStaffOrRespMembership = memberships.some((m: any) => ["STAFF", "RESP"].includes(m.role));

    // Add "Mon Pôle" for Staff, Resps, Admins, and Pole Members with STAFF/RESP roles
    if ((["SUPER_ADMIN", "ADMIN", "POLE_RESP", "STAFF"].includes(role || '') || hasStaffOrRespMembership) && hasPole) {
        navItems.push({ name: 'Mon Pôle', href: '/my-pole/tasks', icon: '⛺' })
    }

    // Check if user has any administrative granular permissions via their pole memberships
    const hasGranularAdminPerms = memberships.some((m: any) =>
        m.permissions && (
            m.permissions.canManageAnnouncements ||
            m.permissions.canManageUsers ||
            m.permissions.canManageSchedule ||
            m.permissions.canManageMatches ||
            m.permissions.canManageScanner
        )
    );

    // Add Admin panel only for Admins, or Staff/Resps WITH granular permissions
    if (["SUPER_ADMIN", "ADMIN"].includes(role || '') || hasGranularAdminPerms) {
        navItems.push({ name: 'Admin', href: '/admin', icon: '⚙️' })
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className={`flex justify-around items-center h-16 ${navItems.length > 4 ? 'px-2' : ''}`}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === '/admin' && pathname.startsWith('/admin'))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
