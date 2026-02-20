import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Fetch matches that are LIVE or recently finished (e.g., last 2 hours)
        // For now, let's just fetch LIVE matches to keep it simple for the ticker
        const liveMatches = await prisma.match.findMany({
            where: {
                status: 'LIVE'
            },
            select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                homeScore: true,
                awayScore: true,
                status: true,
                sport: true,
                eventId: true
            }
        });

        // Map to the format expected by the frontend
        const formatted = liveMatches.map(m => ({
            matchId: m.id,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            sport: m.sport
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch live matches:", error);
        return NextResponse.json({ error: 'Failed to fetch live matches' }, { status: 500 });
    }
}
