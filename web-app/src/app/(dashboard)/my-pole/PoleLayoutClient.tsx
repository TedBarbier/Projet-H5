'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import PoleSwitcher from '@/components/pole/PoleSwitcher'

type Pole = {
    id: string
    name: string
}

export default function PoleLayoutClient({
    children,
    poles = [],
    isAdmin = false,
    userPoleId
}: {
    children: React.ReactNode
    poles?: Pole[]
    isAdmin?: boolean
    userPoleId?: string
}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Helper to determine if a link is active
    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    // Helper to preserve viewPole param
    const getHref = (path: string) => {
        const viewPole = searchParams.get('viewPole')
        if (viewPole) {
            return `${path}?viewPole=${viewPole}`
        }
        return path
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Sidebar / Topbar for Pole Section */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 px-2">Mon Pôle</h2>
                    {isAdmin && poles.length > 0 && (
                        <div className="mt-4">
                            <PoleSwitcher poles={poles} currentPoleId={userPoleId || ''} />
                        </div>
                    )}
                </div>

                <nav className="space-y-1 flex md:block overflow-x-auto md:overflow-visible pb-2 md:pb-0 gap-2 md:gap-0">
                    <Link
                        href={getHref("/my-pole")}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${pathname === '/my-pole'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        📊 Tableau de bord
                    </Link>

                    <Link
                        href={getHref("/my-pole/discussions")}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${isActive('/my-pole/discussions')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        💬 Discussions
                    </Link>

                    <Link
                        href={getHref("/my-pole/planner")}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${isActive('/my-pole/planner')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        📅 Planning
                    </Link>

                    <Link
                        href={getHref("/my-pole/tasks")}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${isActive('/my-pole/tasks')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        ✅ Tâches
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
