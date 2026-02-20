import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { LyfPayService } from "@/lib/lyfpay";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const mock = searchParams.get('mock');

    if (!orderId) {
        return new NextResponse("Missing orderId", { status: 400 });
    }

    try {
        // In valid integration, we would verify signature or call API to check status
        // For now, if mock=true, we trust the param status (Development only)

        let newStatus = 'PENDING';

        if (mock === 'true' && status === 'PAID') {
            newStatus = 'PAID';
        } else {
            // Real verification
            // const verification = await LyfPayService.verifyPayment(orderId);
            // newStatus = verification.status;
        }

        await prisma.payment.update({
            where: { id: orderId },
            data: {
                status: newStatus === 'PAID' ? 'PAID' : 'FAILED'
            }
        });

        // Redirect user to success or failure page
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = req.headers.get('host');

        if (newStatus === 'PAID') {
            return NextResponse.redirect(`${protocol}://${host}/payment/success`);
        } else {
            return NextResponse.redirect(`${protocol}://${host}/payment/failed`);
        }

    } catch (error) {
        console.error("Payment callback error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
