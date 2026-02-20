import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    // Public Endpoint - No Auth Check needed (or lightweight rate limiting in future)
    try {
        const events = await prisma.event.findMany({
            orderBy: { startTime: 'asc' },
            include: {
                location: { select: { name: true, address: true } },
                match: { select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, status: true, sport: true } }
            }
        });

        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
