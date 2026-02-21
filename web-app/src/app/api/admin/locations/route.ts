import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// Helper function to geocode address
async function getCoordinates(address: string) {
    try {
        const query = encodeURIComponent(address + ", France"); // Append France context
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
            headers: {
                'User-Agent': 'ProjetH5/1.0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

import { hasPermission } from '@/lib/authUtils';

async function checkAuth() {
    return await hasPermission('canManageSchedule');
}

export async function GET(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(locations);
}

// POST /api/admin/locations
export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { name, address } = await req.json();

    let lat = null;
    let lng = null;

    if (address) {
        const coords = await getCoordinates(address);
        if (coords) {
            lat = coords.lat;
            lng = coords.lng;
        }
    }

    try {
        const location = await prisma.location.create({
            data: {
                name,
                address,
                lat,
                lng
            }
        });
        return NextResponse.json(location);
    } catch (error: any) {
        console.error("Location Creation Error:", error);
        return NextResponse.json({ error: `Creation failed: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.location.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
