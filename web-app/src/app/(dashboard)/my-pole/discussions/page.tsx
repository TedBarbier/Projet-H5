import ConversationList from "@/components/Chat/ConversationList";
import NewChatButton from "@/components/Chat/NewChatButton";

export default function PoleDiscussionsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Discussions du Pôle</h1>
                    <p className="text-gray-500 text-sm">Échangez avec votre équipe et les autres pôles.</p>
                </div>
                <NewChatButton />
            </div>

            <ConversationList basePath="/my-pole/discussions" />
        </div>
    )
}
