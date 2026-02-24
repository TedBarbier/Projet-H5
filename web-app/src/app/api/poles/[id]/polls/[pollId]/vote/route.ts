import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function POST(req: Request, { params }: { params: Promise<{ id: string, pollId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poleId, pollId } = await params;

    try {
        const body = await req.json();
        const { optionId } = body;

        if (!optionId) {
            return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
        }

        // Check if poll exists and belongs to the pole
        const poll = await prisma.polePoll.findFirst({
            where: { id: pollId, poleId }
        });

        if (!poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        // Check if option belongs to poll
        const option = await prisma.polePollOption.findFirst({
            where: { id: optionId, pollId }
        });

        if (!option) {
            return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
        }

        // Upsert vote (only one vote per user per poll)
        // Prisma's upsert needs a unique identifier for the where clause: [userId, pollId]
        const vote = await prisma.polePollVote.upsert({
            where: {
                userId_pollId: {
                    userId: session.user.id,
                    pollId: pollId
                }
            },
            update: {
                optionId
            },
            create: {
                userId: session.user.id,
                pollId,
                optionId
            }
        });

        return NextResponse.json(vote);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to vote', details: error.message }, { status: 500 });
    }
}
