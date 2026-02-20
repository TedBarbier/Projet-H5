import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import PoleLayoutClient from "./PoleLayoutClient";

export default async function PoleLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'USER';
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role as string);

    let poles = [];
    if (isAdmin) {
        poles = await prisma.pole.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    // @ts-ignore
    const userPoleId = session?.user?.id ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { poleId: true } }))?.poleId : null;

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
