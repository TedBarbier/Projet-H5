import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poleId } = await params;

    try {
        const polls = await prisma.polePoll.findMany({
            where: { poleId },
            include: {
                creator: { select: { id: true, name: true, image: true } },
                options: {
                    include: {
                        _count: { select: { votes: true } },
                        votes: { select: { userId: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add a field indicating if the user has voted
        const formattedPolls = polls.map(poll => {
            const hasVoted = poll.options.some(opt => opt.votes.some(v => v.userId === session.user.id));
            return {
                ...poll,
                hasVoted
            };
        });

        return NextResponse.json(formattedPolls);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch polls', details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poleId } = await params;

    try {
        const body = await req.json();
        const { title, description, options } = body;

        if (!title || !options || !Array.isArray(options) || options.length < 2) {
            return NextResponse.json({ error: 'Title and at least 2 options are required' }, { status: 400 });
        }

        const poll = await prisma.polePoll.create({
            data: {
                title,
                description,
                poleId,
                creatorId: session.user.id,
                options: {
                    create: options.map((opt: string) => ({ text: opt }))
                }
            },
            include: { options: true }
        });

        return NextResponse.json(poll);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create poll', details: error.message }, { status: 500 });
    }
}
