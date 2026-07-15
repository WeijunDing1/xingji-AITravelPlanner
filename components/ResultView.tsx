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

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeFileName(name: string) {
  return (name || "TripCraft行程").replace(/[\\/:*?"<>|]/g, "-").slice(0, 48);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildPlanRows(plan: TripPlan) {
  return (plan.days || []).flatMap((day) =>
    (day.items || []).map((item, index) => ({
      day: `Day${day.day}`,
      theme: day.theme,
      order: index + 1,
      time: item.time,
      type: item.type,
      name: item.name,
      description: item.description,
      duration: item.duration,
      cost: item.cost,
      rating: item.rating ?? "",
      address: item.location?.address || "",
      transport: item.transportToNext
        ? `${item.transportToNext.mode} / ${item.transportToNext.duration}分钟 / ${(item.transportToNext.distance / 1000).toFixed(1)}km / ¥${item.transportToNext.cost}`
        : "",
    }))
  );
}

function buildPrintableHtml(plan: TripPlan, travelers = 1) {
  const rows = buildPlanRows(plan);
  const budget = plan.budget;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(plan.title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;margin:0;background:#f7f7fb;color:#1f2450;}
  .page{max-width:900px;margin:0 auto;padding:40px 44px;background:#fff;}
  h1{font-size:30px;line-height:1.25;margin:0;color:#5b5ff0;}
  .meta{margin:10px 0 24px;color:#6b7280;font-size:14px;}
  .summary{padding:16px 18px;border-radius:14px;background:#f4f3ff;margin-bottom:22px;color:#37326c;}
  .budget{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:26px;}
  .budget div{padding:12px;border-radius:12px;background:#fafafa;border:1px solid #eee;}
  .budget span{display:block;color:#8b8fa3;font-size:12px;margin-bottom:4px;}
  h2{font-size:18px;margin:26px 0 12px;color:#1f2450;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th,td{border:1px solid #e5e7eb;padding:8px;vertical-align:top;text-align:left;}
  th{background:#f4f3ff;color:#4f46e5;}
  tr:nth-child(even) td{background:#fcfcff;}
  @media print{body{background:#fff}.page{padding:20px;max-width:none}.no-print{display:none}}
</style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(plan.title)}</h1>
    <div class="meta">${escapeHtml(plan.destination)} · ${plan.days.length}天 · 预计 ¥${budget.total.toLocaleString()}${travelers > 1 ? ` · 人均 ¥${Math.round(budget.total / travelers).toLocaleString()}` : ""}</div>
    <div class="summary">${escapeHtml(plan.summary)}</div>
    <div class="budget">
      <div><span>交通</span>¥${budget.transport.toLocaleString()}</div>
      <div><span>住宿</span>¥${budget.accommodation.toLocaleString()}</div>
      <div><span>餐饮</span>¥${budget.food.toLocaleString()}</div>
      <div><span>门票</span>¥${budget.tickets.toLocaleString()}</div>
      <div><span>其他</span>¥${budget.other.toLocaleString()}</div>
      <div><span>总计</span>¥${budget.total.toLocaleString()}</div>
    </div>
    <h2>行程明细</h2>
    <table>
      <thead><tr><th>日期</th><th>时间</th><th>地点</th><th>说明</th><th>费用</th><th>交通</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr><td>${escapeHtml(row.day)}<br/>${escapeHtml(row.theme)}</td><td>${escapeHtml(row.time)}</td><td>${escapeHtml(row.name)}<br/><small>${escapeHtml(row.address)}</small></td><td>${escapeHtml(row.description)}</td><td>¥${escapeHtml(row.cost)}</td><td>${escapeHtml(row.transport)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

function exportPdf(plan: TripPlan, travelers?: number) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(buildPrintableHtml(plan, travelers || 1));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}

function exportExcel(plan: TripPlan, travelers?: number) {
  const html = buildPrintableHtml(plan, travelers || 1);
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, `${safeFileName(plan.title)}.xls`);
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const chars = Array.from(text || "");
  const lines: string[] = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function exportImage(plan: TripPlan, travelers?: number) {
  const width = 1080;
  const dayHeights = plan.days.map((day) => 120 + Math.min(day.items.length, 5) * 86);
  const height = 300 + dayHeights.reduce((sum, value) => sum + value, 0) + 90;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#F8FAFF");
  gradient.addColorStop(1, "#F1EEFF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#6366F1";
  ctx.font = "700 42px Microsoft YaHei, sans-serif";
  wrapCanvasText(ctx, plan.title, 64, 86, 820, 54, 2);
  ctx.fillStyle = "#6B7280";
  ctx.font = "24px Microsoft YaHei, sans-serif";
  ctx.fillText(`${plan.destination} · ${plan.days.length}天 · 预计 ¥${plan.budget.total.toLocaleString()}${travelers && travelers > 1 ? ` · 人均 ¥${Math.round(plan.budget.total / travelers).toLocaleString()}` : ""}`, 64, 188);
  ctx.fillStyle = "#1E1B4B";
  ctx.font = "24px Microsoft YaHei, sans-serif";
  wrapCanvasText(ctx, plan.summary, 64, 238, 900, 34, 2);

  let y = 330;
  plan.days.forEach((day) => {
    const visibleItems = day.items.slice(0, 5);
    const cardHeight = 92 + visibleItems.length * 86;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 48, y, width - 96, cardHeight, 28);
    ctx.fill();

    ctx.fillStyle = "#6366F1";
    ctx.font = "700 28px Microsoft YaHei, sans-serif";
    ctx.fillText(`Day ${day.day}`, 82, y + 52);
    ctx.fillStyle = "#6B7280";
    ctx.font = "22px Microsoft YaHei, sans-serif";
    wrapCanvasText(ctx, day.theme, 190, y + 52, 760, 30, 1);

    let itemY = y + 102;
    visibleItems.forEach((item) => {
      ctx.fillStyle = "#EEF2FF";
      roundRect(ctx, 82, itemY - 28, 86, 42, 20);
      ctx.fill();
      ctx.fillStyle = "#4F46E5";
      ctx.font = "700 20px Microsoft YaHei, sans-serif";
      ctx.fillText(item.time || "--:--", 104, itemY);

      ctx.fillStyle = "#1E1B4B";
      ctx.font = "700 24px Microsoft YaHei, sans-serif";
      wrapCanvasText(ctx, item.name, 190, itemY, 760, 30, 1);
      ctx.fillStyle = "#6B7280";
      ctx.font = "20px Microsoft YaHei, sans-serif";
      wrapCanvasText(ctx, item.description, 190, itemY + 32, 760, 26, 1);
      itemY += 86;
    });

    if (day.items.length > visibleItems.length) {
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "20px Microsoft YaHei, sans-serif";
      ctx.fillText(`还有 ${day.items.length - visibleItems.length} 个安排`, 82, y + cardHeight - 28);
    }

    y += cardHeight + 26;
  });

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "20px Microsoft YaHei, sans-serif";
  ctx.fillText("TripCraft 行迹", 64, height - 42);

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `${safeFileName(plan.title)}.png`);
  }, "image/png");
  return true;
}

export default function ResultView({ plan, onBack, onPlanUpdate, travelers }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const budget = plan.budget || {
    total: 0,
    perPerson: 0,
    transport: 0,
    accommodation: 0,
    food: 0,
    tickets: 0,
    other: 0,
  };
  const days = Array.isArray(plan.days) ? plan.days : [];
  const normalizedPlan = { ...plan, budget, days };

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleExport = (type: "pdf" | "excel" | "image") => {
    setShowExportMenu(false);
    if (type === "pdf") {
      const ok = exportPdf(normalizedPlan, travelers);
      toast(ok ? "正在打开 PDF 导出" : "请允许浏览器弹窗");
    } else if (type === "excel") {
      exportExcel(normalizedPlan, travelers);
      toast("Excel 已导出");
    } else {
      const ok = exportImage(normalizedPlan, travelers);
      toast(ok ? "图片已导出" : "图片导出失败");
    }
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
            ¥{budget.total.toLocaleString()}
          </span>
          {travelers && travelers > 1 && (
            <span className="text-[#9CA3AF]"> · 人均 ¥{Math.round(budget.total / travelers).toLocaleString()}</span>
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
        {activeTab === "schedule" && <ScheduleView days={days} />}
        {activeTab === "map" && <MapView days={days} />}
        {activeTab === "budget" && <BudgetView budget={budget} days={days} travelers={travelers} />}
      </div>

      {showExportMenu && (
        <div className="absolute left-5 right-5 bottom-[86px] z-[80] rounded-2xl border border-[rgba(99,102,241,0.12)] bg-white p-2 shadow-[0_16px_40px_rgba(31,27,75,0.16)]">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleExport("pdf")} className="h-12 rounded-xl bg-[#F4F3FF] text-[#6366F1] text-[13px] font-semibold active:scale-95 transition-transform">📄 PDF</button>
            <button onClick={() => handleExport("excel")} className="h-12 rounded-xl bg-[#F0FDF4] text-[#059669] text-[13px] font-semibold active:scale-95 transition-transform">📊 Excel</button>
            <button onClick={() => handleExport("image")} className="h-12 rounded-xl bg-[#FFF7ED] text-[#D97706] text-[13px] font-semibold active:scale-95 transition-transform">🖼 图片</button>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="w-full h-[76px] bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] border-t border-[rgba(99,102,241,0.08)] px-5 flex items-center justify-between gap-2 pb-[15px]">
        <button
          onClick={onBack}
          className="flex-1 h-[46px] rounded-xl bg-white border border-[#6366F1] text-[#6366F1] font-medium text-[13px] active:scale-95 transition-transform"
        >
          🔄 重生成
        </button>
        <button
          onClick={() => setShowExportMenu((value) => !value)}
          className="flex-1 h-[46px] rounded-xl bg-white border border-[rgba(99,102,241,0.18)] text-[#6366F1] font-medium text-[13px] active:scale-95 transition-transform"
        >
          📤 导出
        </button>
        <button
          onClick={() => toast("行程已保存")}
          className="flex-1 h-[46px] rounded-xl text-white font-medium text-[13px] shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
        >
          💾 保存
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-[#333] text-white text-[14px] rounded-lg shadow-lg z-[100] animate-[fadeInUp_0.3s_ease-out]">
          {showToast}
        </div>
      )}

      {/* AI 对话助手悬浮球 */}
      <ChatBubble plan={normalizedPlan} onPlanUpdate={onPlanUpdate} />
    </div>
  );
}
