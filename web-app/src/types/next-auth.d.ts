import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            role: "USER" | "POLE_STAFF" | "POLE_RESP" | "ADMIN" | "SUPER_ADMIN"
            poleId?: string
            school?: string
            sport?: string
            memberships?: { poleId: string, role: string }[]
        } & DefaultSession["user"]
    }

    interface User {
        role: "USER" | "POLE_STAFF" | "POLE_RESP" | "ADMIN" | "SUPER_ADMIN"
        poleId?: string
        school?: string
        sport?: string
        memberships?: { poleId: string, role: string }[]
    }
}
