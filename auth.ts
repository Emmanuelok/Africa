import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Lightweight Auth.js config. Without NEXTAUTH_SECRET this still loads, but
// /api/auth/* routes return errors and middleware skips protection — the demo
// /signin and /signup waitlist flow remains the user-facing path.
//
// Production wiring (uncomment when DB + email provider are configured):
//   import { DrizzleAdapter } from "@auth/drizzle-adapter";
//   import Resend from "next-auth/providers/resend";
//   import { getDb, schema } from "@/lib/db/client";
//   adapter: DrizzleAdapter(getDb()!, { usersTable: schema.users, ... }),
//   providers: [ Resend({ from: process.env.EMAIL_FROM, apiKey: process.env.RESEND_API_KEY }) ],

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/signin",
    error: "/signin"
  },
  session: { strategy: "jwt" },
  providers: [
    // Stub credentials provider — accepts demo accounts only.
    // Replaced by Resend / OAuth providers in production.
    Credentials({
      name: "Demo credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Demo guard: only the special demo account authenticates in scaffold mode.
        // Real implementation: verify hashed password against users table.
        if (email === "demo@sokoni.africa" && password === "sokoni-demo") {
          return { id: "demo-user", email, name: "Amara Okonkwo" };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
