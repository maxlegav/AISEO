import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { LLMId, LLMS } from "@/lib/mock/monitoring";
import { cn } from "@/lib/utils";

export function scoreColor(v: number): string {
  if (v >= 60) return "#16a34a";
  if (v >= 40) return "#d97706";
  return "#dc2626";
}

export function scoreLabel(v: number): string {
  if (v >= 60) return "Fort";
  if (v >= 40) return "Moyen";
  if (v >= 20) return "Faible";
  return "Critique";
}

export function DeltaBadge({
  value,
  suffix = " pts",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const positive = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        flat
          ? "bg-gray-100 text-gray-500"
          : positive
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-600",
        className
      )}
    >
      {flat ? (
        <Minus className="h-3 w-3" />
      ) : positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export function LLMBadge({
  llm,
  size = 20,
  showName = true,
}: {
  llm: LLMId;
  size?: number;
  showName?: boolean;
}) {
  const meta = LLMS[llm];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Image
        src={meta.logo}
        alt={meta.name}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showName && (
        <span className="text-sm font-medium text-gray-700">{meta.name}</span>
      )}
    </span>
  );
}

export function ScoreRing({
  value,
  size = 132,
  stroke = 11,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = scoreColor(value);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ececf3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-[11px] font-medium" style={{ color }}>
          {label ?? scoreLabel(value)}
        </span>
      </div>
    </div>
  );
}

export function MiniBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, backgroundColor: scoreColor(value) }}
      />
    </div>
  );
}
