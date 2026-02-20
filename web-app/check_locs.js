const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.location.count();
    console.log(`Total locations: ${count}`);
    const locations = await prisma.location.findMany();
    console.log(locations);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
