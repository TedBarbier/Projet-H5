import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import PoleLayoutClient from "./PoleLayoutClient";

export default async function PoleLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'USER';
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role as string);

    let poles: { id: string; name: string }[] = [];
    if (isAdmin) {
        poles = await prisma.pole.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    const user = session?.user?.id ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { poleId: true, memberships: { select: { poleId: true, role: true } } }
    }) : null;

    let userPoleId = user?.poleId;
    if (!userPoleId && user?.memberships && user.memberships.length > 0) {
        // Find best membership (STAFF/RESP priority, or first)
        const activeMembership = user.memberships.find(m => ["STAFF", "RESP"].includes(m.role)) || user.memberships[0];
        userPoleId = activeMembership.poleId;
    }

    return (
        <PoleLayoutClient
            poles={poles}
            isAdmin={isAdmin}
            userPoleId={userPoleId || undefined}
        >
            {children}
        </PoleLayoutClient>
    )
}
