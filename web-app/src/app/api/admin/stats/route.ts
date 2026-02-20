import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const totalUsers = await prisma.user.count();

        const paidUsers = await prisma.user.count({
            where: {
                payments: {
                    some: {
                        status: 'PAID'
                    }
                }
            }
        });

        return NextResponse.json({
            totalUsers,
            paidUsers
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
