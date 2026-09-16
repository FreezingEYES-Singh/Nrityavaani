import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "demo@example.com" && credentials?.password === "demo123") {
          return { 
            id: "1", 
            name: "Demo User", 
            email: "demo@example.com",
            image: "https://api.dicebear.com/9.x/micah/svg?seed=DemoUser&backgroundColor=ffb86c"
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error next-auth's Session type has no id on user
        session.user.id = token.id;
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-demo",
});

export { handler as GET, handler as POST };
