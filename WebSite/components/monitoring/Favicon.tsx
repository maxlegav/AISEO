import { useState } from "react";
import { cn } from "@/lib/utils";

/** Extract a bare host (no scheme, no www, no path) from a URL or domain. */
function hostOf(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

/**
 * Site favicon for a brand/source, with a graceful fallback to the first letter
 * in a gradient tile when the icon can't be loaded (unknown host, offline, etc.).
 * Used instead of a plain letter avatar so each project/source is recognizable.
 */
export default function Favicon({
  source,
  label,
  size = 28,
  rounded = "rounded-lg",
  className,
}: {
  /** A URL or domain to fetch the favicon for. */
  source: string;
  /** Text used for the fallback initial + alt. */
  label: string;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const host = hostOf(source);
  const [failed, setFailed] = useState(false);
  const initial = (label || host || "?").charAt(0).toUpperCase();

  if (!host || failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-ink-900 font-bold text-white",
          rounded,
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        aria-hidden
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
      alt={`${label} favicon`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-white object-contain", rounded, className)}
      style={{ width: size, height: size }}
    />
  );
}
