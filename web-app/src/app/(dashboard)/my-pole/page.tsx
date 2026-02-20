import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import ConversationList from "@/components/Chat/ConversationList";
import NewChatButton from "@/components/Chat/NewChatButton";
import { redirect } from "next/navigation";

export default async function PoleDashboard({
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
        include: { pole: true }
    });

    let poleId = user?.pole?.id;
    let poleName = user?.pole?.name;

    // Admin Override
    // @ts-ignore
    const role = session.user.role;
    const isGlobalAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role);

    const params = await searchParams;
    const viewPoleId = params.viewPole as string;

    if (isGlobalAdmin && viewPoleId) {
        const viewedPole = await prisma.pole.findUnique({ where: { id: viewPoleId } });
        if (viewedPole) {
            poleId = viewedPole.id;
            poleName = viewedPole.name;
        }
    }

    if (!poleId) {
        if (isGlobalAdmin) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-xl mb-4">⬅️ Veuillez sélectionner un pôle dans le menu.</p>
                </div>
            )
        }
        return null;
    }

    // Fetch summary stats
    const taskCount = await prisma.poleTask.count({ where: { poleId: poleId, status: { not: 'DONE' } } });
    const nextMeeting = await prisma.poleMeeting.findFirst({
        where: { poleId: poleId, startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' }
    });

    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-gray-900">
                        {isGlobalAdmin && viewPoleId ? `Vue Admin: ${poleName}` : `Bonjour, ${user?.name?.split(' ')[0]} 👋`}
                    </h1>
                </div>
                {!isGlobalAdmin && <p className="text-gray-500 mt-2">Voici ce qu'il se passe dans le pôle <strong>{poleName}</strong>.</p>}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold">
                        {taskCount}
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Tâches en cours</div>
                        <div className="text-gray-900 font-bold">À traiter rapidement</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold">
                        📅
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Prochaine Réunion</div>
                        <div className="text-gray-900 font-bold">
                            {nextMeeting ? new Date(nextMeeting.startTime).toLocaleDateString() : 'Aucune prévue'}
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">💬 Discussions</h2>
                        <a href="/my-pole/discussions" className="text-sm text-blue-600 font-bold hover:underline">Accéder au chat →</a>
                    </div>
                </div>
            </div> */}
        </div>
    );
}
