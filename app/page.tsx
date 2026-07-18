"use client";

import React, { useState, useCallback } from "react";
import HomeView from "@/components/HomeView";
import LoadingView from "@/components/LoadingView";
import ResultView from "@/components/ResultView";
import { TripRequest, TripPlan } from "@/lib/types";

type Page = "home" | "loading" | "result";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [stages, setStages] = useState<{ stage: string; message: string }[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [travelers, setTravelers] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (request: TripRequest) => {
    setCurrentPage("loading");
    setStages([]);
    setError(null);
    setTravelers(request.params?.travelers || 1);

    try {
      const response = await fetch("/api/trip/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("请求失败，请重试");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (eventType === "progress") {
                setStages((prev) => [...prev, data]);
              } else if (eventType === "complete") {
                setTripPlan(data.plan);
                setTimeout(() => setCurrentPage("result"), 500);
              } else if (eventType === "error") {
                setError(data.message);
                setTimeout(() => setCurrentPage("home"), 2000);
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setTimeout(() => setCurrentPage("home"), 2000);
    }
  }, []);

  const handleBack = useCallback(() => {
    setCurrentPage("home");
    setTripPlan(null);
    setStages([]);
  }, []);

  return (
    <div className="travel-journal w-full min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="paper-fleck paper-fleck-left" aria-hidden="true" />
      <div className="paper-fleck paper-fleck-right" aria-hidden="true" />

      {/* 手机模拟器容器 */}
      <div data-phone-container className="paper-phone relative w-full max-w-[390px] h-[844px] overflow-hidden flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {currentPage === "home" && (
            <div className="w-full h-full animate-[fadeIn_0.4s_ease-out]">
              <HomeView onSubmit={handleSubmit} />
            </div>
          )}
          {currentPage === "loading" && (
            <div className="w-full h-full animate-[slideInRight_0.4s_ease-out]">
              <LoadingView
                onComplete={() => setCurrentPage("result")}
                stages={stages}
              />
            </div>
          )}
          {currentPage === "result" && tripPlan && (
            <div className="w-full h-full animate-[slideInUp_0.4s_ease-out]">
              <ResultView plan={tripPlan} onBack={handleBack} onPlanUpdate={setTripPlan} travelers={travelers} />
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-red-500 text-white text-[14px] rounded-lg shadow-lg z-[100]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
