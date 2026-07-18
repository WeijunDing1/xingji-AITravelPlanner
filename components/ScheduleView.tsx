"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import PoiCard from "./PoiCard";
import { DayPlan } from "@/lib/types";

interface ScheduleViewProps {
  days: DayPlan[];
}

export default function ScheduleView({ days }: ScheduleViewProps) {
  const [activeDay, setActiveDay] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentDay = days[activeDay];

  useLayoutEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeDay]);

  return (
    <div className="journal-screen journal-schedule flex-1 flex flex-col overflow-hidden">
      {/* Day 横向切换条 */}
      <div className="journal-schedule-daybar w-full flex-shrink-0 px-5 py-3 border-b overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max">
          {days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDay(idx)}
              data-selected={activeDay === idx}
              className={`journal-tag flex-shrink-0 h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-300 ${
                activeDay === idx
                  ? "text-white scale-105"
                  : "text-[var(--ink-soft)]"
              }`}
            >
              Day{day.day}
            </button>
          ))}
        </div>
      </div>

      {/* 日程时间线 */}
      <div ref={contentRef} className="journal-schedule-content flex-1 overflow-y-auto px-5 py-6">
        {currentDay && (
          <div className="relative w-full">
            <div className="absolute left-[40px] top-[10px] bottom-[20px] w-px border-l border-dashed border-[#625b50] opacity-45" />

            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-[var(--ink)]">
                📍 Day {currentDay.day} · {currentDay.theme}
              </h3>
            </div>

            <div className="flex flex-col gap-0">
              {currentDay.items.map((item, idx) => (
                <div key={idx} className="relative flex items-start">
                  <div className="w-12 flex-shrink-0 flex flex-col items-center pt-3.5">
                    <span className="text-[13px] font-semibold text-[var(--ink)]">
                      {item.time}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[var(--ink)] mt-1.5 shadow-[0_0_0_3px_rgba(61,52,40,0.16)]" />
                  </div>
                  <div className="flex-1 pl-4 pb-2">
                    <PoiCard data={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
