"use client";

import React, { useState, useEffect, useRef } from "react";
import { DayPlan } from "@/lib/types";

interface MapViewProps {
  days: DayPlan[];
}

const TYPE_COLORS: Record<string, string> = {
  attraction: "#29251f",
  restaurant: "#a35f32",
  hotel: "#5f704f",
  transport: "#8a4f43",
};

const TYPE_ICONS: Record<string, string> = {
  attraction: "景",
  restaurant: "食",
  hotel: "住",
  transport: "行",
};

const DAY_COLORS = ["#29251f", "#a16235", "#65734f", "#8e4f3f", "#536a70", "#735744", "#a07a38", "#505d49"];

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

function getItemPosition(item: DayPlan["items"][number]): [number, number] | null {
  if (!item.location?.lng || !item.location?.lat) return null;
  return [item.location.lng, item.location.lat];
}

function getDistanceMeters(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function getDayArea(path: [number, number][]) {
  const center = path.reduce(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1]] as [number, number],
    [0, 0]
  ).map((value) => value / path.length) as [number, number];

  const maxDistance = path.reduce((max, point) => Math.max(max, getDistanceMeters(center, point)), 0);
  return {
    center,
    radius: Math.max(1200, Math.min(maxDistance + 800, 12000)),
  };
}

export default function MapView({ days }: MapViewProps) {
  const [activeDay, setActiveDay] = useState<number>(-1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  const isOverview = activeDay === -1;
  const currentDay = isOverview ? null : days[activeDay];
  const items = currentDay?.items || [];
  const allItems = days.flatMap((day) => day.items || []);
  const statItems = isOverview ? allItems : items;

  useEffect(() => {
    if (activeDay >= days.length) setActiveDay(-1);
  }, [activeDay, days.length]);

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

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const map = new window.AMap.Map(mapContainerRef.current, {
        zoom: 13,
        viewMode: "2D",
      });
      mapInstanceRef.current = map;
      setMapInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [mapReady]);

  // 切换总览/Day 时更新标注和路线
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapInitialized || !map) return;

    markersRef.current.forEach((marker) => map.remove(marker));
    overlaysRef.current.forEach((overlay) => map.remove(overlay));
    markersRef.current = [];
    overlaysRef.current = [];

    if (isOverview) {
      days.forEach((day, dayIndex) => {
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const path = (day.items || []).map(getItemPosition).filter(Boolean) as [number, number][];
        if (path.length === 0) return;

        const { center, radius } = getDayArea(path);
        const circle = new window.AMap.Circle({
          center,
          radius,
          strokeColor: color,
          strokeWeight: 2,
          strokeOpacity: 0.65,
          fillColor: color,
          fillOpacity: 0.12,
          zIndex: 8,
        });
        map.add(circle);
        overlaysRef.current.push(circle);

        if (path.length > 1) {
          const polyline = new window.AMap.Polyline({
            path,
            strokeColor: color,
            strokeWeight: 4,
            strokeOpacity: 0.85,
            strokeStyle: "solid",
            lineJoin: "round",
            zIndex: 12,
          });
          map.add(polyline);
          overlaysRef.current.push(polyline);
        }

        const content = document.createElement("div");
        content.style.cssText = `
          display:flex; align-items:center; gap:4px;
          background:${color}; color:white;
          border-radius:16px; padding:4px 9px;
          font-size:12px; font-weight:700;
          box-shadow:0 3px 10px rgba(0,0,0,0.22);
          white-space:nowrap; border:2px solid #fbf4e4;
        `;
        content.innerHTML = `<span>Day${day.day}</span>`;

        const marker = new window.AMap.Marker({
          position: path[0],
          content,
          anchor: "center",
          zIndex: 20,
        });
        map.add(marker);
        markersRef.current.push(marker);
      });
    } else {
      const path: [number, number][] = [];

      items.forEach((item, idx) => {
        const pos = getItemPosition(item);
        if (!pos) return;
        path.push(pos);

        const color = TYPE_COLORS[item.type] || "#5f574b";
        const icon = TYPE_ICONS[item.type] || "📍";
        const shortName = item.name.length > 5 ? item.name.slice(0, 5) + "…" : item.name;

        const content = document.createElement("div");
        content.style.cssText = `
          display:flex; align-items:center; gap:3px;
          background:${color}; color:white;
          border-radius:14px; padding:3px 8px 3px 5px;
          font-size:11px; font-weight:600;
          box-shadow:0 3px 8px rgba(32,29,24,0.3);
          white-space:nowrap; border:2px solid #fbf4e4;
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

      if (path.length > 1) {
        const polyline = new window.AMap.Polyline({
          path,
          strokeColor: "#2b2822",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          strokeStyle: "dashed",
          strokeDasharray: [8, 4],
          lineJoin: "round",
        });
        map.add(polyline);
        overlaysRef.current.push(polyline);
      }
    }

    const visibleOverlays = [...markersRef.current, ...overlaysRef.current];
    if (visibleOverlays.length > 0) {
      map.setFitView(visibleOverlays, false, [50, 50, 50, 50]);
    }
  }, [activeDay, days, isOverview, items, mapInitialized]);

  // 统计
  const totalDistance = statItems.reduce((sum, item) => sum + (item.transportToNext?.distance || 0), 0);
  const walkCount = statItems.filter((item) => item.transportToNext?.mode === "walking").length;
  const driveCount = statItems.filter((item) => item.transportToNext?.mode === "driving").length;
  const transitCount = statItems.filter((item) => item.transportToNext?.mode === "transit").length;
  const cycleCount = statItems.filter((item) => item.transportToNext?.mode === "cycling").length;
  const totalStops = allItems.filter((item) => item.location?.lng && item.location?.lat).length;

  return (
    <div className="journal-screen journal-map relative flex-1 w-full h-full flex flex-col overflow-hidden">
      {/* 地图容器 — 固定高度 */}
      <div className="journal-map-canvas relative w-full flex-shrink-0 h-[340px]">
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--paper-deep)]">
            <span className="text-[14px] text-[var(--ink-soft)] animate-pulse">地图加载中...</span>
          </div>
        )}
      </div>

      {/* 底部面板 */}
      <div className="journal-map-panel flex-1 w-full z-10 flex flex-col relative pt-2 pb-4" style={{ borderRadius: "12px 12px 0 0", marginTop: "-12px" }}>
        <div className="w-full flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Day 切换 */}
        <div className="w-full px-5 pb-3 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            <button
              onClick={() => setActiveDay(-1)}
              data-selected={isOverview}
              className={`journal-tag flex-shrink-0 h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-300 ${
                isOverview
                  ? "text-white"
                  : "text-[var(--ink-soft)]"
              }`}
            >
              总览
            </button>
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                data-selected={activeDay === idx}
                className={`journal-tag flex-shrink-0 h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeDay === idx
                    ? "text-white"
                    : "text-[var(--ink-soft)]"
                }`}
              >
                Day{day.day}
              </button>
            ))}
          </div>
        </div>

        {/* 统计 */}
        <div className="journal-map-summary flex-1 min-h-0 overflow-y-auto px-5 pt-1">
          <div className="w-full bg-[rgba(214,189,141,0.28)] border border-[var(--line)] rounded-md p-3">
            <p className="text-[14px] text-[var(--ink-soft)] font-medium text-center">
              {isOverview ? `全程 ${days.length}天 · ${totalStops}个地点` : `总距离 ${(totalDistance / 1000).toFixed(1)}km`}
              {isOverview && totalDistance > 0 && ` · 约${(totalDistance / 1000).toFixed(1)}km`}
              {walkCount > 0 && ` · 步行${walkCount}段`}
              {cycleCount > 0 && ` · 骑行${cycleCount}段`}
              {transitCount > 0 && ` · 公交${transitCount}段`}
              {driveCount > 0 && ` · 打车${driveCount}段`}
            </p>
          </div>
          {isOverview ? (
            <div className="journal-overview-days mt-3 flex flex-col gap-2 pb-2">
              {days.map((day, idx) => (
                <div
                  key={day.day}
                  className="flex w-full items-start gap-2.5 rounded-md border border-[var(--line)] bg-[rgba(251,244,228,0.62)] px-3 py-2.5"
                >
                  <span
                    className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }}
                  />
                  <span className="min-w-0 text-[12px] leading-[1.55] text-[var(--ink-soft)]">
                    <strong className="mr-1 font-semibold text-[var(--ink)]">Day {day.day}</strong>
                    {day.theme}
                  </span>
                </div>
              ))}
            </div>
          ) : currentDay ? (
            <p className="mt-2 text-[13px] text-gray-400 text-center">📍 {currentDay.theme}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
