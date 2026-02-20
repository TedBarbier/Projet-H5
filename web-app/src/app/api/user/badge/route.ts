import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { createHmac } from 'crypto';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a time-limited token (valid for 30s window)
    const timestamp = Math.floor(Date.now() / 30000); // 30s precision
    const payload = `${session.user.id}:${timestamp}`;
    const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";

    // Sign the payload
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    const token = `${payload}:${signature}`;

    return NextResponse.json({ token });
}
