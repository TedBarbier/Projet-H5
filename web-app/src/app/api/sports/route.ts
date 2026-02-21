
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { hasPermission } from '@/lib/authUtils';

// GET: List all available sports
export async function GET() {
    try {
        const sports = await prisma.sportList.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(sports);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
    }
}

// POST: Add a new sport (Admin only, or initial seed)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role as string | undefined;
    const canManageUsers = await hasPermission('canManageUsers');

    if (!session || (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '') && !canManageUsers)) {
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const sport = await prisma.sportList.create({
            data: { name }
        });
        return NextResponse.json(sport);
    } catch (error: any) {
        console.error("Error creating sport:", error);
        return NextResponse.json({
            error: 'Failed to create sport',
            details: error.message
        }, { status: 500 });
    }
}
