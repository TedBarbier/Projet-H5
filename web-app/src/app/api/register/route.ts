import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return new NextResponse('Missing fields', { status: 400 });
        }

        const exist = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (exist) {
            return new NextResponse('Email already exists', { status: 400 });
        }

        // --- Domain Verification ---
        const domainPart = email.split('@')[1]?.toLowerCase().trim();
        if (!domainPart) {
            return new NextResponse('Invalid email format', { status: 400 });
        }

        const allowedDomain = await prisma.allowedEmailDomain.findUnique({
            where: { domain: domainPart }
        });

        if (!allowedDomain) {
            return new NextResponse('Domaine ou email non autorisé pour l\'inscription.', { status: 403 });
        }
        // ---------------------------

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                school: allowedDomain.school
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.log(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
