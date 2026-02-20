import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import ChatWindow from "@/components/Chat/ChatWindow";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PoleChatPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) redirect('/');

    const { id } = await params;

    // Fetch conversation details for the header
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            pole: { select: { name: true } },
            participants: {
                include: { user: { select: { name: true } } }
            }
        }
    });

    if (!conversation) {
        return <div className="p-4 text-center">Conversation introuvable.</div>;
    }

    // Determine display name
    let conversationName = conversation.name;
    if (!conversationName) {
        if (conversation.type === 'POLE' && conversation.pole) {
            conversationName = `Pôle ${conversation.pole.name}`;
        } else {
            // Join names of other participants (excluding self)
            // @ts-ignore
            const others = conversation.participants.filter(p => p.user.id !== session.user.id);
            conversationName = others.length > 0
                // @ts-ignore
                ? others.map(p => p.user.name).join(', ')
                // @ts-ignore
                : 'Moi (Note personelle)';
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="mb-2">
                <Link href="/my-pole/discussions" className="text-sm text-gray-500 hover:text-gray-800">
                    ← Retour aux discussions
                </Link>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <ChatWindow conversationId={id} conversationName={conversationName || 'Discussion'} />
            </div>
        </div>
    );
}
