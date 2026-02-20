import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const poles = await prisma.pole.findMany({
            select: {
                id: true,
                name: true,
                color: true,
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(poles);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch poles' }, { status: 500 });
    }
}
