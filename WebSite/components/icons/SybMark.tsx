/**
 * ShowYourBrand mark: a magnifying glass with sparkles (the brand logo), drawn
 * inline so it scales crisply and inherits `currentColor`. Used wherever the app
 * signals AI / GEO analysis, in place of a generic sparkles icon, for brand
 * consistency.
 */
export default function SybMark({
  className,
  size,
  title,
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {/* lens ring */}
      <circle cx="305" cy="200" r="150" stroke="currentColor" strokeWidth="42" />
      {/* handle */}
      <line
        x1="196"
        y1="308"
        x2="70"
        y2="436"
        stroke="currentColor"
        strokeWidth="70"
        strokeLinecap="round"
      />
      {/* three sparkles inside the lens */}
      <path
        fill="currentColor"
        d="
          M300 130 L318 182 L370 200 L318 218 L300 270 L282 218 L230 200 L282 182 Z
          M370 96 L380 124 L408 134 L380 144 L370 172 L360 144 L332 134 L360 124 Z
          M392 178 L400 200 L422 208 L400 216 L392 238 L384 216 L362 208 L384 200 Z
        "
      />
    </svg>
  );
}
