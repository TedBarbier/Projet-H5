import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Planner from "@/components/pole/Planner";
import { redirect } from "next/navigation";

export default async function PlannerPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) redirect('/');

    // @ts-ignore
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { poleId: true, role: true, memberships: { select: { poleId: true, role: true } } }
    });

    let poleId = user?.poleId;

    // Fallback to membership if primary poleId is null
    if (!poleId && user?.memberships && user.memberships.length > 0) {
        const activeMembership = user.memberships.find(m => ["STAFF", "RESP"].includes(m.role)) || user.memberships[0];
        if (activeMembership) poleId = activeMembership.poleId;
    }

    // Admin Override
    // @ts-ignore
    const role = user?.role;
    const isGlobalAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role || '');

    const params = await searchParams;
    const viewPoleId = params.viewPole as string;

    if (isGlobalAdmin && viewPoleId) {
        poleId = viewPoleId;
    }

    if (!poleId) {
        if (isGlobalAdmin) return <div className="text-center mt-10 text-gray-500">Sélectionnez un pôle.</div>
        return null;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">📅 Planning des Réunions</h1>
            <Planner poleId={poleId} />
        </div>
    );
}
