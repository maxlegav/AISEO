import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extension de l'interface de session pour inclure l'ID utilisateur et subscription
   */
  interface Session {
    user: {
      id: string;
      name: string;
      displayName?: string;
      email: string;
      image?: string;
      username?: string;
      subscriptionTier?: 'none' | 'basic' | 'pro' | 'premium';
      subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'inactive';
      auditCredits?: number;
      language?: 'en' | 'fr';
    } & DefaultSession["user"];
  }

  /**
   * Extension de l'interface User pour inclure des champs supplémentaires
   */
  interface User {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    image?: string;
    username?: string;
    company?: string;
    subscriptionTier?: 'none' | 'basic' | 'pro' | 'premium';
    subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'inactive';
    auditCredits?: number;
    language?: 'en' | 'fr';
  }
}

declare module "next-auth/jwt" {
  /**
   * Extension du token JWT pour inclure l'ID utilisateur et subscription
   */
  interface JWT {
    id: string;
    displayName?: string;
    username?: string;
    subscriptionTier?: 'none' | 'basic' | 'pro' | 'premium';
    subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'inactive';
    auditCredits?: number;
    language?: 'en' | 'fr';
  }
}
