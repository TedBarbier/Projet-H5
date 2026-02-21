import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export type PermissionKey = 'canManageAnnouncements' | 'canManageUsers' | 'canManageSchedule' | 'canManageMatches' | 'canManageScanner';

/**
 * Checks if the current authenticated user has global Admin rights, 
 * OR if they are a member of a Pole that grants them the specific requested permission.
 */
export async function hasPermission(permissionKey: PermissionKey): Promise<boolean> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return false;

    const userRole = (session.user as any).role;

    // Global Admins always have all permissions
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        return true;
    }

    // For Staff, check if any of their associated poles grants the permission
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            memberships: { include: { pole: true } },
            pole: true // Legacy fallback check
        }
    });

    if (!user) return false;

    // Check if any membership provides the permission
    const hasPolePerm = user.memberships.some(membership => {
        return (membership.pole as any)[permissionKey] === true;
    });

    const hasLegacyPerm = user.pole ? (user.pole as any)[permissionKey] === true : false;

    // Also true if global role is POLE_RESP (maybe they don't have pole perm directly, but by definition they are a pole resp)
    // Wait, let's keep it strictly based on pole permissions if that was the legacy way, or just if they are POLE_RESP.
    if (userRole === 'POLE_RESP' && permissionKey === 'canManageUsers') return true; // As per the prompt requirement

    return hasPolePerm || hasLegacyPerm;

}
