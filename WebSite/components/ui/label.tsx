"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Utilitaire pour fusionner les classes Tailwind

// Utilisation de React.forwardRef pour pouvoir passer une ref à l'élément label si nécessaire
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    // Styles de base pour le label (ajustez selon votre charte)
    className={cn(
      "text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className // Permet de surcharger ou d'ajouter des classes depuis l'extérieur
    )}
    {...props} // Passe toutes les autres props (comme htmlFor, children, etc.)
  />
));
Label.displayName = "Label"; // Pour le débogage React DevTools

export { Label };
