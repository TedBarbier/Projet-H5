import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

// GET /api/admin/scan
// Returns: { settings: { isMealActive: boolean }, recentScans: MealLog[] }
export async function GET(req: Request) {
    try {
        const settings = await prisma.globalSettings.findUnique({ where: { id: "settings" } })
            || await prisma.globalSettings.create({ data: { id: "settings", isMealActive: false } });

        const recentScans = await prisma.mealLog.findMany({
            take: 10,
            orderBy: { scannedAt: 'desc' },
            include: { user: { select: { name: true, email: true, school: true } } }
        });

        return NextResponse.json({ settings, recentScans });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scan data' }, { status: 500 });
    }
}

// PUT /api/admin/scan
// Updates settings (e.g., toggle meal active)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        console.log("PUT /api/admin/scan received:", body);
        const { isMealActive } = body;

        const updateData: any = { isMealActive };
        // If opening the service, set the start time
        if (isMealActive) {
            updateData.currentMealDate = new Date();
        }

        const settings = await prisma.globalSettings.upsert({
            where: { id: "settings" },
            update: updateData,
            create: { id: "settings", isMealActive, currentMealDate: isMealActive ? new Date() : null }
        });
        console.log("Updated settings:", settings);
        return NextResponse.json(settings);
    } catch (error) {
        console.error("PUT Error:", error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // 0. Check Global Switch
        const settings = await prisma.globalSettings.findUnique({ where: { id: "settings" } });
        if (!settings?.isMealActive) {
            return NextResponse.json({ valid: false, message: 'Repas FERMÉ ❌' });
        }

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
        }

        // 1. Parse Token: userId:timestamp:signature
        const parts = token.split(':');
        if (parts.length !== 3) {
            return NextResponse.json({ valid: false, message: 'Format invalide' });
        }

        const [userId, timestampStr, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";

        // 2. Validate Signature
        const payload = `${userId}:${timestampStr}`;
        const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ valid: false, message: 'Signature invalide (Faux QR)' });
        }

        // 3. Validate Time Window (30s precision -> allow +/- 5 mins for safety)
        const currentTimestamp = Math.floor(Date.now() / 30000);
        if (Math.abs(currentTimestamp - timestamp) > 10) { // Increased window
            return NextResponse.json({ valid: false, message: 'QR Code expiré' });
        }

        // 4. Check if already eaten THIS SESSION (based on currentMealDate)
        // If no date set (shouldn't happen if active), default to start of day as fallback
        const sinceDate = settings.currentMealDate || new Date(new Date().setHours(0, 0, 0, 0));

        const existingLog = await prisma.mealLog.findFirst({
            where: {
                userId: userId,
                scannedAt: { gte: sinceDate }
            }
        });

        if (existingLog) {
            // Get User info for display
            const user = await prisma.user.findUnique({ where: { id: userId } });

            // Format time difference nicely
            const scanTime = new Date(existingLog.scannedAt);
            const hours = scanTime.getHours().toString().padStart(2, '0');
            const minutes = scanTime.getMinutes().toString().padStart(2, '0');

            return NextResponse.json({
                valid: true,
                allowed: false,
                message: `Déjà mangé à ${hours}h${minutes} !`,
                user: { name: user?.name, email: user?.email, school: user?.school }
            });
        }

        // 5. Log Meal
        await prisma.mealLog.create({
            data: { userId }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });

        return NextResponse.json({
            valid: true,
            allowed: true,
            message: 'Bon appétit !',
            user: { name: user?.name, email: user?.email, school: user?.school }
        });

    } catch (error) {
        console.error("Scan Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
