
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INITIAL_SPORTS = [
    'Football', 'Rugby', 'Volley', 'Handball', 'Basketball', 'Badminton', 'Tennis', 'Natation', 'Athlétisme', 'Cheerleading', 'Danse', 'Judo', 'Pompom'
];

export async function GET() {
    try {
        const count = await prisma.sportList.count();
        if (count > 0) {
            return NextResponse.json({ message: 'Sports already seeded', count });
        }

        await prisma.sportList.createMany({
            data: INITIAL_SPORTS.map(name => ({ name }))
        });

        return NextResponse.json({ message: 'Sports seeded successfully', seeded: INITIAL_SPORTS });
    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({
            error: 'Failed to seed sports',
            details: error.message,
            stack: error.stack,
            code: error.code
        }, { status: 500 });
    }
}
