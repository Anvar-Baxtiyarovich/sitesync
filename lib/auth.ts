import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.email) {
        const isSuperAdmin = user.email === "xab8101@gmail.com";
        const cleanUsername = `@${user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        try {
          await db.user.update({
            where: { id: user.id },
            data: {
              fullName: user.name || "",
              avatarUrl: user.image || undefined,
              username: cleanUsername,
              authProvider: "GOOGLE",
              role: isSuperAdmin ? "SYSTEM_ADMIN" : "LOCAL_MANAGER",
              canCreateGroup: true,
              canAcceptDirectives: true,
              canSubmitReports: true,
            },
          });
        } catch (err) {
          console.error("Error setting initial user data on creation:", err);
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const isSuperAdmin = user.email === "xab8101@gmail.com";
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });
          if (existingUser) {
            await db.user.update({
              where: { email: user.email },
              data: {
                fullName: existingUser.fullName || user.name || "",
                name: user.name,
                image: user.image,
                avatarUrl: existingUser.avatarUrl || user.image,
                googleId: account.providerAccountId,
                authProvider: "GOOGLE",
                ...(isSuperAdmin ? { role: "SYSTEM_ADMIN" } : {}),
              },
            });
          }
        } catch (err) {
          console.error("Error updating user on sign-in:", err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              fullName: true,
              username: true,
              jobTitle: true,
              nativeLanguage: true,
              avatarUrl: true,
              role: true,
              canCreateGroup: true,
              canAcceptDirectives: true,
              canSubmitReports: true,
            },
          });
          if (dbUser) {
            session.user.fullName = dbUser.fullName || session.user.name || "";
            session.user.username = dbUser.username ?? undefined;
            session.user.jobTitle = dbUser.jobTitle ?? undefined;
            session.user.nativeLanguage = dbUser.nativeLanguage || "uz";
            session.user.role = dbUser.role;
            session.user.canCreateGroup = dbUser.canCreateGroup;
            session.user.canAcceptDirectives = dbUser.canAcceptDirectives;
            session.user.canSubmitReports = dbUser.canSubmitReports;
            if (dbUser.avatarUrl) session.user.image = dbUser.avatarUrl;
          }
        } catch (error) {
          console.error("Error fetching session user from DB:", error);
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
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
