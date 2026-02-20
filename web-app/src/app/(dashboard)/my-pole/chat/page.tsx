import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Chat from "@/components/pole/Chat";
import { redirect } from "next/navigation";

export default async function ChatPage({
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
        select: { poleId: true, role: true }
    });

    let poleId = user?.poleId;

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
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">💬 Discussion</h1>
            <div className="flex-1">
                <Chat poleId={poleId} />
            </div>
        </div>
    );
}
