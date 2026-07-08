"use client";

import React, { useState } from "react";
import { TripPlan } from "@/lib/types";
import ScheduleView from "./ScheduleView";
import MapView from "./MapView";
import BudgetView from "./BudgetView";
import ChatBubble from "./ChatBubble";

interface ResultViewProps {
  plan: TripPlan;
  onBack: () => void;
  onPlanUpdate: (plan: TripPlan) => void;
  travelers?: number;
}

const TABS = [
  { id: "schedule", label: "📋 日程" },
  { id: "map", label: "🗺 地图" },
  { id: "budget", label: "💰 预算" },
] as const;

export default function ResultView({ plan, onBack, onPlanUpdate, travelers }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [showToast, setShowToast] = useState<string | null>(null);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFBFE] overflow-hidden">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 w-full h-14 flex items-center justify-between px-5 bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] border-b border-[rgba(99,102,241,0.08)]">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-[14px] active:scale-95 transition-transform"
        >
          ←
        </button>
        <h1 className="text-[16px] font-semibold text-[#1E1B4B]">
          {plan.destination}
        </h1>
        <button
          onClick={() => toast("链接已复制")}
          className="w-8 h-8 flex items-center justify-center text-[16px] active:scale-95 transition-transform"
        >
          🔗
        </button>
      </div>

      {/* 摘要卡 */}
      <div className="relative w-full px-5 py-4 bg-white">
        <h2 className="text-[20px] font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
          {plan.title}
        </h2>
        <div className="mt-1.5 text-[14px] text-[#6B7280]">
          预计{" "}
          <span className="text-[#F59E0B] font-medium">
            ¥{plan.budget.total.toLocaleString()}
          </span>
          {travelers && travelers > 1 && (
            <span className="text-[#9CA3AF]"> · 人均 ¥{Math.round(plan.budget.total / travelers).toLocaleString()}</span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.3)] to-transparent" />
      </div>

      {/* Tab 栏 */}
      <div className="sticky top-14 z-40 w-full bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] border-b border-[rgba(99,102,241,0.08)]">
        <div className="relative flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 h-11 text-[14px] transition-colors duration-300 ${
                activeTab === tab.id
                  ? "text-[#6366F1] font-semibold"
                  : "text-[#6B7280]"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div
            className="absolute bottom-0 h-[3px] rounded-t-[3px] transition-all duration-300 ease-out"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            }}
          >
            <div className="absolute inset-0 bg-[#6366F1] blur-[4px] opacity-50" />
          </div>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "schedule" && <ScheduleView days={plan.days} />}
        {activeTab === "map" && <MapView days={plan.days} />}
        {activeTab === "budget" && <BudgetView budget={plan.budget} days={plan.days} travelers={travelers} />}
      </div>

      {/* 底部操作栏 */}
      <div className="w-full h-[76px] bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] border-t border-[rgba(99,102,241,0.08)] px-5 flex items-center justify-between gap-3 pb-[15px]">
        <button
          onClick={onBack}
          className="flex-1 h-[46px] rounded-xl bg-white border border-[#6366F1] text-[#6366F1] font-medium text-[14px] active:scale-95 transition-transform"
        >
          🔄 重新生成
        </button>
        <button
          onClick={() => toast("行程已保存")}
          className="flex-1 h-[46px] rounded-xl text-white font-medium text-[14px] shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
        >
          💾 保存行程
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-[#333] text-white text-[14px] rounded-lg shadow-lg z-[100] animate-[fadeInUp_0.3s_ease-out]">
          {showToast}
        </div>
      )}

      {/* AI 对话助手悬浮球 */}
      <ChatBubble plan={plan} onPlanUpdate={onPlanUpdate} />
    </div>
  );
}
