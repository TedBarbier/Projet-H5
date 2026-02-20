const { createServer } = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const httpServer = createServer();
const allowedOrigins = process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL, "http://localhost:3000"] : ["http://localhost:3000"];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const pubClient = new Redis(redisUrl);
const subClient = pubClient.duplicate();

// Basic Pub/Sub for scaling (ready for multiple instances if needed)
// io.adapter(createAdapter(pubClient, subClient)); 
// Note: socket.io-redis-adapter setup requires a bit more boilerplate, 
// for now we stick to simple emitting, but we have the clients ready.

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Redis Subscriber to broadcast messages from API to WS clients
subClient.subscribe("events-updates", "scores-updates", (err, count) => {
    if (err) console.error("Failed to subscribe: %s", err.message);
    else console.log(`Subscribed to ${count} channels.`);
});

subClient.on("message", (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
    // Broadcast to all clients or specific rooms based on channel
    io.emit(channel, JSON.parse(message));
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`WebSocket Server listening on port ${PORT}`);
});
