import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ConversationList from "@/components/Chat/ConversationList";
import NewChatButton from "@/components/Chat/NewChatButton";

export default async function ChatsPage() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) redirect('/');

    return (
        <div className="p-4 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">💬 Discussions</h1>
                <NewChatButton />
            </div>

            <ConversationList />
        </div>
    );
}
