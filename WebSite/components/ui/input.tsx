"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // Styles de base pour l'input (ajustez selon votre charte)
        // Ces classes utilisent souvent des variables de couleur définies dans tailwind.config.js (ex: border-input, ring-ring)
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className // Permet de surcharger ou d'ajouter des classes
        )}
        ref={ref}
        {...props} // Passe toutes les autres props (placeholder, value, onChange, etc.)
      />
    );
  }
);
Input.displayName = "Input"; // Pour le débogage React DevTools

export { Input };
