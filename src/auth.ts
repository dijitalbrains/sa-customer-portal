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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
