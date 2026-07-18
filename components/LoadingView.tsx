"use client";

import React, { useEffect, useState } from "react";
import { PlaneIcon } from "./JournalIcons";

interface LoadingViewProps {
  onComplete: () => void;
  stages: { stage: string; message: string }[];
}

const STEPS = [
  { key: "analyzing", label: "分析旅行需求" },
  { key: "searching", label: "搜索目的地信息" },
  { key: "planning", label: "规划最优路线" },
  { key: "budgeting", label: "计算预算明细" },
  { key: "generating", label: "生成推荐方案" },
];

export default function LoadingView({ onComplete, stages }: LoadingViewProps) {
  const [elapsed, setElapsed] = useState(0);

  // 计算已完成到哪一步（由真实 SSE 事件驱动）
  const completedStages = new Set(stages.map((s) => s.stage));
  const currentStepIndex = STEPS.findIndex((step) => !completedStages.has(step.key));
  // -1 means all done, otherwise it's the index of the current in-progress step
  const activeStep = currentStepIndex === -1 ? STEPS.length : currentStepIndex;

  // 已用时间计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 计算提示文案
  const getTimeHint = () => {
    if (activeStep >= STEPS.length) return "即将呈现结果...";
    if (elapsed < 5) return "AI 正在思考中...";
    if (elapsed < 15) return `已用时 ${elapsed} 秒`;
    return `已用时 ${elapsed} 秒，请耐心等待`;
  };

  return (
    <div className="paper-loading w-full h-full flex flex-col items-center pt-[22%]">
      {/* 旋转动画 */}
      <div className="paper-loading-spinner relative w-20 h-20 flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-[var(--paper-light)] border border-[var(--line)] rounded-full flex items-center justify-center shadow-sm">
          <PlaneIcon className="w-10 h-10" />
        </div>
      </div>

      <h2 className="text-[18px] font-medium text-[var(--ink)] mt-5">
        正在为您规划完美行程...
      </h2>

      {/* 步骤列表 — 完全由真实事件驱动 */}
      <div className="mt-8 w-full max-w-[260px] flex flex-col">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;

          return (
            <div key={step.key} className="flex items-center h-11">
              <div className="w-5 flex items-center justify-center mr-3">
                {isCompleted && (
                  <div className="w-[18px] h-[18px] rounded-full bg-[var(--olive)] flex items-center justify-center animate-[scaleBounce_0.5s_ease-out]">
                    <svg className="w-[10px] h-[10px] text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                {isCurrent && (
                  <div className="w-4 h-4 rounded-full border-2 border-t-[var(--ink)] border-r-[var(--ink)] border-b-transparent border-l-transparent animate-spin" />
                )}
                {!isCompleted && !isCurrent && (
                  <div className="w-4 h-4 rounded-full border-2 border-[#9CA3AF] opacity-50" />
                )}
              </div>
              <span
                className={`text-[14px] transition-colors duration-300 ${
                  isCompleted
                    ? "text-[var(--ink)]"
                    : isCurrent
                    ? "text-[var(--ink)] font-medium"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 时间提示 — 用已用时替代倒计时 */}
      <div className="mt-8 text-[13px] text-[var(--ink-muted)] tabular-nums">
        {getTimeHint()}
      </div>
    </div>
  );
}
