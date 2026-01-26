"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, setLanguage, t: _t } = useLanguage();

  // Protection côté client
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard"); // Redirige vers login si pas connecté
    }
  }, [status, router]);

  // Vérification de l'abonnement
  useEffect(() => {
    if (status === "authenticated") {
      // Debug log supprimé pour la sécurité - voir SECURITY_AUDIT_REPORT.md

      // Vérifier si l'utilisateur a un badge needsSubscription dans sa session
      if (session.user.needsSubscription) {
        // Log supprimé pour la sécurité

        // Double vérification avec l'API
        const checkSubscription = async () => {
          try {
            const response = await fetch("/api/user/check-subscription");
            const data = await response.json();

            // Debug log supprimé pour la sécurité

            if (data.hasActiveSubscription) {
              // Info log supprimé pour la sécurité
              // Forcer le rechargement pour mettre à jour la session
              window.location.href = "/dashboard";
            } else {
              router.push("/subscription-plans");
            }
          } catch (error) {
            console.error(
              "Erreur lors de la vérification de l'abonnement:",
              error
            );
          }
        };

        checkSubscription();
        return;
      }

      // Vérifier l'abonnement côté serveur
      const checkSubscription = async () => {
        try {
          const response = await fetch("/api/user/check-subscription");
          const data = await response.json();

          // Debug log supprimé pour la sécurité

          if (!data.hasActiveSubscription) {
            router.push("/subscription-plans");
          }
        } catch (error) {
          console.error(
            "Erreur lors de la vérification de l'abonnement:",
            error
          );
        }
      };

      checkSubscription();
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <h1 className="text-3xl font-bold mb-4 font-serif">
            {language === "fr"
              ? `Bienvenue dans votre tableau de bord, ${session.user?.name || "Utilisateur"}!`
              : `Welcome to your Dashboard, ${session.user?.name || "User"}!`}
          </h1>
          <p className="mb-6 text-gray-700">
            {language === "fr"
              ? "Voici votre espace protégé."
              : "This is your protected dashboard area."}
          </p>
          {session.user?.email && (
            <p className="text-sm text-gray-500 mb-6">
              {language === "fr" ? "Connecté en tant que : " : "Logged in as: "}
              {session.user.email}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard-view")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Calendar size={16} className="mr-2" />
              {language === "fr" ? "Voir le tableau de bord" : "View dashboard"}
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogOut size={16} className="mr-2" />
              {language === "fr" ? "Déconnexion" : "Sign Out"}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
            <Button
              onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
              variant="outline"
              className="text-gray-600 flex items-center"
            >
              <Globe size={16} className="mr-2" />
              {language === "fr" ? "English" : "Français"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Au cas où status n'est ni loading, ni authenticated (peu probable ici)
  return null;
}

// Alternative: Protection côté serveur (plus robuste)
// export async function getServerSideProps(context) {
//   const session = await getSession(context);
//
//   if (!session) {
//     return {
//       redirect: {
//         destination: '/login?callbackUrl=/dashboard',
//         permanent: false,
//       },
//     };
//   }
//
//   return {
//     props: { session }, // Passe la session aux props de la page
//   };
// }
