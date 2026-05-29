import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findOwnerByEmail } from "@/lib/azure/repos/owners";
import { loginSchema } from "@/lib/types/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const owner = await findOwnerByEmail(parsed.data.email);
        if (!owner || !owner.isActive) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          owner.passwordHash,
        );
        if (!valid) return null;

        return {
          id: owner.rowKey,
          name: owner.name,
          email: owner.email,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.ownerId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.ownerId) {
        session.user.id = token.ownerId as string;
      }
      return session;
    },
  },
});
