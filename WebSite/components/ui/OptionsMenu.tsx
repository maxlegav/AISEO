import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/LanguageContext";

interface Option {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
}

interface OptionsMenuProps {
  options: Option[];
  disabled?: boolean;
}

export default function OptionsMenu({
  options,
  disabled = false,
}: OptionsMenuProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label={language === "fr" ? "Options" : "Options"}
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option.action)}
                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                  option.variant === "danger"
                    ? "text-red-700 hover:bg-red-50 focus:bg-red-50"
                    : "text-gray-700"
                }`}
              >
                {option.icon && (
                  <span className="mr-3 flex-shrink-0">{option.icon}</span>
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
