"use client";

import React, { useMemo, useState } from "react";
import HomeView from "@/components/HomeView";
import LoadingView from "@/components/LoadingView";
import ScheduleView from "@/components/ScheduleView";
import MapView from "@/components/MapView";
import BudgetView from "@/components/BudgetView";
import ChatBubble from "@/components/ChatBubble";
import { TripPlan } from "@/lib/types";

type ScreenId =
  | "home"
  | "upload"
  | "loading"
  | "error"
  | "schedule"
  | "map"
  | "budget"
  | "chat"
  | "save";

const FLOW_NODES: {
  id: ScreenId;
  step: string;
  lane: string;
  component: string;
  title: string;
  description: string;
  tags: string[];
}[] = [
  {
    id: "home",
    step: "01",
    lane: "输入入口",
    component: "HomeView",
    title: "首页自然语言输入",
    description: "真实首页组件：文本输入、快捷标签、预算/天数/人群偏好。",
    tags: ["文本", "标签", "CTA"],
  },
  {
    id: "upload",
    step: "02",
    lane: "输入入口",
    component: "HomeView",
    title: "攻略截图导入",
    description: "仍使用真实首页组件，上传图片后会触发图片解析与信息回填。",
    tags: ["截图", "AI识别"],
  },
  {
    id: "loading",
    step: "03",
    lane: "AI 生成",
    component: "LoadingView",
    title: "AI 规划进度",
    description: "真实 LoadingView，展示 SSE 进度阶段。",
    tags: ["SSE", "进度"],
  },
  {
    id: "error",
    step: "04",
    lane: "AI 生成",
    component: "错误 Toast",
    title: "失败提示与回退",
    description: "模拟真实 App 的错误提示层，用于表达生成失败后的回退。",
    tags: ["错误", "重试"],
  },
  {
    id: "schedule",
    step: "05",
    lane: "结果展示",
    component: "ScheduleView",
    title: "时间线日程视图",
    description: "真实 ScheduleView + PoiCard，按天展示行程卡片。",
    tags: ["Day", "POI"],
  },
  {
    id: "map",
    step: "06",
    lane: "结果展示",
    component: "MapView",
    title: "地图路线视图",
    description: "真实 MapView，加载高德地图、POI 标记和路线。",
    tags: ["地图", "路线"],
  },
  {
    id: "budget",
    step: "07",
    lane: "结果展示",
    component: "BudgetView",
    title: "预算构成视图",
    description: "真实 BudgetView，展示总预算、环图和可展开明细。",
    tags: ["预算", "明细"],
  },
  {
    id: "chat",
    step: "08",
    lane: "操作闭环",
    component: "ChatBubble",
    title: "AI 悬浮球与对话",
    description: "真实 ChatBubble，点击右下角悬浮球可打开对话面板。",
    tags: ["追问", "修改"],
  },
  {
    id: "save",
    step: "09",
    lane: "操作闭环",
    component: "Toast",
    title: "保存、分享、重新生成",
    description: "模拟真实 ResultView 的底部操作和 Toast 反馈。",
    tags: ["保存", "分享"],
  },
];

const MOCK_PLAN: TripPlan = {
  title: "7天6晚三亚热带海滨之旅",
  summary: "围绕三亚湾、亚龙湾、蜈支洲岛和本地海鲜安排轻松路线。",
  destination: "三亚",
  budget: {
    total: 8000,
    perPerson: 4000,
    transport: 1920,
    accommodation: 2240,
    food: 1600,
    tickets: 1280,
    other: 960,
  },
  days: [
    {
      day: 1,
      theme: "抵达与三亚湾初探",
      items: [
        {
          type: "attraction",
          name: "三亚湾椰梦长廊",
          description: "抵达后先沿海岸线散步，适应节奏，傍晚看日落。",
          time: "09:30",
          duration: 120,
          location: { lat: 18.2673, lng: 109.4607, address: "三亚湾路" },
          cost: 0,
          rating: 4.6,
          transportToNext: {
            mode: "driving",
            duration: 18,
            distance: 7200,
            cost: 36,
          },
        },
        {
          type: "restaurant",
          name: "第一市场海鲜",
          description: "选择本地口碑海鲜加工店，适合第一天轻松聚餐。",
          time: "12:30",
          duration: 90,
          location: { lat: 18.2529, lng: 109.5124, address: "新建街" },
          cost: 160,
          rating: 4.5,
          transportToNext: {
            mode: "walking",
            duration: 12,
            distance: 850,
            cost: 0,
          },
        },
        {
          type: "hotel",
          name: "三亚湾海景酒店",
          description: "靠近当天最后一站，减少回头路，方便第二天出发。",
          time: "18:00",
          duration: 0,
          location: { lat: 18.263, lng: 109.482, address: "三亚湾度假区" },
          cost: 560,
          rating: 4.7,
        },
      ],
    },
    {
      day: 2,
      theme: "亚龙湾海滨与森林公园",
      items: [
        {
          type: "attraction",
          name: "亚龙湾热带天堂森林公园",
          description: "上午走轻徒步路线，俯瞰亚龙湾海岸线。",
          time: "09:00",
          duration: 180,
          location: { lat: 18.2351, lng: 109.6387, address: "亚龙湾路" },
          cost: 158,
          rating: 4.6,
          transportToNext: {
            mode: "driving",
            duration: 15,
            distance: 5800,
            cost: 30,
          },
        },
        {
          type: "attraction",
          name: "亚龙湾沙滩",
          description: "下午安排海边休息和拍照，节奏更松弛。",
          time: "15:30",
          duration: 150,
          location: { lat: 18.2269, lng: 109.6428, address: "亚龙湾国家旅游度假区" },
          cost: 0,
          rating: 4.7,
        },
      ],
    },
    {
      day: 3,
      theme: "蜈支洲岛一日游",
      items: [
        {
          type: "attraction",
          name: "蜈支洲岛",
          description: "集中一天体验海岛、玻璃海和轻量水上项目。",
          time: "08:30",
          duration: 360,
          location: { lat: 18.3157, lng: 109.7612, address: "海棠湾镇" },
          cost: 220,
          rating: 4.6,
        },
      ],
    },
  ],
};

const lanes = ["输入入口", "AI 生成", "结果展示", "操作闭环"];

export default function PrototypeFlowPage() {
  const [active, setActive] = useState<ScreenId>("home");
  const [plan, setPlan] = useState<TripPlan>(MOCK_PLAN);
  const activeNode = useMemo(
    () => FLOW_NODES.find((node) => node.id === active) ?? FLOW_NODES[0],
    [active]
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(99,102,241,0.18),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.16),transparent_25%),linear-gradient(135deg,#f7f9ff,#eef4ff_45%,#fff7ed)] px-5 py-7 text-[#171A3F]">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] font-black text-white shadow-[0_16px_34px_rgba(99,102,241,0.32)]">
              TC
            </div>
            <div>
              <h1 className="text-[28px] font-black leading-tight tracking-[0] sm:text-[40px]">
                TripCraft 真实前端原型流转图
              </h1>
              <p className="mt-2 text-[15px] text-[#697184]">
                左侧是产品流程，右侧手机壳渲染项目真实 React 组件。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActive("home")}
              className="h-9 rounded-full bg-white/80 px-4 text-[13px] text-[#4A5167] shadow-[0_8px_22px_rgba(99,102,241,0.08)] ring-1 ring-[rgba(99,102,241,0.16)]"
            >
              用户主流程
            </button>
            <button
              onClick={() => setActive("error")}
              className="h-9 rounded-full bg-white/80 px-4 text-[13px] text-[#4A5167] shadow-[0_8px_22px_rgba(99,102,241,0.08)] ring-1 ring-[rgba(99,102,241,0.16)]"
            >
              异常与反馈
            </button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(680px,1fr)_430px]">
          <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white/80 shadow-[0_22px_70px_rgba(48,53,120,0.16)] backdrop-blur-xl">
            <div className="flex flex-col gap-2 border-b border-[rgba(99,102,241,0.10)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[17px] font-extrabold">可交互流转图</div>
              <div className="flex flex-wrap gap-3 text-[12px] text-[#697184]">
                <span>紫色：页面状态</span>
                <span>橙色：用户动作</span>
                <span>绿色：AI/系统反馈</span>
              </div>
            </div>

            <div className="relative overflow-auto p-5">
              <svg
                className="pointer-events-none absolute inset-0 min-h-[650px] min-w-[920px]"
                viewBox="0 0 920 650"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="prototypeFlowGradient" x1="0" x2="1">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#8B5CF6" />
                  </linearGradient>
                  <marker id="prototypeArrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#8B5CF6" />
                  </marker>
                </defs>
                <path d="M142 106 C210 106 222 106 292 106" fill="none" stroke="url(#prototypeFlowGradient)" strokeWidth="3" markerEnd="url(#prototypeArrow)" />
                <path d="M142 252 C210 252 222 106 292 106" fill="none" stroke="url(#prototypeFlowGradient)" strokeWidth="3" markerEnd="url(#prototypeArrow)" />
                <path d="M370 106 C438 106 450 106 520 106" fill="none" stroke="url(#prototypeFlowGradient)" strokeWidth="3" markerEnd="url(#prototypeArrow)" />
                <path d="M598 106 C666 106 678 106 748 106" fill="none" stroke="url(#prototypeFlowGradient)" strokeWidth="3" markerEnd="url(#prototypeArrow)" />
                <path d="M824 106 C875 152 875 246 824 292" fill="none" stroke="rgba(99,102,241,0.24)" strokeWidth="2" strokeDasharray="8 8" markerEnd="url(#prototypeArrow)" />
                <path d="M824 292 C875 338 875 432 824 478" fill="none" stroke="rgba(99,102,241,0.24)" strokeWidth="2" strokeDasharray="8 8" markerEnd="url(#prototypeArrow)" />
              </svg>

              <div className="relative z-10 grid min-w-[900px] grid-cols-4 gap-4">
                {lanes.map((lane) => (
                  <div key={lane} className="flex flex-col gap-3">
                    <div className="pl-1 text-[12px] font-black uppercase tracking-[0.08em] text-[#7C8498]">
                      {lane}
                    </div>
                    {FLOW_NODES.filter((node) => node.lane === lane).map((node) => (
                      <button
                        key={node.id}
                        onClick={() => setActive(node.id)}
                        className={`relative min-h-[126px] rounded-[18px] border p-4 text-left transition duration-200 ${
                          active === node.id
                            ? "border-[rgba(99,102,241,0.58)] bg-white shadow-[0_20px_42px_rgba(99,102,241,0.20)]"
                            : "border-[rgba(99,102,241,0.13)] bg-white/80 hover:-translate-y-1 hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_18px_34px_rgba(99,102,241,0.16)]"
                        }`}
                      >
                        <span className="absolute right-3 top-3 text-[12px] font-extrabold text-[#A4ABBD]">
                          {node.step}
                        </span>
                        <div className="mb-2 flex items-center gap-2 text-[12px] text-[#697184]">
                          <span className="grid h-[26px] w-[26px] place-items-center rounded-[9px] bg-[rgba(99,102,241,0.10)] font-black text-[#6366F1]">
                            {node.component.slice(0, 1)}
                          </span>
                          {node.component}
                        </div>
                        <h3 className="mb-2 pr-7 text-[16px] font-extrabold">{node.title}</h3>
                        <p className="text-[12.5px] leading-relaxed text-[#697184]">{node.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {node.tags.map((tag, index) => (
                            <span
                              key={tag}
                              className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${
                                index === 1
                                  ? "bg-[rgba(245,158,11,0.12)] text-[#B86C05]"
                                  : "bg-[rgba(99,102,241,0.08)] text-[#555BD4]"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_22px_70px_rgba(48,53,120,0.16)] backdrop-blur-xl xl:sticky xl:top-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[18px] font-black">{activeNode.title}</div>
                <div className="mt-1 text-[12px] text-[#697184]">{activeNode.component} · 真实组件预览</div>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-[12px] font-extrabold text-[#6366F1] shadow-sm">
                {activeNode.step} / 09
              </span>
            </div>

            <div
              data-phone-container
              className="relative mx-auto h-[844px] w-[390px] overflow-hidden rounded-[42px] border border-white/80 bg-gradient-to-b from-white to-[#EDF0F8] p-[9px] shadow-[0_28px_80px_rgba(35,38,84,0.26)]"
            >
              <div className="pointer-events-none absolute left-1/2 top-3 z-[80] h-[23px] w-[116px] -translate-x-1/2 rounded-b-2xl bg-[#F9FAFB]" />
              <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#FAFBFE]">
                <PrototypeScreen active={active} plan={plan} setActive={setActive} setPlan={setPlan} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PrototypeScreen({
  active,
  plan,
  setActive,
  setPlan,
}: {
  active: ScreenId;
  plan: TripPlan;
  setActive: (screen: ScreenId) => void;
  setPlan: (plan: TripPlan) => void;
}) {
  if (active === "home" || active === "upload") {
    return (
      <div className="h-full w-full">
        <HomeView onSubmit={() => setActive("loading")} />
        {active === "upload" && (
          <div className="pointer-events-none absolute inset-x-5 bottom-[86px] z-[80] rounded-2xl border border-[rgba(99,102,241,0.16)] bg-white/92 p-3 text-[12px] leading-relaxed text-[#6366F1] shadow-[0_12px_28px_rgba(99,102,241,0.16)] backdrop-blur">
            这是同一个真实 HomeView。点击「添加截图」上传图片后，会进入项目真实的图片识别状态。
          </div>
        )}
      </div>
    );
  }

  if (active === "loading") {
    return (
      <div className="h-full w-full" onClick={() => setActive("schedule")}>
        <LoadingView
          onComplete={() => setActive("schedule")}
          stages={[
            { stage: "analyzing", message: "正在分析旅行需求" },
            { stage: "searching", message: "正在搜索目的地信息" },
            { stage: "planning", message: "正在规划路线" },
          ]}
        />
        <button className="absolute bottom-8 left-6 right-6 z-[70] h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] font-bold text-white shadow-lg">
          点击查看真实结果页
        </button>
      </div>
    );
  }

  if (active === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#FFFFFF,#F0F3FF)] px-8 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#F43F5E] text-[32px] font-black text-white shadow-[0_18px_36px_rgba(244,63,94,0.26)]">
          !
        </div>
        <h2 className="mt-5 text-[20px] font-black text-[#1E1B4B]">生成遇到问题</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
          这里模拟主应用中的错误 Toast：AI 返回格式异常、网络失败或接口报错后回到首页。
        </p>
        <button
          onClick={() => setActive("home")}
          className="mt-8 h-12 w-full rounded-2xl bg-gradient-to-br from-[#F43F5E] to-[#FB7185] font-bold text-white"
        >
          返回重新规划
        </button>
      </div>
    );
  }

  return (
    <RealResultShell
      plan={plan}
      active={active}
      setActive={setActive}
      setPlan={setPlan}
    />
  );
}

function RealResultShell({
  plan,
  active,
  setActive,
  setPlan,
}: {
  plan: TripPlan;
  active: ScreenId;
  setActive: (screen: ScreenId) => void;
  setPlan: (plan: TripPlan) => void;
}) {
  const tab = active === "map" || active === "budget" ? active : "schedule";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#FAFBFE]">
      <div className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[rgba(99,102,241,0.08)] bg-white/75 px-5 backdrop-blur-[20px]">
        <button
          onClick={() => setActive("home")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[18px] shadow-sm active:scale-95"
        >
          ‹
        </button>
        <h1 className="text-[16px] font-semibold text-[#1E1B4B]">{plan.destination}</h1>
        <button
          onClick={() => setActive("save")}
          className="flex h-8 w-8 items-center justify-center text-[16px] active:scale-95"
        >
          ↗
        </button>
      </div>

      <div className="relative w-full bg-white px-5 py-4">
        <h2 className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] bg-clip-text text-[20px] font-bold tracking-wide text-transparent">
          {plan.title}
        </h2>
        <div className="mt-1.5 text-[14px] text-[#6B7280]">
          预计 <span className="font-medium text-[#F59E0B]">¥{plan.budget.total.toLocaleString()}</span>
          <span className="text-[#9CA3AF]"> · 人均 ¥{plan.budget.perPerson.toLocaleString()}</span>
        </div>
      </div>

      <div className="sticky top-14 z-40 w-full border-b border-[rgba(99,102,241,0.08)] bg-white/75 backdrop-blur-[20px]">
        <div className="relative flex">
          {[
            { id: "schedule", label: "日程" },
            { id: "map", label: "地图" },
            { id: "budget", label: "预算" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id as ScreenId)}
              className={`h-11 flex-1 text-[14px] transition-colors ${
                tab === item.id ? "font-semibold text-[#6366F1]" : "text-[#6B7280]"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div
            className="absolute bottom-0 h-[3px] rounded-t-[3px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] transition-transform duration-300"
            style={{
              width: "33.333%",
              transform: `translateX(${["schedule", "map", "budget"].indexOf(tab) * 100}%)`,
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "schedule" && <ScheduleView days={plan.days} />}
        {tab === "map" && <MapView days={plan.days} />}
        {tab === "budget" && <BudgetView budget={plan.budget} days={plan.days} travelers={2} />}
      </div>

      <div className="flex h-[76px] w-full items-center justify-between gap-3 border-t border-[rgba(99,102,241,0.08)] bg-white/75 px-5 pb-[15px] backdrop-blur-[20px]">
        <button
          onClick={() => setActive("home")}
          className="h-[46px] flex-1 rounded-xl border border-[#6366F1] bg-white text-[14px] font-medium text-[#6366F1]"
        >
          重新生成
        </button>
        <button
          onClick={() => setActive("save")}
          className="h-[46px] flex-1 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-[14px] font-medium text-white shadow-sm"
        >
          保存行程
        </button>
      </div>

      {active === "save" && (
        <div className="absolute bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-[#333] px-4 py-2.5 text-[14px] text-white shadow-lg">
          行程已保存，链接已复制
        </div>
      )}

      <ChatBubble plan={plan} onPlanUpdate={setPlan} />

      {active === "chat" && (
        <div className="pointer-events-none absolute left-5 right-5 top-[152px] z-[70] rounded-2xl border border-[rgba(99,102,241,0.14)] bg-white/90 p-3 text-[12px] leading-relaxed text-[#6366F1] shadow-lg backdrop-blur">
          右下角是真实 ChatBubble。点击悬浮球即可打开项目里的对话面板。
        </div>
      )}
    </div>
  );
}
