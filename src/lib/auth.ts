import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
      async authorize(credentials) {
        const { userId, adminId, userName, userEmail } =
          credentials as Record<string, string | undefined>;

        if (!userId) return null;

        return {
          id: userId,
          name: userName || "",
          email: userEmail || "",
          adminId: adminId ? Number(adminId) : 0,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.adminId = user.adminId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.adminId = token.adminId as number | undefined;
      return session;
    },
  },
  session: {
    strategy: (process.env.SESSION_STRATEGY as "jwt" | "database") || "jwt",
    maxAge: Number(process.env.SESSION_MAX_AGE || 30 * 24 * 60 * 60),
  },
});

export interface AuthSession {
  userId: number;
  adminId: number;
  actorId: number;
  isAdmin: boolean;
}

export async function getAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = Number(session.user.id);
  const adminId = session.adminId ?? 0;
  const isAdmin = adminId > 0;
  return { userId, adminId, isAdmin, actorId: isAdmin ? adminId : userId };
}
