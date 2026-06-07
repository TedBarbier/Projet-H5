const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const domain = process.env.DEFAULT_EMAIL_DOMAIN;
    const school = process.env.DEFAULT_SCHOOL_NAME;

    if (!domain || !school) {
        console.log('Seed: DEFAULT_EMAIL_DOMAIN ou DEFAULT_SCHOOL_NAME non défini, passage.');
        return;
    }

    const existing = await prisma.allowedEmailDomain.findUnique({ where: { domain } });
    if (existing) {
        console.log(`Seed: domaine "${domain}" déjà présent.`);
        return;
    }

    await prisma.allowedEmailDomain.create({
        data: { id: require('crypto').randomUUID(), domain, school },
    });
    console.log(`Seed: domaine "${domain}" (${school}) ajouté.`);
}

seed()
    .catch(e => { console.error('Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
