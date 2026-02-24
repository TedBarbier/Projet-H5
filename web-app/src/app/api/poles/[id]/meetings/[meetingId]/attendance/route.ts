import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

// Get all attendances for a meeting
export async function GET(req: Request, { params }: { params: Promise<{ id: string, meetingId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poleId, meetingId } = await params;

    try {
        const attendances = await prisma.poleMeetingAttendance.findMany({
            where: { meetingId, meeting: { poleId } },
            include: { user: { select: { id: true, name: true, image: true, role: true } } }
        });

        return NextResponse.json(attendances);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch attendances', details: error.message }, { status: 500 });
    }
}

// Update own attendance
export async function POST(req: Request, { params }: { params: Promise<{ id: string, meetingId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poleId, meetingId } = await params;

    try {
        const body = await req.json();
        const { status } = body; // PENDING, PRESENT, ABSENT

        if (!['PENDING', 'PRESENT', 'ABSENT'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify meeting exists in this pole
        const meeting = await prisma.poleMeeting.findFirst({
            where: { id: meetingId, poleId }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const attendance = await prisma.poleMeetingAttendance.upsert({
            where: {
                userId_meetingId: {
                    userId: session.user.id,
                    meetingId
                }
            },
            update: { status },
            create: {
                userId: session.user.id,
                meetingId,
                status
            }
        });

        return NextResponse.json(attendance);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update attendance', details: error.message }, { status: 500 });
    }
}
