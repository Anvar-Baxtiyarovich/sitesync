import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      fullName?: string;
      username?: string;
      jobTitle?: string;
      nativeLanguage?: string;
      role?: string;
      canCreateGroup?: boolean;
      canAcceptDirectives?: boolean;
      canSubmitReports?: boolean;
    };
  }

  interface User {
    id: string;
    fullName?: string;
    username?: string;
    jobTitle?: string;
    nativeLanguage?: string;
    role?: string;
    canCreateGroup?: boolean;
    canAcceptDirectives?: boolean;
    canSubmitReports?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
