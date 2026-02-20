import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ],
                // Exclude self
                NOT: { id: session.user.id }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                school: true
            },
            take: 10
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Search Failed' }, { status: 500 });
    }
}
