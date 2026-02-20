const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteUser() {
    const email = process.argv[2];

    if (!email) {
        console.error("Usage: node scripts/promote.js <email>");
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'SUPER_ADMIN' },
        });
        console.log(`✅ Success! User ${user.email} is now a SUPER_ADMIN.`);
    } catch (error) {
        if (error.code === 'P2025') {
            console.error(`❌ Error: User with email '${email}' not found.`);
        } else {
            console.error("❌ Unexpected error:", error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

promoteUser();
