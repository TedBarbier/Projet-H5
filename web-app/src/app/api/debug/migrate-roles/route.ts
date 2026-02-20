
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                poleId: { not: null },
                role: { in: ['POLE_STAFF', 'POLE_RESP'] }
            }
        });

        const migrations = [];

        for (const user of users) {
            if (user.poleId) {
                const poleRole = user.role === 'POLE_RESP' ? 'RESP' : 'STAFF';

                const migration = prisma.poleMembership.upsert({
                    where: {
                        userId_poleId: {
                            userId: user.id,
                            poleId: user.poleId
                        }
                    },
                    update: {}, // Already exists, do nothing
                    create: {
                        userId: user.id,
                        poleId: user.poleId,
                        role: poleRole
                    }
                });
                migrations.push(migration);
            }
        }

        const results = await prisma.$transaction(migrations);

        return NextResponse.json({
            message: 'Migration completed',
            count: results.length,
            details: `Migrated ${results.length} users to PoleMembership`
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Migration failed',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
