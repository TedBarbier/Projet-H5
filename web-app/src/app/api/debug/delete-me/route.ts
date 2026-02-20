import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const emailToDelete = searchParams.get('email');

    // Allow bypassing session if secret is provided (DEBUG ONLY)
    if (secret === 'debug123' && emailToDelete) {
        try {
            const user = await prisma.user.findUnique({ where: { email: emailToDelete } });

            if (!user) {
                return NextResponse.json({ error: `User with email ${emailToDelete} not found.` }, { status: 404 });
            }

            // Manually delete/update related records because Cascade is not set in schema
            await prisma.payment.deleteMany({ where: { userId: user.id } });
            await prisma.poleMessage.deleteMany({ where: { authorId: user.id } });
            await prisma.announcement.deleteMany({ where: { authorId: user.id } });

            // For tasks, we might not want to delete the task, just unassign
            await prisma.poleTask.updateMany({
                where: { assigneeId: user.id },
                data: { assigneeId: null }
            });
            await prisma.poleTask.updateMany({
                where: { creatorId: user.id },
                data: { creatorId: null }
            });

            await prisma.user.delete({
                where: { id: user.id }
            });

            return NextResponse.json({
                success: true,
                message: `DEBUG: User ${emailToDelete} (and all related data) deleted successfully.`
            });
        } catch (error: any) {
            console.error("Delete failed:", error);
            return NextResponse.json({
                error: "Failed to delete user",
                details: error.message || String(error)
            }, { status: 500 });
        }
    }

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    try {
        await prisma.user.delete({
            where: { email: session.user.email }
        });

        return NextResponse.json({
            success: true,
            message: `User ${session.user.email} has been deleted. You will be signed out.`
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
