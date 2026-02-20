import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true } } }
        });
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { title, content } = await req.json();

        // 1. Save to DB
        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                authorId: session.user.id
            },
            include: { author: { select: { name: true } } }
        });

        // 2. Broadcast via Redis
        const message = {
            type: 'announcement',
            payload: {
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                author: announcement.author.name,
                timestamp: announcement.createdAt.toISOString()
            }
        };
        await redis.publish('events-updates', JSON.stringify(message));

        return NextResponse.json(announcement);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) { // Only Admin can delete
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.announcement.delete({ where: { id } });

        // Optional: Broadcast delete event to remove from feed?
        // For now, simpler to just let it persist on client until refresh.

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
