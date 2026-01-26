import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/libs/mongo";
import User from "@/models/User";
import mongoose from "mongoose";

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
            return null;
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
          if (
            error.message === "NO_ACTIVE_SUBSCRIPTION" ||
            error.message === "SUBSCRIPTION_EXPIRED"
          ) {
            throw new Error(error.message);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
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
          // Créer un nouvel utilisateur
          const newUser = new User({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: new Date(),
          });

          await newUser.save();
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
