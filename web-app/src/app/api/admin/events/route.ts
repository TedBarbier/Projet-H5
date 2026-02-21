import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

import { hasPermission } from '@/lib/authUtils';

async function checkAuth() {
    return await hasPermission('canManageSchedule');
}

export async function GET(req: Request) {
    // Public access might be needed for the Feed, but this is the Admin API
    // We'll keep it protected. The public schedule uses different logic (or we reuse this if public)
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const events = await prisma.event.findMany({
        orderBy: { startTime: 'asc' },
        include: { location: true, pole: true } // Fetch relations
    });
    return NextResponse.json(events);
}

export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const body = await req.json();
        const { title, description, startTime, endTime, locationId, poleId } = body;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                locationId: locationId || undefined,
                poleId: poleId || undefined
            }
        });
        return NextResponse.json(event);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
