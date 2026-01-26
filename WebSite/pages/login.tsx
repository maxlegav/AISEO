// pages/login.tsx
"use client"; // Si vous utilisez Next.js 13+ App Router, sinon retirez

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assurez-vous que ce composant existe
import { Label } from "@/components/ui/label"; // Assurez-vous que ce composant existe
import { FcGoogle } from "react-icons/fc"; // Pour l'icône Google
import { LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null); // Pour les erreurs générales de NextAuth
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Pour les messages de succès

  // Gestion des erreurs affichées par NextAuth via les query params
  useEffect(() => {
    if (router.query.error) {
      setAuthError(getFriendlyErrorMessage(router.query.error as string));
      setSuccessMessage(null);
      // Optionnel: retire l'erreur de l'URL sans recharger la page
      router.replace("/login", undefined, { shallow: true });
    }

    // Gestion du succès de paiement
    if (router.query.success === "1") {
      setSuccessMessage(
        "Votre abonnement a été souscrit avec succès ! Vous pouvez maintenant vous connecter."
      );
      setAuthError(null);
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router.query.error, router.query.success, router]);

  // Redirige vers le tableau de bord si déjà connecté
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage(null);
    try {
      await signIn("google", { callbackUrl: "/api/auth/session-redirect" });
      // Note: Cette ligne ne sera pas atteinte si la redirection fonctionne
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      setAuthError("Une erreur est survenue lors de la connexion avec Google");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setAuthError(null);
    setSuccessMessage(null);

    // Validation de base
    let isValid = true;
    if (!email) {
      setEmailError("L'email est requis.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Veuillez entrer une adresse email valide.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        const errorMessage = getFriendlyErrorMessage(res.error);
        // Ne pas afficher le message si c'est une redirection vers subscription
        if (errorMessage) {
          setAuthError(errorMessage);
        }
      } else if (res?.ok) {
        router.push("/dashboard");
      } else {
        // Cas inattendu
        setAuthError(
          "Une erreur inattendue s'est produite. Veuillez réessayer."
        );
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setAuthError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour traduire les erreurs NextAuth
  const getFriendlyErrorMessage = (error: string): string => {
    switch (error) {
      case "OAuthAccountNotLinked":
        // Plutôt que de rediriger, donner des instructions plus claires
        return "Cet email existe déjà avec une autre méthode de connexion. Si vous avez créé un compte avec email/mot de passe, veuillez utiliser cette méthode. Si vous avez utilisé Google, veuillez vous connecter avec Google.";
      case "EmailSignin":
        return "Impossible d'envoyer l'email de connexion. Veuillez réessayer plus tard.";
      case "CredentialsSignin":
        return "Identifiants invalides. Veuillez vérifier votre email ou mot de passe.";
      case "NO_ACTIVE_SUBSCRIPTION":
        // Rediriger immédiatement sans afficher de message
        setTimeout(() => router.push("/subscription-plans"), 0);
        return "";
      case "SUBSCRIPTION_EXPIRED":
        // Rediriger immédiatement sans afficher de message
        setTimeout(() => router.push("/subscription-plans"), 0);
        return "";
      default:
        return "Échec de l'authentification. Veuillez réessayer.";
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    ); // Ou un spinner
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-bg-classic to-primary-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <Image src={logo} alt="AutoInvoice Logo" width={40} height={40} />
            <span className="text-3xl font-bold text-texte-header-black">
              AutoInvoice
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold text-texte-header-black leading-tight">
            Connexion
          </h1>
        </div>

        {authError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* Google Sign-in */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50 text-texte-description-black font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FcGoogle size={20} />
            <span>Se connecter avec Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Ou se connecter avec email
              </span>
            </div>
          </div>

          {/* Email Sign-in Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-texte-description-black">
                Adresse Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`mt-1 ${emailError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-texte-description-black"
              >
                Mot de passe
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`mt-1 ${passwordError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-bg-bouton-classic border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-texte-description-black"
                >
                  Se souvenir de moi
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-texte-header-black hover:opacity-80"
              >
                Mot de passe oublié?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full px-8 py-4 bg-bg-bouton-classic hover:bg-bg-bouton-hover text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                "Connexion en cours..."
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-texte-description-black">
          Vous n&apos;avez pas de compte ?
          <Link
            href="/signup"
            className="ml-1 font-medium text-texte-header-black hover:opacity-80"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
