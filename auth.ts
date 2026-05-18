import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db/client";
import { verifyPassword, safeEqual } from "@/lib/auth/password";
import { magicLinkEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";

const db = getDb();
const resendKey = process.env.RESEND_API_KEY;

// Build the provider list dynamically — only enable what's configured.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      // 1. Real users from DB (when DATABASE_URL is set)
      if (db) {
        const rows = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);
        const user = rows[0];
        if (user && "passwordHash" in user && typeof user.passwordHash === "string") {
          const ok = await verifyPassword(password, user.passwordHash as string);
          if (!ok) return null;
          return { id: user.id, email: user.email, name: user.name ?? undefined, image: user.image ?? undefined };
        }
      }

      // 2. Demo account — only when no DB is configured (pre-prod sandbox).
      if (!db && email === "demo@sokoni.africa" && safeEqual(password, "sokoni-demo")) {
        return { id: "demo-user", email, name: "Amara Okonkwo" };
      }

      return null;
    }
  })
];

if (resendKey) {
  providers.push(
    Resend({
      from: process.env.EMAIL_FROM || "Sokoni <hello@sokoni.africa>",
      apiKey: resendKey,
      async sendVerificationRequest({ identifier, url, provider }) {
        const host = new URL(url).host;
        const tpl = magicLinkEmail({ url, host });
        await sendEmail({
          to: identifier,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          replyTo: provider.from as string
        });
      }
    })
  );
}

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: db
    ? (DrizzleAdapter(
        db as unknown as Parameters<typeof DrizzleAdapter>[0],
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usersTable: schema.users as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          accountsTable: schema.accounts as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessionsTable: schema.sessions as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          verificationTokensTable: schema.verificationTokens as any
        }
      ) as NextAuthConfig["adapter"])
    : undefined,
  // JWT when no DB; database sessions when DB present.
  session: { strategy: db ? "database" : "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin",
    verifyRequest: "/signin?verify=1"
  },
  providers,
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        const id = (user?.id as string | undefined) ?? token?.sub;
        if (id) (session.user as { id?: string }).id = id;
      }
      return session;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
