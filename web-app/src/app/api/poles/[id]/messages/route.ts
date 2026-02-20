import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// GET /api/poles/[id]/messages
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;

    const messages = await prisma.poleMessage.findMany({
        where: { poleId: id },
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' }, // Oldest first for chat history
        take: 50 // Limit initial load
    });

    return NextResponse.json(messages);
}

// POST /api/poles/[id]/messages
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    try {
        const message = await prisma.poleMessage.create({
            data: {
                content,
                poleId: id,
                // @ts-ignore
                authorId: session.user.id
            },
            include: { author: { select: { id: true, name: true, image: true } } }
        });

        // Broadcast to WebSocket via Redis
        const payload = {
            type: 'pole_message',
            poleId: id,
            payload: message
        };
        await redis.publish('events-updates', JSON.stringify(payload));

        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json({ error: 'Send failed' }, { status: 500 });
    }
}
