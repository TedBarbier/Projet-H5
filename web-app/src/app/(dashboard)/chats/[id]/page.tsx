import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import ChatWindow from "@/components/Chat/ChatWindow";
import { redirect } from "next/navigation";

export default async function ChatPage({
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
        <div className="h-[calc(100vh-80px)] p-4 pb-20 flex flex-col">
            <ChatWindow conversationId={id} conversationName={conversationName || 'Discussion'} />
        </div>
    );
}
