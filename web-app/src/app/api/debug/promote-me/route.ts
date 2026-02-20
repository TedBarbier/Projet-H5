
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    try {
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { role: 'SUPER_ADMIN' }
        });

        return NextResponse.json({
            message: `User ${user.email} promoted to SUPER_ADMIN`,
            user: { name: user.name, role: user.role }
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to promote user', details: error.message }, { status: 500 });
    }
}
