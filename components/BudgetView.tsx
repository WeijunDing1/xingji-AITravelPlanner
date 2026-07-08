"use client";

import React, { useState, useEffect } from "react";
import { BudgetBreakdown, DayPlan } from "@/lib/types";

interface BudgetViewProps {
  budget: BudgetBreakdown;
  days: DayPlan[];
  travelers?: number;
}

const BUDGET_CATEGORIES = [
  { key: "transport", label: "交通", icon: "🚗", color: "#6366F1", types: ["transport"] },
  { key: "accommodation", label: "住宿", icon: "🏨", color: "#8B5CF6", types: ["hotel"] },
  { key: "food", label: "餐饮", icon: "🍜", color: "#F59E0B", types: ["restaurant"] },
  { key: "tickets", label: "门票", icon: "🎫", color: "#10B981", types: ["attraction"] },
  { key: "other", label: "其他", icon: "🛍", color: "#9CA3AF", types: [] },
] as const;

interface DetailItem {
  day: number;
  name: string;
  cost: number;
  type: string;
}

export default function BudgetView({ budget, days, travelers }: BudgetViewProps) {
  const [displayTotal, setDisplayTotal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let start: number | null = null;
    const duration = 1000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - p, 3);

      setDisplayTotal(Math.floor(easeOut * budget.total));
      setProgress(easeOut);

      if (p < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [budget.total]);

  // 从行程数据中提取各类别的具体明细
  const detailsByCategory: Record<string, DetailItem[]> = {
    transport: [],
    accommodation: [],
    food: [],
    tickets: [],
    other: [],
  };

  for (const day of days) {
    for (const item of day.items) {
      // 提取交通段费用
      if (item.transportToNext && item.transportToNext.cost > 0) {
        const modeLabels: Record<string, string> = {
          walking: "步行",
          driving: "打车",
          transit: "公共交通",
          cycling: "骑行",
        };
        detailsByCategory.transport.push({
          day: day.day,
          name: `${item.name} → ${modeLabels[item.transportToNext.mode] || "交通"}`,
          cost: item.transportToNext.cost,
          type: "transport",
        });
      }

      if (item.cost <= 0 && item.type !== "hotel") continue;

      const detail: DetailItem = {
        day: day.day,
        name: item.name,
        cost: item.cost,
        type: item.type,
      };

      if (item.type === "hotel") {
        detailsByCategory.accommodation.push(detail);
      } else if (item.type === "restaurant") {
        detailsByCategory.food.push(detail);
      } else if (item.type === "attraction" && item.cost > 0) {
        detailsByCategory.tickets.push(detail);
      } else if (item.type === "transport") {
        detailsByCategory.transport.push(detail);
      }
    }
  }

  // 如果交通明细合计小于 budget.transport，差额归为大交通
  const transportDetailTotal = detailsByCategory.transport.reduce((sum, d) => sum + d.cost, 0);
  if (budget.transport > transportDetailTotal + 10) {
    detailsByCategory.transport.unshift({
      day: 0,
      name: "大交通（机票/高铁等）",
      cost: budget.transport - transportDetailTotal,
      type: "transport",
    });
  }

  // 其他类
  if (budget.other > 0) {
    detailsByCategory.other.push({
      day: 0,
      name: "伴手礼 / 零食 / 杂项",
      cost: budget.other,
      type: "other",
    });
  }

  const items = BUDGET_CATEGORIES.map((cat) => ({
    ...cat,
    amount: budget[cat.key as keyof BudgetBreakdown] as number,
    percent: Math.round(
      ((budget[cat.key as keyof BudgetBreakdown] as number) / budget.total) * 100
    ),
    details: detailsByCategory[cat.key] || [],
  }));

  let currentAccum = 0;
  const gradientStops = items
    .map((item) => {
      const start = currentAccum;
      const end = currentAccum + item.percent;
      currentAccum = end;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  const maskStyle = {
    WebkitMaskImage: `conic-gradient(#000 ${progress * 100}%, transparent ${progress * 100}%, transparent 100%)`,
    maskImage: `conic-gradient(#000 ${progress * 100}%, transparent ${progress * 100}%, transparent 100%)`,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFBFE] px-5 pt-6 pb-10">
      {/* 总预算 */}
      <div className="text-center mb-8">
        <div className="text-[14px] text-[#6B7280] mb-1">总预算</div>
        <div className="text-[32px] font-bold text-[#F59E0B] tabular-nums leading-none mb-2">
          ¥{displayTotal.toLocaleString()}
        </div>
        <div className="text-[13px] text-[#6B7280]">
          {travelers && travelers > 1
            ? `人均 ¥${Math.round(budget.total / travelers).toLocaleString()}`
            : ""}
        </div>
      </div>

      {/* 环形图 */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_3px_rgba(99,102,241,0.04),0_4px_12px_rgba(99,102,241,0.06)] mb-6 flex flex-col items-center">
        <div className="relative w-[180px] h-[180px] flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${gradientStops})`, ...maskStyle }}
          />
          <div className="absolute w-[120px] h-[120px] bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)]">
            <span className="text-[12px] text-[#9CA3AF] mb-0.5">预估花费</span>
            <span className="text-[16px] font-bold text-[#1E1B4B]">
              ¥{budget.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 图例 */}
        <div className="w-full space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#1E1B4B] font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#6B7280]">¥{item.amount.toLocaleString()}</span>
                <span className="w-9 text-right font-medium" style={{ color: item.color }}>
                  {item.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 明细列表 */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
              className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[18px]">{item.icon}</span>
                <span className="text-[15px] font-semibold text-[#1E1B4B]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#1E1B4B]">
                  ¥{item.amount.toLocaleString()}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expanded[item.key] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${expanded[item.key] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="px-4 pb-4 space-y-2">
                {item.details.length > 0 ? (
                  item.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#9CA3AF]" />
                        <span className="text-[#6B7280]">
                          {detail.day > 0 && (
                            <span className="inline-block bg-[#F3F4F6] text-[#6B7280] text-[11px] px-1.5 py-0.5 rounded mr-1.5">
                              Day{detail.day}
                            </span>
                          )}
                          {detail.name}
                        </span>
                      </div>
                      <span className="text-[#1E1B4B] font-medium tabular-nums">
                        {detail.cost > 0 ? `¥${detail.cost.toLocaleString()}` : "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-[#9CA3AF]">暂无明细</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
