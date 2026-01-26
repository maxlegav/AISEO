"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

export default function SignupPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Redirige vers le tableau de bord si déjà connecté
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    // Stocker l'information que l'utilisateur vient de s'inscrire
    if (typeof window !== "undefined") {
      localStorage.setItem("isNewUser", "true");
      // Indiquer que c'est une inscription via Google
      localStorage.setItem("googleSignup", "true");
    }

    try {
      await signIn("google", { callbackUrl: "/api/auth/session-redirect" });
      // Note: Cette ligne ne sera pas atteinte si la redirection fonctionne
    } catch (error) {
      console.error("Erreur lors de l'inscription avec Google:", error);
      setAuthError("Une erreur est survenue lors de l'inscription avec Google");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Réinitialiser les erreurs
    setNameError("");
    setCompanyError("");
    setEmailError("");
    setPasswordError("");
    setAuthError(null);

    // Validation du nom
    if (!name.trim()) {
      setNameError("Le nom est requis.");
      return;
    }

    // Validation de l'email
    if (!email) {
      setEmailError("L'email est requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Veuillez entrer une adresse email valide.");
      return;
    }

    // Validation du mot de passe
    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      // Créer le compte
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Stocker l'email dans le localStorage pour la page d'abonnement
      localStorage.setItem("pendingSignupEmail", email);

      // Rediriger directement vers la page d'abonnement
      router.push("/login");
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      setAuthError(
        error.message ||
          "Une erreur inattendue s'est produite. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
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
            Créer un compte
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

        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* Google Sign-up */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50 text-texte-description-black font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FcGoogle size={20} />
            <span>S&apos;inscrire avec Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Ou s&apos;inscrire avec email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-texte-description-black">
                Nom complet
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`mt-1 ${nameError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="company" className="text-texte-description-black">
                Entreprise (optionnel)
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Nom de votre entreprise"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`mt-1 ${companyError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {companyError && (
                <p className="text-red-500 text-xs mt-1">{companyError}</p>
              )}
            </div>

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
                autoComplete="new-password"
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

            <Button
              type="submit"
              className="w-full px-8 py-4 bg-bg-bouton-classic hover:bg-bg-bouton-hover text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                "Inscription en cours..."
              ) : (
                <>
                  <User size={16} className="mr-2" />
                  Créer un compte
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-texte-description-black">
          Vous avez déjà un compte ?
          <Link
            href="/login"
            className="ml-1 font-medium text-texte-header-black hover:opacity-80"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
