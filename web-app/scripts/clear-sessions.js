const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSessions() {
    console.log("🧹 Clearing all sessions...");
    await prisma.session.deleteMany({});
    console.log("✨ All sessions cleared. Please log in again.");
    await prisma.$disconnect();
}

clearSessions();
