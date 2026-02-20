import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
            }
        });
        return NextResponse.json(locations);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
}
