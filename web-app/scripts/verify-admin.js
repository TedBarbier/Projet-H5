const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const email = process.argv[2];
    if (!email) {
        console.log("Usage: node scripts/verify-admin.js <email>");
        process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log(`❌ User not found: ${email}`);
    } else {
        console.log(`✅ User found:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        if (user.role !== "ADMIN") {
            console.log(`⚠️  WARNING: User is NOT ADMIN.`);
            console.log(`   Run this to fix: node scripts/promote-admin.js ${email}`);
        } else {
            console.log(`🎉 User is ADMIN.`);
        }
    }
}

checkUser()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
