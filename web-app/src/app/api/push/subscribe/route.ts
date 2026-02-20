import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const subscription = await req.json();

        // Save or update subscription in DB
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: session.user.id
            },
            create: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Push Subscription Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
