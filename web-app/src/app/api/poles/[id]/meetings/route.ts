import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// GET /api/poles/[id]/meetings
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;

    const meetings = await prisma.poleMeeting.findMany({
        where: { poleId: id },
        orderBy: { startTime: 'asc' }
    });

    return NextResponse.json(meetings);
}

// POST /api/poles/[id]/meetings
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { title, description, startTime, endTime } = body;

    try {
        const meeting = await prisma.poleMeeting.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                poleId: id
            }
        });
        return NextResponse.json(meeting);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
    }
}
