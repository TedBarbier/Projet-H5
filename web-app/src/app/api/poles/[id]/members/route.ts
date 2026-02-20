import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        // Fetch users who have a membership OR are assigned to the pole (via User.poleId)
        // Usually pole members have User.poleId set.
        // Let's check both just in case.
        const members = await prisma.user.findMany({
            where: {
                OR: [
                    { poleId: id },
                    { memberships: { some: { poleId: id } } }
                ]
            },
            select: {
                id: true,
                name: true,
                image: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(members);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}
