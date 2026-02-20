const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const email = process.argv[2];
    if (!email) {
        console.log("Usage: node scripts/check-user.js <email>");
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (user) {
        console.log("✅ Custom User Dump:", user);
    } else {
        console.log("❌ User not found");
    }

    await prisma.$disconnect();
}

checkUser();
