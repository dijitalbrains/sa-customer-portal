import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AppError, ErrorCode } from "@/lib/errors/app-error";
import { NO_ADMIN_ID } from "@/lib/constants/auth";
import type { AuthSession } from "@/lib/types/auth";

function readCredential(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "auto-login",
      credentials: {
        userId: {},
        adminId: {},
        userName: {},
        userEmail: {},
      },
      authorize(credentials) {
        const userId = readCredential(credentials.userId);
        if (!userId) return null;

        const adminId = readCredential(credentials.adminId);
        return {
          id: userId,
          name: readCredential(credentials.userName),
          email: readCredential(credentials.userEmail),
          adminId: adminId ? Number(adminId) : NO_ADMIN_ID,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.adminId = user.adminId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : "";
      session.adminId = typeof token.adminId === "number" ? token.adminId : undefined;
      return session;
    },
  },
  session: {
    strategy: (process.env.SESSION_STRATEGY as "jwt" | "database") || "jwt",
    maxAge: Number(process.env.SESSION_MAX_AGE || 30 * 24 * 60 * 60),
  },
});

export async function getAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError(ErrorCode.UNAUTHORIZED);

  const userId = Number(session.user.id);
  const adminId = session.adminId ?? NO_ADMIN_ID;
  const isAdmin = adminId > NO_ADMIN_ID;
  return { userId, adminId, isAdmin, actorId: isAdmin ? adminId : userId };
}
