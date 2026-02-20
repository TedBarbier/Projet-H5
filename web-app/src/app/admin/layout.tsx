import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import AdminNav from "@/components/AdminNav"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    // Secure Admin Access Server-Side
    // @ts-ignore
    const role = session?.user?.role;
    if (!session || !["SUPER_ADMIN", "ADMIN", "POLE_RESP"].includes(role)) {
        redirect("/") // Redirect unauthorized users to home/feed
    }

    const isGlobalAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            <AdminNav role={role} />
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
