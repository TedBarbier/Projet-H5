'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminNav({ role }: { role: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { data: session } = useSession()

    const isGlobalAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role);
    // @ts-ignore
    const memberships = session?.user?.memberships || [];
    const hasPerm = (perm: string) => isGlobalAdmin || memberships.some((m: any) => m.permissions && m.permissions[perm]);

    const toggle = () => setIsOpen(!isOpen)

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Admin Panel</h2>
                <button onClick={toggle} className="p-2 border rounded border-gray-600 focus:outline-none focus:bg-gray-800 text-white">
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Sidebar / Drawer */}
            <aside className={`
                bg-gray-900 text-white p-6 w-64 space-y-4
                fixed md:static top-0 bottom-0 left-0 z-40 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex justify-between items-center md:block mb-8">
                    <h2 className="text-2xl font-bold hidden md:block">Admin Panel</h2>
                    {/* Close button for mobile inside drawer */}
                    <button onClick={toggle} className="md:hidden text-gray-400 hover:text-white">Fermer</button>
                </div>

                <nav className="space-y-4">
                    <>
                        <NavItem href="/admin" label="🏠 Dashboard" active={pathname === '/admin'} onClick={toggle} />
                        {(isGlobalAdmin || hasPerm('canManageAnnouncements')) &&
                            <NavItem href="/admin/announcements" label="📢 Annonces" active={pathname.startsWith('/admin/announcements')} onClick={toggle} />
                        }
                        {(isGlobalAdmin || hasPerm('canManageMatches')) &&
                            <NavItem href="/admin/matches" label="⚽️ Matchs & Score" active={pathname.startsWith('/admin/matches')} className="text-red-300" onClick={toggle} />
                        }
                        {(isGlobalAdmin || hasPerm('canManageUsers')) &&
                            <NavItem href="/admin/sports" label="🏅 Sports" active={pathname.startsWith('/admin/sports')} className="text-blue-300" onClick={toggle} />
                        }
                        {(isGlobalAdmin || hasPerm('canManageScanner')) &&
                            <NavItem href="/admin/scan" label="📷 Scanner" active={pathname.startsWith('/admin/scan')} onClick={toggle} />
                        }
                        {(isGlobalAdmin || hasPerm('canManageSchedule')) &&
                            <NavItem href="/admin/schedule" label="📅 Planning & Lieux" active={pathname.startsWith('/admin/schedule')} onClick={toggle} />
                        }
                    </>

                    {/* Poles Visible to Resp & Admins */}
                    <div className="border-t border-gray-700 pt-4">
                        <NavItem href="/admin/poles" label="🎯 Pôles" active={pathname.startsWith('/admin/poles')} onClick={toggle} />
                    </div>

                    {(isGlobalAdmin || role === 'POLE_RESP' || memberships.some((m: any) => m.role === 'RESP')) && (
                        <NavItem href="/admin/users" label="👥 Utilisateurs" active={pathname.startsWith('/admin/users')} className="text-yellow-300" onClick={toggle} />
                    )}

                    <div className="border-t border-gray-700 my-4 pt-4">
                        <a href="/my-pole" className="block py-2 px-4 hover:bg-gray-800 rounded text-purple-400 font-bold">🏠 Mon Pôle</a>
                    </div>

                    <a href="/feed" className="block py-2 px-4 hover:bg-gray-800 rounded text-gray-400 mt-8">← Retour App</a>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={toggle}
                />
            )}
        </>
    )
}

function NavItem({ href, label, active, onClick, className = '' }: { href: string, label: string, active?: boolean, onClick?: () => void, className?: string }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block py-2 px-4 rounded transition-colors ${active ? 'bg-gray-800 text-white' : 'hover:bg-gray-800 text-gray-300'} ${className}`}
        >
            {label}
        </Link>
    )
}
