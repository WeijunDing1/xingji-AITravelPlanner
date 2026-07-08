"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { TripPlan } from "@/lib/types";

function FormattedReply({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        // 数字编号列表：1. xxx 或 1、xxx
        const listMatch = trimmed.match(/^(\d+)[.、]\s*(.+)/);
        if (listMatch) {
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[#6366F1] font-semibold flex-shrink-0 text-[12px] mt-[2px] w-4 text-center">{listMatch[1]}</span>
              <span>{renderInline(listMatch[2])}</span>
            </div>
          );
        }

        // - 或 · 开头的列表
        if (trimmed.startsWith("- ") || trimmed.startsWith("· ")) {
          return (
            <div key={i} className="flex gap-1.5 items-start pl-1">
              <span className="text-[#6366F1] mt-[6px] w-1.5 h-1.5 rounded-full bg-[#6366F1] flex-shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // 处理 **加粗**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-[#1E1B4B]">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface ChatBubbleProps {
  plan: TripPlan;
  onPlanUpdate: (plan: TripPlan) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ plan, onPlanUpdate }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "有什么需要调整的吗？比如换餐厅、加景点、改时间，随时告诉我 ✨" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 拖拽状态
  const [position, setPosition] = useState({ x: -1, y: -1 }); // -1 表示未初始化
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初始化位置（右下角）
  useEffect(() => {
    if (position.x === -1) {
      setPosition({ x: 310, y: 680 });
    }
  }, [position.x]);

  // 获取父容器（手机模拟器）
  useEffect(() => {
    if (bubbleRef.current) {
      containerRef.current = bubbleRef.current.closest("[data-phone-container]") as HTMLDivElement;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 拖拽处理
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    hasMoved.current = true;

    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    // 限制在容器内
    newX = Math.max(0, Math.min(newX, 342)); // 390 - 48
    newY = Math.max(0, Math.min(newY, 760)); // 844 - 76 - 48

    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // 吸附到左右边缘
    setPosition((prev) => ({
      x: prev.x < 171 ? 8 : 334,
      y: prev.y,
    }));

    // 如果没移动过，当作点击
    if (!hasMoved.current) {
      setIsOpen(true);
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      // 构建历史对话（不含第一条系统欢迎语）
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/trip/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlan: plan,
          instruction: text,
          history,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error },
        ]);
      } else if (data.type === "update" && data.plan) {
        // 修改了行程
        onPlanUpdate(data.plan);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `${data.summary || "已完成修改"} ✅` },
        ]);
      } else if (data.type === "chat") {
        // 纯对话回复
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，出了点问题，请再试一次" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络异常，请重试" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 可拖拽悬浮球 */}
      {!isOpen && (
        <button
          ref={bubbleRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-[60] touch-none select-none"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            left: `${position.x}px`,
            top: `${position.y}px`,
            transition: isDragging.current ? "none" : "left 0.3s ease-out, top 0.1s ease-out",
          }}
        >
          <span className="text-[20px] pointer-events-none">✨</span>
        </button>
      )}

      {/* 对话面板 */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] z-[60] flex flex-col animate-[slideInUp_0.3s_ease-out]">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">✨</span>
              <span className="text-[15px] font-semibold text-[#1E1B4B]">AI 助手</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[14px] text-gray-500 active:scale-90 transition-transform"
            >
              ✕
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-[12px] text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#6366F1] text-white rounded-br-[4px]"
                      : "bg-[#F3F4F6] text-[#1E1B4B] rounded-bl-[4px]"
                  }`}
                >
                  {msg.role === "user" ? msg.content : <FormattedReply text={msg.content} />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-[12px] rounded-bl-[4px] bg-[#F3F4F6] text-[14px] text-[#6B7280]">
                  <span className="animate-pulse">正在修改行程...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(99,102,241,0.08)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="说说要改什么..."
              className="flex-1 h-[40px] px-3 rounded-[12px] bg-[#F9FAFB] border border-[rgba(99,102,241,0.08)] text-[14px] text-[#1E1B4B] placeholder-[#9CA3AF] outline-none focus:border-[#6366F1] transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-[40px] px-4 rounded-[12px] text-white text-[14px] font-medium disabled:opacity-40 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
