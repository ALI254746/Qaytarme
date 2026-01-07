import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiUrl } from "./api-config";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(getApiUrl("auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              image: data.user.avatar,
              role: data.user.role,
              accessToken: data.access_token,
            };
          } else {
            throw new Error(data.message || "Email yoki parol noto'g'ri");
          }
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          console.log("Sending social-login request to:", getApiUrl("auth/social-login"));
          const res = await fetch(getApiUrl("auth/social-login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          });

          const data = await res.json();
          console.log("Social login response:", res.status, data);

          if (res.ok && data.access_token) {
            user.accessToken = data.access_token;
            user.id = data.user.id;
            user.role = data.user.role;
            return true;
          }
          console.error("Social login failed:", data);
          return false;
        } catch (error) {
          console.error("Social login fetch error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // First time login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      
      // If it's a social login and we don't have the backend token yet
      if (account && account.provider === "google" && !token.accessToken) {
        try {
          const res = await fetch(getApiUrl("auth/social-login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              avatar: token.picture,
            }),
          });
          const data = await res.json();
          if (res.ok && data.access_token) {
            token.accessToken = data.access_token;
            token.id = data.user.id;
            token.role = data.user.role;
          }
        } catch (error) {
          console.error("JWT Social login error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
