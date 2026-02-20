import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Reuse singleton or create new client for API routes
// In a serverless/Edge context, connection management represents a challenge,
// but for standard Node.js runtime, creating a client here is acceptable for low volume.
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const message = {
            id: Date.now(),
            title,
            content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Publish to the channel that the WebSocket server listens to
        await redis.publish("events-updates", JSON.stringify(message));

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("Redis Publish Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
