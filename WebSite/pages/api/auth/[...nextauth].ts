import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/libs/mongo";
import User from "@/models/User";
import mongoose from "mongoose";
import { sendMagicLinkEmail } from "@/lib/email";

// Passwordless magic-link sign-in is enabled only when email is configured.
const emailProviders = process.env.RESEND_API_KEY
  ? [
      EmailProvider({
        from: process.env.RESEND_FROM_EMAIL || "noreply@showyourbrand.app",
        maxAge: 15 * 60, // magic links valid 15 min
        async sendVerificationRequest({ identifier, url }) {
          await sendMagicLinkEmail(identifier, url);
        },
      }),
    ]
  : [];

// Ensure MongoDB is connected
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
};

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        };
      },
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        try {
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error: any) {
          console.error("Error during authentication:", error);
          if (error.message === "USER_NOT_FOUND") {
            throw new Error(error.message);
          }
          return null;
        }
      },
    }),
    ...emailProviders,
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.id = user.id;
      }

      // Always refresh user data from DB to keep session in sync
      // (e.g. after Stripe webhook updates subscription)
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.displayName = dbUser.displayName;
            token.username = dbUser.username;
            token.subscriptionTier = dbUser.subscriptionTier;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.auditCredits = dbUser.auditCredits;
            token.language = dbUser.language;
          } else {
            // User no longer exists in DB: invalidate session
            return { ...token, id: "" as string };
          }
        } catch (error) {
          // DB error: keep existing token data so session doesn't break
          // on transient MongoDB issues. The token retains its last-known values.
          console.error("[NextAuth] JWT callback DB error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.displayName = token.displayName;
        session.user.username = token.username;
        session.user.subscriptionTier = token.subscriptionTier;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.auditCredits = token.auditCredits;
        session.user.language = token.language;
      }
      return session;
    },
    async signIn({ user, account, profile: _profile, email: _email, credentials }) {
      await connectDB();

      // Pour l'authentification par credentials
      if (credentials) {
        const dbUser = await User.findOne({ email: credentials.email });

        if (!dbUser) {
          return false;
        }

        return true;
      }

      // Pour l'authentification Google
      if (account?.provider === "google") {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Auto-generate username from name
          const baseName = (user.name || user.email?.split("@")[0] || "user")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 25);
          let generatedUsername = baseName.length >= 3 ? baseName : baseName + "-user";
          let suffix = 0;
          while (await User.findOne({ username: generatedUsername })) {
            suffix++;
            generatedUsername = `${baseName}-${suffix}`;
          }

          const newUser = new User({
            name: user.name,
            username: generatedUsername,
            email: user.email,
            image: user.image,
            emailVerified: new Date(),
          });

          await newUser.save();
        } else if (!existingUser.username) {
          // Auto-generate username for existing users without one
          const baseName = (existingUser.name || existingUser.email?.split("@")[0] || "user")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 25);
          let generatedUsername = baseName.length >= 3 ? baseName : baseName + "-user";
          let suffix = 0;
          while (await User.findOne({ username: generatedUsername })) {
            suffix++;
            generatedUsername = `${baseName}-${suffix}`;
          }
          existingUser.username = generatedUsername;
          await existingUser.save();
        }

        return true;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
