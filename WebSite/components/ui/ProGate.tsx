import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface Props {
  feature: string;
  description?: string;
  /** Pass children to show a blurred preview behind the gate */
  children?: React.ReactNode;
}

/**
 * Wraps a Pro-only feature.
 * - Shows a blurred preview of children (if provided)
 * - Overlay with lock icon + upgrade CTA
 */
export default function ProGate({ feature, description, children }: Props) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-violet-100">
      {/* Blurred preview */}
      {children && (
        <div className="pointer-events-none select-none blur-sm opacity-40 max-h-48 overflow-hidden">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div
        className={`${children ? "absolute inset-0" : "py-12"} flex flex-col items-center justify-center bg-gradient-to-b from-white/80 to-violet-50/90 backdrop-blur-sm text-center px-6`}
      >
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
            Pro
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">{feature}</p>
        {description && (
          <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
            {description}
          </p>
        )}
        <Link
          href="/settings#subscription"
          className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
        >
          Passer au plan Pro — €59/mois
        </Link>
      </div>
    </div>
  );
}
