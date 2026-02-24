import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error("Usage: node scripts/create-superadmin.mjs <email> <password>");
        process.exit(1);
    }

    const email = args[0];
    const password = args[1];

    if (!email.includes('@')) {
        console.error("L'email n'est pas valide.");
        process.exit(1);
    }

    console.log(`Création ou mise à jour du Super Admin : ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                role: 'SUPER_ADMIN',
                password: hashedPassword,
            },
            create: {
                email: email,
                name: 'Super Admin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                // Adding a school so payment walls don't block them entirely if they try to pay
                school: "Admin School",
            }
        });

        console.log("✅ Super Admin créé/mis à jour avec succès !");
        console.log(`ID: ${user.id} | Role: ${user.role} | Email: ${user.email}`);

    } catch (error) {
        console.error("❌ Erreur lors de la création :", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
