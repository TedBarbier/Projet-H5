import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
    // Announcements are public for the feed

    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { author: { select: { name: true } } }
        });

        // Map to Feed NewsItem format
        const formatted = announcements.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: a.author.name
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
