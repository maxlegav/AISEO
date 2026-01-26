// components/EmailPopup.tsx
import { useState, FormEvent, useEffect } from "react";
import { X } from "lucide-react";

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailPopup({ isOpen, onClose }: EmailPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Close popup automatically after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/submit-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-opacity">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative shadow-xl border border-border-image animate-popup">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-texte-header-green transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 text-texte-header-green">
            Vous souhaitez en voir plus ?
          </h2>
          <p className="text-texte-description-black">
            Nous avons actuellement beaucoup de demandes face aux nombreuses demandes d&apos;inscription.
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-bg-bouton-secondary p-4 rounded-md text-center mb-4 border border-bg-bouton-classic animate-opacity">
            <p className="text-texte-header-green font-medium">
              Merci, nous vous contacterons très bientôt avec des informations
              détaillées !
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-center mb-4 border border-red-200 animate-opacity">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-texte-description-black mb-2 font-medium">
                Adresse Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-bg-bouton-classic focus:border-bg-bouton-classic transition-all duration-200"
                placeholder="votre@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-bg-bouton-classic hover:bg-bg-bouton-hover text-white py-3 px-4 rounded-md transition duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi en cours..." : "Je participe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
