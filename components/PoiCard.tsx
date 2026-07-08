"use client";

import React from "react";

const TYPE_COLORS: Record<string, string> = {
  attraction: "#6366F1",
  restaurant: "#F59E0B",
  hotel: "#10B981",
  transport: "#6B7280",
};

const TYPE_LABELS: Record<string, string> = {
  attraction: "🏛 景点",
  restaurant: "🍽 餐厅",
  hotel: "🏨 住宿",
  transport: "🚗 交通",
};

interface PoiCardProps {
  data: {
    type: string;
    name: string;
    description: string;
    time: string;
    duration: number;
    cost: number;
    rating?: number;
    location: { address: string };
    transportToNext?: {
      mode: string;
      duration: number;
      distance: number;
      cost: number;
    } | null;
  };
}

const MODE_ICONS: Record<string, string> = {
  walking: "🚶",
  driving: "🚗",
  transit: "🚌",
  cycling: "🚲",
};

export default function PoiCard({ data }: PoiCardProps) {
  const borderColor = TYPE_COLORS[data.type] || "#ccc";

  const formatDuration = (min: number) => {
    if (min >= 60) return `${Math.floor(min / 60)}小时${min % 60 ? min % 60 + "分钟" : ""}`;
    return `${min}分钟`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return "免费";
    return `¥${cost}`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${meters}m`;
  };

  return (
    <div className="relative flex flex-col">
      <div className="relative w-full bg-white rounded-[16px] shadow-[0_1px_3px_rgba(99,102,241,0.04),0_4px_12px_rgba(99,102,241,0.06)] p-4 overflow-hidden transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(99,102,241,0.08),0_12px_32px_rgba(99,102,241,0.12)]">
        <div
          className="absolute left-0 top-0 bottom-0 w-[4px]"
          style={{ backgroundColor: borderColor }}
        />

        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-[16px] font-bold text-[#1E1B4B] flex-1 min-w-0">{data.name}</span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full border opacity-90 whitespace-nowrap flex-shrink-0"
            style={{
              borderColor,
              color: borderColor,
              backgroundColor: `${borderColor}1A`,
            }}
          >
            {TYPE_LABELS[data.type] || data.type}
          </span>
        </div>

        <p className="text-[13px] text-[#6B7280] mb-3 leading-relaxed">
          {data.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#9CA3AF]">
          {data.duration > 0 && <span>⏱ {formatDuration(data.duration)}</span>}
          {data.rating && <span>⭐ {data.rating}</span>}
          <span>💰 {formatCost(data.cost)}</span>
          <span>📍 {data.location.address}</span>
        </div>
      </div>

      {data.transportToNext && (
        <div className="flex items-center h-10 pl-6 text-[13px] text-[#9CA3AF]">
          <div className="w-[2px] h-[30px] border-l-[2px] border-dashed border-[#9CA3AF] opacity-30 mr-4" />
          <span>
            {MODE_ICONS[data.transportToNext.mode] || "🚶"}{" "}
            {formatDuration(data.transportToNext.duration)} ·{" "}
            {formatDistance(data.transportToNext.distance)}
            {data.transportToNext.cost > 0 && (
              <span className="text-[#F59E0B] ml-1.5">¥{data.transportToNext.cost}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
