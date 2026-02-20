import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 for bottom nav space */}
            {children}
            <BottomNav />
        </div>
    )
}
