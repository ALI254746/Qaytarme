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
            // --- Standard Email/Password Login ---
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
              console.error("Backend Login Error:", data);
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
          const apiUrl = getApiUrl("auth/social-login");
          console.log("Sending social-login request to:", apiUrl);
          console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
          
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(15000), // 15 seconds timeout
          });

          // Check if response is ok before parsing JSON
          if (!res.ok) {
            let errorMessage = `Backend returned ${res.status}`;
            try {
              const errorData = await res.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              // If response is not JSON, try to get text
              try {
                const text = await res.text();
                errorMessage = text || errorMessage;
              } catch (e2) {
                // Ignore
              }
            }
            
            console.error("Social login failed:", res.status, errorMessage);
            throw new Error(`Social Login Failed (${res.status}): ${errorMessage}`);
          }

          const data = await res.json();
          console.log("Social login response:", res.status, data);

          if (data.access_token) {
            user.accessToken = data.access_token;
            user.id = data.user.id;
            user.role = data.user.role;
            return true;
          }
          
          console.error("Social login failed: No access token", data);
          throw new Error(`Social Login Failed: No access token received. ${data.message || JSON.stringify(data)}`);
        } catch (error) {
          console.error("Social login fetch error:", error);
          console.error("Attempted URL:", getApiUrl("auth/social-login"));
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            cause: error.cause,
          });
          
          // More specific error messages
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            throw new Error(`Backend timeout: Backend did not respond in time. Check if backend is running at ${process.env.NEXT_PUBLIC_API_URL || 'NEXT_PUBLIC_API_URL not set'}`);
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Cannot connect to backend. Check NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}`);
          } else {
            throw new Error(`Connection Error: ${error.message}. Backend URL: ${process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}`);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // First time login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.picture = user.image; // Save image to token
      }
      
      // Handle session update (e.g. when profile image changes)
      if (trigger === "update" && session?.image) {
        token.picture = session.image;
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
            // Update picture from backend if provided, otherwise keep google picture
            if (data.user.avatar) {
                token.picture = data.user.avatar;
            }
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
        session.user.image = token.picture; // Pass image from token to session
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
