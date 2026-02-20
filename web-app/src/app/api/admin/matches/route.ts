import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const matches = await prisma.match.findMany({
        include: { event: { include: { location: true } } },
        orderBy: { event: { startTime: 'asc' } }
    });
    return NextResponse.json(matches);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const body = await req.json();
        console.log(">> Creating Match Payload:", body);
        const { title, startTime, endTime, locationId, homeTeam, awayTeam, sport } = body;

        // Transaction: Create Event + Match
        // @ts-ignore
        const result = await prisma.$transaction(async (tx) => {
            const event = await tx.event.create({
                data: {
                    title,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    locationId: locationId || undefined,
                    type: 'match'
                }
            });

            const match = await tx.match.create({
                data: {
                    eventId: event.id,
                    homeTeam,
                    awayTeam,
                    sport,
                    status: 'SCHEDULED'
                }
            });
            return match;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id, homeScore, awayScore, status } = await req.json();

        const match = await prisma.match.update({
            where: { id },
            data: {
                homeScore,
                awayScore,
                status
            },
            include: { event: true } // for broadcast info
        });

        // Broadcast Score Update
        const message = {
            type: 'score_update',
            payload: {
                matchId: match.id,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                status: match.status,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                sport: match.sport
            }
        };
        await redis.publish('events-updates', JSON.stringify(message));

        return NextResponse.json(match);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
