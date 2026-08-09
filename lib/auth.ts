import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;
        try {
          await db.user.update({
            where: { email },
            data: {
              fullName: user.name || "",
              name: user.name,
              image: user.image,
              avatarUrl: user.image,
              googleId: account.providerAccountId,
              authProvider: "GOOGLE",
            },
          });
        } catch {
          // User not yet created by adapter — will be patched on next sign-in
        }
      }
      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            fullName: true,
            username: true,
            jobTitle: true,
            nativeLanguage: true,
            avatarUrl: true,
            role: true,
          },
        });
        if (dbUser) {
          session.user.fullName = dbUser.fullName;
          session.user.username = dbUser.username ?? undefined;
          session.user.jobTitle = dbUser.jobTitle ?? undefined;
          session.user.nativeLanguage = dbUser.nativeLanguage;
          session.user.role = dbUser.role;
          if (dbUser.avatarUrl) session.user.image = dbUser.avatarUrl;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/onboarding",
    error: "/onboarding",
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
