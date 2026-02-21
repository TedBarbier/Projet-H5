import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

async function checkAuth() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const role = session?.user?.role;
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) return false;
    return true;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const poles = await prisma.pole.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: {
                    members: true,
                    memberships: true
                }
            }
        }
    });
    return NextResponse.json(poles);
}

export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { name, description, color, canManageAnnouncements, canManageUsers, canManageSchedule, canManageMatches } = await req.json();
        const pole = await prisma.pole.create({
            data: {
                name, description, color,
                canManageAnnouncements: canManageAnnouncements || false,
                canManageUsers: canManageUsers || false,
                canManageSchedule: canManageSchedule || false,
                canManageMatches: canManageMatches || false
            }
        });
        return NextResponse.json(pole);
    } catch (error) {
        return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { id, name, description, color, canManageAnnouncements, canManageUsers, canManageSchedule, canManageMatches } = await req.json();

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const pole = await prisma.pole.update({
            where: { id },
            data: {
                name, description, color,
                canManageAnnouncements,
                canManageUsers,
                canManageSchedule,
                canManageMatches
            }
        });
        return NextResponse.json(pole);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.pole.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
