
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, poleId, role } = await req.json();

        if (!userId || !poleId || !role) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const membership = await prisma.poleMembership.upsert({
            where: {
                userId_poleId: { userId, poleId }
            },
            update: { role },
            create: { userId, poleId, role }
        });

        return NextResponse.json(membership);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to add membership', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const poleId = searchParams.get('poleId');

        if (!userId || !poleId) {
            return NextResponse.json({ error: 'Missing userId or poleId' }, { status: 400 });
        }

        await prisma.poleMembership.delete({
            where: {
                userId_poleId: { userId, poleId }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to remove membership', details: error.message }, { status: 500 });
    }
}
