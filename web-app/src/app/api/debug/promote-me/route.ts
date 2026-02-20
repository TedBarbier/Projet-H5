
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
    // SECURITY: This endpoint is disabled in production to prevent unauthorized admin access.
    return NextResponse.json(
        { error: 'This debug endpoint is disabled.' },
        { status: 403 }
    );
}
