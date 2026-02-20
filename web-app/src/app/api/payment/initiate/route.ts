import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { LyfPayService } from "@/lib/lyfpay";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { amount, currency = "EUR" } = body; // Amount in cents

        // Create pending payment record
        const payment = await prisma.payment.create({
            data: {
                userId: session.user.id,
                amount: amount,
                currency: currency,
                status: "PENDING"
            }
        });

        // Determine callback URL (this API's host + /api/payment/callback)
        // In prod, use env var. In dev, localhost.
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = req.headers.get('host');
        const callbackUrl = `${protocol}://${host}/api/payment/callback`;

        // Initiate LyfPay flow
        const redirectUrl = await LyfPayService.initiatePayment(amount, payment.id, callbackUrl);

        return NextResponse.json({ url: redirectUrl });

    } catch (error: any) {
        console.error("Payment initiation error:", error);
        return new NextResponse(`Internal Error: ${error.message || error}`, { status: 500 });
    }
}
