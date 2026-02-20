const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);

const message = {
    id: Date.now(),
    title: "📢 Annonce Flash !",
    content: "Ceci est une notification envoyée en temps réel via Redis & WebSockets !",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

redis.publish("events-updates", JSON.stringify(message)).then(() => {
    console.log("Message published to 'events-updates':", message);
    redis.quit();
});
