const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Testing Prisma Client...");
    if (prisma.location) {
        console.log("✅ prisma.location exists.");
        const count = await prisma.location.count();
        console.log(`   Count: ${count}`);
    } else {
        console.log("❌ prisma.location is UNDEFINED.");
        console.log("   Available models:", Object.keys(prisma).filter(k => !k.startsWith('_')));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
