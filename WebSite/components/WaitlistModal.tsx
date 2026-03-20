import { useEffect, useCallback } from "react";
import { useWaitlistModalStore } from "@/stores";
import { X } from "lucide-react";

export default function WaitlistModal() {
  const { isOpen, closeWaitlistModal } = useWaitlistModalStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape key closes modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") closeWaitlistModal();
  }, [closeWaitlistModal]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center px-4"
      onClick={closeWaitlistModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeWaitlistModal}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 z-10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-[620px] sm:h-[680px]">
            <iframe
              src="https://cal.com/showyourbrand/presentation-of-showyourbrand?embed=true&theme=light"
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title="Book a call with ShowYourBrand"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
