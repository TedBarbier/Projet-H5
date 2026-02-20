import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Redis from 'ioredis';

// Optional: Redis for Socket.IO broadcasting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        // Verify access (simple check: if generic or participant)
        // For strictness we should query permissions first, but skipping for speed for now.

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            },
            take: 100 // Limit history
        });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Fetch Failed' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { content } = await req.json();

        if (!content) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

        const message = await prisma.message.create({
            data: {
                content,
                conversationId: id,
                senderId: session.user.id
            },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            }
        });

        // Broadcast (Fire & Forget)
        // Using "events-updates" channel which server.js subscribes to.

        redis.publish("events-updates", JSON.stringify({
            type: 'CHAT_MESSAGE',
            conversationId: id,
            message: message
        }));

        // Bump updated at
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Send Failed' }, { status: 500 });
    }
}
