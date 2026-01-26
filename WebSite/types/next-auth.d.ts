import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extension de l'interface de session pour inclure l'ID utilisateur
   */
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      needsSubscription?: boolean;
    } & DefaultSession["user"];
  }

  /**
   * Extension de l'interface User pour inclure des champs supplémentaires
   */
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    company?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extension du token JWT pour inclure l'ID utilisateur
   */
  interface JWT {
    id: string;
    needsSubscription?: boolean;
  }
}
