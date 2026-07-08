"use client";

import React, { useState, useEffect, useRef } from "react";
import { DayPlan } from "@/lib/types";

interface MapViewProps {
  days: DayPlan[];
}

const TYPE_COLORS: Record<string, string> = {
  attraction: "#6366F1",
  restaurant: "#F59E0B",
  hotel: "#10B981",
  transport: "#6B7280",
};

const TYPE_ICONS: Record<string, string> = {
  attraction: "🏛",
  restaurant: "🍽",
  hotel: "🏨",
  transport: "🚗",
};

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

export default function MapView({ days }: MapViewProps) {
  const [activeDay, setActiveDay] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const currentDay = days[activeDay];
  const items = currentDay?.items || [];

  // 加载高德地图
  useEffect(() => {
    if (window.AMap) {
      setMapReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://webapi.amap.com/maps?v=2.0&key=e3531f70320cce32ba041c71a432a5e6";
    script.async = true;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  // 初始化地图实例（延迟以确保容器已渲染）
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapInstanceRef.current) return;

    // 等待一帧确保容器已有尺寸
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const map = new window.AMap.Map(mapContainerRef.current, {
        zoom: 13,
        viewMode: "2D",
      });
      mapInstanceRef.current = map;
    }, 100);

    return () => clearTimeout(timer);
  }, [mapReady]);

  // 切换 Day 时更新标注和路线
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || items.length === 0) return;

    // 清除旧标注
    markersRef.current.forEach((m) => map.remove(m));
    polylinesRef.current.forEach((p) => map.remove(p));
    markersRef.current = [];
    polylinesRef.current = [];

    const path: [number, number][] = [];

    items.forEach((item, idx) => {
      if (!item.location?.lng || !item.location?.lat) return;

      const pos: [number, number] = [item.location.lng, item.location.lat];
      path.push(pos);

      const color = TYPE_COLORS[item.type] || "#6B7280";
      const icon = TYPE_ICONS[item.type] || "📍";
      const shortName = item.name.length > 5 ? item.name.slice(0, 5) + "…" : item.name;

      const content = document.createElement("div");
      content.style.cssText = `
        display:flex; align-items:center; gap:3px;
        background:${color}; color:white;
        border-radius:14px; padding:3px 8px 3px 5px;
        font-size:11px; font-weight:600;
        box-shadow:0 2px 6px rgba(0,0,0,0.2);
        white-space:nowrap; border:2px solid white;
      `;
      content.innerHTML = `<span style="font-size:13px">${icon}</span><span>${idx + 1}.${shortName}</span>`;

      const marker = new window.AMap.Marker({
        position: pos,
        content,
        anchor: "center",
      });

      map.add(marker);
      markersRef.current.push(marker);
    });

    // 画路线
    if (path.length > 1) {
      const polyline = new window.AMap.Polyline({
        path,
        strokeColor: "#6366F1",
        strokeWeight: 4,
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        strokeDasharray: [8, 4],
        lineJoin: "round",
      });
      map.add(polyline);
      polylinesRef.current.push(polyline);
    }

    // 自适应视野
    map.setFitView(null, false, [50, 50, 50, 50]);
  }, [activeDay, mapReady, items]);

  // 统计
  const totalDistance = items.reduce((s, i) => s + (i.transportToNext?.distance || 0), 0);
  const walkCount = items.filter((i) => i.transportToNext?.mode === "walking").length;
  const driveCount = items.filter((i) => i.transportToNext?.mode === "driving").length;
  const transitCount = items.filter((i) => i.transportToNext?.mode === "transit").length;
  const cycleCount = items.filter((i) => i.transportToNext?.mode === "cycling").length;

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-white overflow-hidden">
      {/* 地图容器 — 固定高度 */}
      <div className="relative w-full flex-shrink-0 h-[340px] bg-[#E8F4F8]">
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FF]">
            <span className="text-[14px] text-[#6B7280] animate-pulse">地图加载中...</span>
          </div>
        )}
      </div>

      {/* 底部面板 */}
      <div className="flex-1 w-full bg-white z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex flex-col relative pt-2 pb-4" style={{ borderRadius: "20px 20px 0 0", marginTop: "-16px" }}>
        <div className="w-full flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Day 切换 */}
        <div className="w-full px-5 pb-3 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`flex-shrink-0 h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeDay === idx
                    ? "bg-[#6366F1] text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                    : "bg-white border border-[rgba(99,102,241,0.08)] text-[#6B7280]"
                }`}
              >
                Day{day.day}
              </button>
            ))}
          </div>
        </div>

        {/* 统计 */}
        <div className="px-5 pt-1">
          <div className="w-full bg-gray-50 rounded-xl p-3">
            <p className="text-[14px] text-gray-500 font-medium text-center">
              总距离 {(totalDistance / 1000).toFixed(1)}km
              {walkCount > 0 && ` · 步行${walkCount}段`}
              {cycleCount > 0 && ` · 骑行${cycleCount}段`}
              {transitCount > 0 && ` · 公交${transitCount}段`}
              {driveCount > 0 && ` · 打车${driveCount}段`}
            </p>
          </div>
          {currentDay && (
            <p className="mt-2 text-[13px] text-gray-400 text-center">📍 {currentDay.theme}</p>
          )}
        </div>
      </div>
    </div>
  );
}
