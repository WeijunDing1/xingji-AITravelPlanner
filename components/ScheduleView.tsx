"use client";

import React, { useState } from "react";
import PoiCard from "./PoiCard";
import { DayPlan } from "@/lib/types";

interface ScheduleViewProps {
  days: DayPlan[];
}

export default function ScheduleView({ days }: ScheduleViewProps) {
  const [activeDay, setActiveDay] = useState(0);

  const currentDay = days[activeDay];

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFE] overflow-hidden">
      {/* Day 横向切换条 */}
      <div className="w-full flex-shrink-0 px-5 py-3 bg-[#FAFBFE] border-b border-[rgba(99,102,241,0.08)] overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max">
          {days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDay(idx)}
              className={`flex-shrink-0 h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-300 ${
                activeDay === idx
                  ? "bg-[#6366F1] text-white scale-105 shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                  : "bg-white border border-[rgba(99,102,241,0.08)] text-[#6B7280]"
              }`}
            >
              Day{day.day}
            </button>
          ))}
        </div>
      </div>

      {/* 日程时间线 */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {currentDay && (
          <div className="relative w-full">
            <div className="absolute left-[40px] top-[10px] bottom-[20px] w-[2px] bg-gradient-to-b from-[#6366F1] to-transparent opacity-30" />

            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-[#1E1B4B]">
                📍 Day {currentDay.day} · {currentDay.theme}
              </h3>
            </div>

            <div className="flex flex-col gap-0">
              {currentDay.items.map((item, idx) => (
                <div key={idx} className="relative flex items-start">
                  <div className="w-12 flex-shrink-0 flex flex-col items-center pt-3.5">
                    <span className="text-[13px] font-semibold text-[#1E1B4B]">
                      {item.time}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[#6366F1] mt-1.5 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]" />
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
