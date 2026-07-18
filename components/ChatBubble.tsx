"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { TripPlan } from "@/lib/types";
import { CloseIcon, MicIcon, SparkIcon } from "./JournalIcons";

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
              <span className="text-[var(--khaki-dark)] font-semibold flex-shrink-0 text-[12px] mt-[2px] w-4 text-center">{listMatch[1]}</span>
              <span>{renderInline(listMatch[2])}</span>
            </div>
          );
        }

        // - 或 · 开头的列表
        if (trimmed.startsWith("- ") || trimmed.startsWith("· ")) {
          return (
            <div key={i} className="flex gap-1.5 items-start pl-1">
              <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[var(--khaki-dark)] flex-shrink-0" />
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
      return <strong key={i} className="font-semibold text-[var(--ink)]">{part.slice(2, -2)}</strong>;
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

interface PendingUpdate {
  plan: TripPlan;
  summary: string;
}

interface ChatSpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface ChatSpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: ChatSpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type ChatSpeechRecognitionConstructor = new () => ChatSpeechRecognitionLike;

export default function ChatBubble({ plan, onPlanUpdate }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "有什么需要调整的吗？比如换餐厅、加景点、改时间，随时告诉我 ✨" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ChatSpeechRecognitionLike | null>(null);
  const voiceBaseInputRef = useRef("");
  const voiceHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 拖拽状态
  const [position, setPosition] = useState({ x: -1, y: -1 }); // -1 表示未初始化
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 根据当前应用容器尺寸定位，兼容手机、平板和桌面端。
  useEffect(() => {
    const container = bubbleRef.current?.closest("[data-phone-container]") as HTMLDivElement | null;
    if (!container) return;

    containerRef.current = container;
    const fitPosition = () => {
      const maxX = Math.max(8, container.clientWidth - 56);
      const maxY = Math.max(8, container.clientHeight - 140);
      setPosition((prev) => ({
        x: prev.x < 0 ? maxX : Math.min(Math.max(8, prev.x), maxX),
        y: prev.y < 0 ? maxY : Math.min(Math.max(8, prev.y), maxY),
      }));
    };

    fitPosition();
    const observer = new ResizeObserver(fitPosition);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUpdate]);

  const showVoiceHint = (message: string, autoHide = true) => {
    if (voiceHintTimerRef.current) clearTimeout(voiceHintTimerRef.current);
    setVoiceHint(message);
    if (autoHide) {
      voiceHintTimerRef.current = setTimeout(() => setVoiceHint(null), 1800);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined" || isListening || loading || pendingUpdate) return;

    const browserWindow = window as Window & {
      SpeechRecognition?: ChatSpeechRecognitionConstructor;
      webkitSpeechRecognition?: ChatSpeechRecognitionConstructor;
    };
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      const secureTip = window.isSecureContext ? "请换 Chrome/Edge 浏览器试试" : "语音输入需要 HTTPS 或 localhost";
      showVoiceHint("当前浏览器不支持语音输入，" + secureTip);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    voiceBaseInputRef.current = input.trimEnd();

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript || "";
      }
      const base = voiceBaseInputRef.current;
      setInput((base + (base && transcript ? " " : "") + transcript).slice(0, 300));
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      const message = event.error === "not-allowed" ? "请允许浏览器使用麦克风" : "语音识别失败，请重试";
      showVoiceHint(message);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
      showVoiceHint("正在听，松开结束", false);
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      showVoiceHint("语音输入启动失败，请重试");
    }
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setIsListening(false);
    showVoiceHint("已转成文字");
  };

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

    const container = containerRef.current;
    const maxX = Math.max(8, (container?.clientWidth || 390) - 56);
    const maxY = Math.max(8, (container?.clientHeight || 844) - 140);
    newX = Math.max(8, Math.min(newX, maxX));
    newY = Math.max(8, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const width = containerRef.current?.clientWidth || 390;
    const rightEdge = Math.max(8, width - 56);
    setPosition((prev) => ({
      x: prev.x < width / 2 ? 8 : rightEdge,
      y: prev.y,
    }));

    // 如果没移动过，当作点击
    if (!hasMoved.current) {
      setIsOpen(true);
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || pendingUpdate) return;

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
        const summary = data.summary || "已根据你的要求生成修改方案";
        setPendingUpdate({ plan: data.plan, summary });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `${summary}\n\n请确认后再应用到当前行程。` },
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

  const handleConfirmUpdate = () => {
    if (!pendingUpdate) return;
    onPlanUpdate(pendingUpdate.plan);
    setPendingUpdate(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "修改已应用到当前行程。" },
    ]);
  };

  const handleCancelUpdate = () => {
    if (!pendingUpdate) return;
    setPendingUpdate(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "已取消，本次修改没有应用。" },
    ]);
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
          className="journal-chat-bubble absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-[1000] touch-none select-none"
          style={{
            background: "var(--ink)",
            left: `${position.x}px`,
            top: `${position.y}px`,
            transition: isDragging.current ? "none" : "left 0.3s ease-out, top 0.1s ease-out",
          }}
        >
          <SparkIcon className="w-[22px] h-[22px] pointer-events-none" />
        </button>
      )}

      {/* 对话面板 */}
      {isOpen && (
        <div className="journal-chat-panel absolute bottom-0 left-0 right-0 h-[55%] bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] z-[1000] flex flex-col animate-[slideInUp_0.3s_ease-out]">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <SparkIcon className="w-5 h-5" />
              <span className="text-[15px] font-semibold text-[var(--ink)]">AI 助手</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[14px] text-gray-500 active:scale-90 transition-transform"
            >
              <CloseIcon className="w-4 h-4" />
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
                      ? "journal-chat-user text-white rounded-br-[4px]"
                      : "journal-chat-assistant rounded-bl-[4px]"
                  }`}
                >
                  {msg.role === "user" ? msg.content : <FormattedReply text={msg.content} />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="journal-chat-assistant max-w-[80%] px-3 py-2 rounded-[8px] rounded-bl-[4px] text-[14px]">
                  <span className="animate-pulse">正在整理修改方案...</span>
                </div>
              </div>
            )}
            {pendingUpdate && (
              <div className="journal-chat-proposal rounded-[7px] border border-[var(--line-strong)] bg-[var(--paper)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--khaki-dark)]" />
                  <span className="text-[13px] font-semibold text-[var(--ink)]">待确认的修改</span>
                </div>
                <div className="text-[12px] leading-relaxed text-[var(--ink-soft)]">
                  <FormattedReply text={pendingUpdate.summary} />
                </div>
                <p className="mt-2 text-[11px] text-[var(--ink-muted)]">确认前，当前行程不会发生变化。</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCancelUpdate}
                    className="journal-action h-9 rounded-[6px] text-[13px] font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUpdate}
                    className="journal-primary h-9 rounded-[6px] text-[13px] font-medium"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--paper-light)]">
            {voiceHint && (
              <div className={`mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
                isListening ? "bg-[var(--paper-deep)] text-[var(--ink)]" : "bg-[var(--paper)] text-[var(--ink-soft)]"
              }`}>
                {isListening && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] animate-pulse" />}
                <span className="truncate">{voiceHint}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 300))}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={pendingUpdate ? "请先确认或取消本次修改" : "说说要改什么..."}
                className="min-w-0 flex-1 h-[42px] px-3 rounded-[7px] bg-[var(--paper)] border border-[var(--line)] text-[14px] text-[var(--ink)] outline-none focus:border-[var(--ink)] transition-colors"
                disabled={loading || Boolean(pendingUpdate)}
              />
              <button
                type="button"
                aria-label="按住语音输入"
                title="按住语音输入"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startVoiceInput();
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  stopVoiceInput();
                }}
                onPointerLeave={() => stopVoiceInput()}
                onPointerCancel={() => stopVoiceInput()}
                onContextMenu={(e) => e.preventDefault()}
                disabled={loading || Boolean(pendingUpdate)}
                data-listening={isListening}
                className={`journal-mic w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[15px] transition-all active:scale-95 disabled:opacity-40 ${
                  isListening
                    ? "text-white"
                    : "text-[var(--ink)]"
                }`}
              >
                <MicIcon className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || Boolean(pendingUpdate)}
                className="journal-primary h-[42px] px-4 rounded-[12px] text-white text-[14px] font-medium disabled:opacity-40 active:scale-95 transition-all"
                style={{ background: "var(--ink)" }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

