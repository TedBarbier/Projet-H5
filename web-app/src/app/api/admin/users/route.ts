import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import bcrypt from 'bcrypt';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Security Check (Redundant with Middleware but good practice)
    // Security Check (Redundant with Middleware but good practice)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                school: true,
                poleId: true,
                sport: true,
                memberships: {
                    select: { poleId: true, role: true }
                },
                payments: {
                    select: { status: true }
                }
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    // Security Check
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId } = body;

        // Prevent changing own role to avoid lockout
        if (body.role && userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot change own role' }, { status: 400 });
        }

        const data: any = {};
        if (body.role) data.role = body.role;
        if (body.name) data.name = body.name;
        if (body.email) data.email = body.email;
        if (body.sport !== undefined) data.sport = body.sport;
        if (body.password) {
            const hashedPassword = await bcrypt.hash(body.password, 10);
            data.password = hashedPassword;
        }

        // Allow unassigning pole by passing null or empty string if logic dictates, 
        // here we check undefined to know if we should update it.
        if (body.poleId !== undefined) data.poleId = body.poleId || null;

        await prisma.user.update({
            where: { id: userId },
            data: data
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: 'Delete Failed' }, { status: 500 });
    }
}
