import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Redis from 'ioredis';
import webpush from 'web-push';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

webpush.setVapidDetails(
    'mailto:contact@projet-h5.fr',
    'BAhNnVh8vY-plKPwFVbTQ90e4HSlUnFl6HmefQEwI91ZH3CjsAkx2GWPS47kgul1GBlWUcj57T-hUUthomBIjV0',
    'f96Pu6a9s7lFkKcf_UUjH4w7ZavVugP_FJIV3uB9uWY'
);

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

        // 3. Broadcast WebPush Notifications
        try {
            const subscriptions = await prisma.pushSubscription.findMany();
            const pushPayload = JSON.stringify({
                title: `📢 ${announcement.title}`,
                body: announcement.content.length > 100 ? announcement.content.substring(0, 100) + '...' : announcement.content
            });

            // Send to all subscribers asynchronously
            Promise.all(subscriptions.map(async (sub: any) => {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, pushPayload);
                } catch (error: any) {
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        console.log('Subscription has expired or is no longer valid: ', error);
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    } else {
                        console.error('Error sending push notification: ', error);
                    }
                }
            })).catch(err => console.error("Batch push error", err));
        } catch (pushError) {
            console.error("WebPush broadcast failed (maybe table missing?), but announcement was saved:", pushError);
        }

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
