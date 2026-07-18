"use client";

import React, { useState, useEffect } from "react";
import { BudgetBreakdown, DayPlan } from "@/lib/types";

interface BudgetViewProps {
  budget: BudgetBreakdown;
  days: DayPlan[];
  travelers?: number;
}

const BUDGET_CATEGORIES = [
  { key: "transport", label: "交通", icon: "01", color: "#2f2b25", types: ["transport"] },
  { key: "accommodation", label: "住宿", icon: "02", color: "#6f604d", types: ["hotel"] },
  { key: "food", label: "餐饮", icon: "03", color: "#a4814e", types: ["restaurant"] },
  { key: "tickets", label: "门票", icon: "04", color: "#747963", types: ["attraction"] },
  { key: "other", label: "其他", icon: "05", color: "#aaa08e", types: [] },
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
    <div className="journal-screen journal-budget flex-1 overflow-y-auto px-5 pt-6 pb-10">
      {/* 总预算 */}
      <div className="journal-budget-summary text-center mb-8">
        <div className="text-[14px] text-[var(--ink-soft)] mb-1">总预算</div>
        <div className="journal-budget-total text-[34px] font-bold tabular-nums leading-none mb-2">
          ¥{displayTotal.toLocaleString()}
        </div>
        <div className="text-[13px] text-[var(--ink-soft)]">
          {travelers && travelers > 1
            ? `人均 ¥${Math.round(budget.total / travelers).toLocaleString()}`
            : ""}
        </div>
      </div>

      {/* 环形图 */}
      <div className="journal-budget-overview p-6 mb-6 flex flex-col items-center">
        <div className="journal-budget-ring relative w-[166px] h-[166px] flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${gradientStops})`, ...maskStyle }}
          />
          <div className="journal-budget-ring-center absolute w-[112px] h-[112px] rounded-full flex flex-col items-center justify-center">
            <span className="text-[12px] text-[var(--ink-muted)] mb-0.5">预估花费</span>
            <span className="text-[16px] font-bold text-[var(--ink)]">
              ¥{budget.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 图例 */}
        <div className="journal-budget-legend w-full space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[var(--ink)] font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--ink-soft)]">¥{item.amount.toLocaleString()}</span>
                <span className="w-9 text-right font-medium" style={{ color: item.color }}>
                  {item.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 明细列表 */}
      <div className="journal-budget-details space-y-3">
        {items.map((item) => (
          <div key={item.key} className="overflow-hidden">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
              className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full border border-[var(--line-strong)] flex items-center justify-center text-[10px] font-semibold">{item.icon}</span>
                <span className="text-[15px] font-semibold text-[var(--ink)]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[var(--ink)]">
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
                        <span className="w-1 h-1 rounded-full bg-[var(--ink-muted)]" />
                        <span className="text-[var(--ink-soft)]">
                          {detail.day > 0 && (
                            <span className="inline-block bg-[var(--paper-deep)] text-[var(--ink-soft)] text-[11px] px-1.5 py-0.5 rounded mr-1.5">
                              Day{detail.day}
                            </span>
                          )}
                          {detail.name}
                        </span>
                      </div>
                      <span className="text-[var(--ink)] font-medium tabular-nums">
                        {detail.cost > 0 ? `¥${detail.cost.toLocaleString()}` : "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-[var(--ink-muted)]">暂无明细</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
