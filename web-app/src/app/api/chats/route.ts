import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = session.user.id;

        // Fetch User's Pole ID to include Pole-based conversations
        // @ts-ignore
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { poleId: true } });
        const userPoleId = user?.poleId;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { participants: { some: { userId } } }, // Direct participation
                    userPoleId ? { poleId: userPoleId } : {}, // Pole-based access
                    // Optional: Public/General conversations?
                    // { type: 'GROUP', poleId: null, participants: { none: {} } } // If we had a "public" flag
                ]
            },
            include: {
                pole: { select: { name: true, color: true } },
                participants: {
                    include: {
                        user: { select: { name: true, image: true } }
                    },
                    take: 3
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(conversations);
    } catch (error: any) {
        console.error("Chats List Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, type, poleId, participantIds, targetPoleIds } = await req.json();

        let allParticipantIds = new Set<string>();

        // Add creator
        // @ts-ignore
        allParticipantIds.add(session.user.id);

        // Add direct participants
        if (participantIds && Array.isArray(participantIds)) {
            participantIds.forEach((id: string) => allParticipantIds.add(id));
        }

        // Add members from target poles if specified
        if (targetPoleIds && Array.isArray(targetPoleIds) && targetPoleIds.length > 0) {
            const poleMembers = await prisma.poleMembership.findMany({
                where: { poleId: { in: targetPoleIds } },
                select: { userId: true }
            });
            poleMembers.forEach(m => allParticipantIds.add(m.userId));
        }

        // Create Conversation
        const conversation = await prisma.conversation.create({
            data: {
                name,
                type: type || 'GROUP',
                poleId: poleId || undefined,
                participants: {
                    create: Array.from(allParticipantIds).map(uid => ({ userId: uid }))
                }
            }
        });

        return NextResponse.json(conversation);
    } catch (error: any) {
        console.error("Chat Creation Error:", error); // Added detailed logging
        return NextResponse.json({ error: 'Creation Failed', details: error.message }, { status: 500 });
    }
}
