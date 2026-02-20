
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId, status } = body; // status: 'PAID' or 'PENDING' (to revoke)

        if (!userId || !status) {
            return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
        }

        if (status === 'PAID') {
            // Check if user already has a PAID payment
            const existingPaid = await prisma.payment.findFirst({
                where: { userId, status: 'PAID' }
            });

            if (!existingPaid) {
                // Create a manual payment record
                await prisma.payment.create({
                    data: {
                        userId,
                        amount: 1000, // 10 EUR default for manual
                        currency: 'EUR',
                        status: 'PAID',
                        lyfId: 'MANUAL_' + Date.now() // Mock ID
                    }
                });
            }
        } else if (status === 'PENDING' || status === 'CANCELLED') {
            // Revoke all PAID payments (or set them to CANCELLED)
            await prisma.payment.updateMany({
                where: { userId, status: 'PAID' },
                data: { status: 'CANCELLED' } // Better to cancel than delete
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Payment update error:", error);
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }
}
