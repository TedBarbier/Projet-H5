import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// GET /api/poles/[id]/tasks
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;

    const tasks = await prisma.poleTask.findMany({
        where: { poleId: id },
        include: {
            assignees: { select: { id: true, name: true, image: true } },
            checklist: { orderBy: { id: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
}

// POST /api/poles/[id]/tasks
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, assignees = [], checklist = [] } = body;

    try {
        const task = await prisma.poleTask.create({
            data: {
                title,
                description,
                status: status || 'TODO',
                poleId: id,
                assignees: {
                    connect: assignees.map((uid: string) => ({ id: uid }))
                },
                checklist: {
                    create: checklist.map((item: { content: string, isDone: boolean }) => ({
                        content: item.content,
                        isDone: item.isDone || false
                    }))
                }
            },
            include: {
                assignees: { select: { id: true, name: true, image: true } },
                checklist: true
            }
        });
        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Task Creation Error:", error);
        return NextResponse.json({ error: 'Creation failed', details: error.message }, { status: 500 });
    }
}

// PATCH /api/poles/[id]/tasks
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { taskId, title, description, status, assignees, checklist } = body;

    try {
        // Build data object dynamically based on what's provided
        const data: any = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;

        if (assignees !== undefined) {
            // Replace assignees
            data.assignees = {
                set: assignees.map((uid: string) => ({ id: uid }))
            };
        }

        if (checklist !== undefined) {
            // Full replace of checklist for simplicity
            data.checklist = {
                deleteMany: {},
                create: checklist.map((item: { content: string, isDone: boolean }) => ({
                    content: item.content,
                    isDone: item.isDone
                }))
            };
        }

        const task = await prisma.poleTask.update({
            where: { id: taskId },
            data,
            include: {
                assignees: { select: { id: true, name: true, image: true } },
                checklist: { orderBy: { id: 'asc' } }
            }
        });
        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Task Update Error:", error);
        return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
    }
}

// DELETE /api/poles/[id]/tasks
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { taskId } = body;

    try {
        await prisma.poleTask.delete({
            where: { id: taskId }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Task Deletion Error:", error);
        return NextResponse.json({ error: 'Deletion failed', details: error.message }, { status: 500 });
    }
}
