import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { School } from '@prisma/client';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes(session.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const domains = await prisma.allowedEmailDomain.findMany({
            orderBy: { domain: 'asc' }
        });
        return NextResponse.json(domains);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch domains', details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes(session.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { domain, school } = body;

        if (!domain || !school) {
            return NextResponse.json({ error: 'Domain and School are required' }, { status: 400 });
        }

        // basic validation of domain
        const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');

        const newDomain = await prisma.allowedEmailDomain.create({
            data: {
                domain: cleanDomain,
                school: school as School
            }
        });

        return NextResponse.json(newDomain);
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Domain already exists' }, { status: 400 });
        return NextResponse.json({ error: 'Failed to create domain', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes(session.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.allowedEmailDomain.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete domain', details: error.message }, { status: 500 });
    }
}
