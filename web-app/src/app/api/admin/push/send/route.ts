import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

webpush.setVapidDetails(
    'https://172.189.176.20',
    'BAhNnVh8vY-plKPwFVbTQ90e4HSlUnFl6HmefQEwI91ZH3CjsAkx2GWPS47kgul1GBlWUcj57T-hUUthomBIjV0',
    'f96Pu6a9s7lFkKcf_UUjH4w7ZavVugP_FJIV3uB9uWY'
);

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, title, body } = await req.json();

        if (!title || !body) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        let subscriptions;
        if (userId) {
            // Send specifically to one user
            subscriptions = await prisma.pushSubscription.findMany({
                where: { userId }
            });
        } else {
            // Send to everyone (Direct broadcast - No Feed)
            subscriptions = await prisma.pushSubscription.findMany();
        }

        if (subscriptions.length === 0) {
            return NextResponse.json({ success: false, sent: 0, totalDevices: 0, error: 'User has no registered devices.' });
        }

        const pushPayload = JSON.stringify({ title, body });

        const results = await Promise.allSettled(subscriptions.map(async (sub: any) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, pushPayload);
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription expired
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
                throw error;
            }
        }));

        const successCount = results.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({ success: true, sent: successCount, totalDevices: subscriptions.length });

    } catch (error) {
        console.error("Push Error", error);
        return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
    }
}
