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

export async function GET(req: Request) {
    // Basic auth check to prevent abuse
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    try {
        // Fetch ALL subscriptions to rule out user-specific isolation
        const subscriptions = await prisma.pushSubscription.findMany();

        if (subscriptions.length === 0) {
            return NextResponse.json({
                error: 'ZERO SUBSCRIPTIONS FOUND',
                message: 'No devices have registered themselves yet. Ensure you clicked "Activer" on the iPhone PWA.',
                count: 0
            });
        }

        const results = [];
        const pushPayload = JSON.stringify({
            title: "📢 H5 PUSH TEST",
            body: "Ceci est un test direct du serveur Azure !"
        });

        // Test push to every single subscribed device
        for (const sub of subscriptions) {
            try {
                const webPushResult = await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, pushPayload);

                results.push({
                    subscriptionId: sub.id,
                    endpoint: sub.endpoint,
                    status: 'SUCCESS',
                    statusCode: webPushResult.statusCode,
                    headers: webPushResult.headers
                });
            } catch (err: any) {
                results.push({
                    subscriptionId: sub.id,
                    endpoint: sub.endpoint,
                    status: 'FAILED',
                    statusCode: err.statusCode,
                    message: err.message,
                    body: err.body // This contains Apple/Google's exact rejection reason
                });
            }
        }

        return NextResponse.json({
            message: `Attempted push to ${subscriptions.length} devices`,
            results
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'CRITICAL SCRIPT FAILURE',
            details: String(error)
        }, { status: 500 });
    }
}
