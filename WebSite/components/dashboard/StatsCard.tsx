import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 mr-4 w-12 h-12 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#0F0F0F]">
              {icon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-[#0F0F0F]">{value}</p>
              {trend && (
                <div
                  className={`ml-3 flex items-center text-xs font-semibold ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span
                    className={`mr-1 ${
                      trend.isPositive ? "rotate-0" : "rotate-180"
                    }`}
                  >
                    ↑
                  </span>
                  {trend.value}%
                </div>
              )}
            </div>
            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
