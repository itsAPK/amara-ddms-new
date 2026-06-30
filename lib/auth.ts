import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";

const SESSION_MAX_AGE_SECONDS = 30 * 60; // 30 min inactivity-style timeout

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 60, // refresh the rolling expiry on any active request
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = lower(${email})`)
          .limit(1);

        if (!user) {
          await logAudit({
            action: "LOGIN_FAILED",
            userEmail: email,
            details: "No account with this email",
          });
          return null;
        }

        if (!user.isActive) {
          await logAudit({
            action: "LOGIN_FAILED",
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            details: "Account is deactivated",
          });
          throw new Error("ACCOUNT_DEACTIVATED");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await logAudit({
            action: "LOGIN_FAILED",
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            details: "Incorrect password",
          });
          return null;
        }

        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));

        await logAudit({
          action: "LOGIN_SUCCESS",
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
        } catch (err: any) {
          console.error("AUTHORIZE_ERROR", err, err?.cause);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      if (trigger === "update" && token.id) {
        const [fresh] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (fresh) {
          token.role = fresh.role;
          token.mustChangePassword = fresh.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
};
