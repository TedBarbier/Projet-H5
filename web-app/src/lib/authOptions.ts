import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: process.env.EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
        }),
        CredentialsProvider({
            name: "Mot de passe",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mot de passe", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) return null;

                return user as any;
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            if (user.email) {
                // Enforce @insa-*.fr or @*.insa-*.fr domain
                const isInsa = /@(?:[\w-]+\.)?insa-[\w-]+\.fr$/.test(user.email)

                if (isInsa) {
                    // Extract Name if missing
                    if (!user.name) {
                        try {
                            const localPart = user.email.split('@')[0];
                            const nameParts = localPart.split('.').map(part =>
                                part.charAt(0).toUpperCase() + part.slice(1)
                            );
                            user.name = nameParts.join(' ');
                        } catch (e) {
                            console.error("Name parsing error", e);
                        }
                    }

                    // Auto-detect School
                    try {
                        const domain = user.email.split('@')[1];
                        let school = null;

                        if (domain.includes('insa-lyon.fr')) school = 'LYON';
                        else if (domain.includes('insa-rennes.fr')) school = 'RENNES';
                        else if (domain.includes('insa-rouen.fr')) school = 'ROUEN';
                        else if (domain.includes('insa-strasbourg.fr')) school = 'STRASBOURG';
                        else if (domain.includes('insa-toulouse.fr')) school = 'TOULOUSE';
                        else if (domain.includes('insa-cvl.fr')) school = 'CENTRE_VAL_DE_LOIRE';
                        else if (domain.includes('insa-hdf.fr')) school = 'HAUTS_DE_FRANCE';

                        if (school) {
                            // Asynchronously update user school in DB
                            prisma.user.update({
                                where: { email: user.email },
                                data: { school: school as any } // Cast to fit Enum
                            }).catch(err => console.error("Failed to auto-update school", err));

                            // Update local user object so it flows to JWT
                            // @ts-ignore
                            user.school = school;
                        }
                    } catch (e) {
                        console.error("School detection error", e);
                    }
                }
                return isInsa
            }
            return false
        },
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                // @ts-ignore
                token.role = user.role
                // @ts-ignore
                token.poleId = user.poleId
                // @ts-ignore
                token.school = user.school
                // @ts-ignore
                token.sport = user.sport

                // Fetch memberships on initial sign in to ensure we have them
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        memberships: {
                            include: { pole: true } // Include pole to get its permissions
                        }
                    }
                });
                if (dbUser) {
                    token.memberships = dbUser.memberships.map(m => {
                        const pole = m.pole as any;
                        return {
                            poleId: m.poleId,
                            role: m.role,
                            permissions: { // Extract permissions to the token
                                canManageAnnouncements: pole.canManageAnnouncements,
                                canManageUsers: pole.canManageUsers,
                                canManageSchedule: pole.canManageSchedule,
                                canManageMatches: pole.canManageMatches,
                                canManageScanner: pole.canManageScanner
                            }
                        };
                    });
                }
            }

            // Refetch updates if needed (e.g. after profile update)
            if (trigger === "update" && session) {
                // If session update provides memberships, use them, otherwise keep existing
                const updatedToken = { ...token, ...session.user };
                if (session.user.memberships) {
                    updatedToken.memberships = session.user.memberships;
                }
                return updatedToken;
            }

            // Periodic check or subsequent requests: verify if we need to refresh memberships? 
            // For now, let's keep it simple. If we need real-time role updates without re-login, 
            // we'll need to fetch DB here on every request, which is heavy. 
            // Sticking to "update on login" or explicit "update()" calls is better for perf.

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                // @ts-ignore
                session.user.role = token.role
                // @ts-ignore
                session.user.poleId = token.poleId
                // @ts-ignore
                session.user.school = token.school
                // @ts-ignore
                session.user.sport = token.sport
                // @ts-ignore
                session.user.memberships = token.memberships
            }
            return session
        }
    },
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: '/auth/signin', // user can uncomment if creating custom page
        // error: '/auth/error',
        // verifyRequest: '/auth/verify-request', // (used for check email message)
    },
}
