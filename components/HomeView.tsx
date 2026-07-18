"use client";

import React, { useState, useRef } from "react";
import { TripRequest } from "@/lib/types";
import { CameraIcon, MicIcon, PlaneIcon, SparkIcon } from "./JournalIcons";

const TAG_GROUPS = [
  { key: "days", label: "天数", type: "single" as const, options: ["3天", "5天", "7天"], hasCustom: true, customSuffix: "天", customPlaceholder: "天数" },
  { key: "budget", label: "预算", type: "single" as const, options: ["¥3000", "¥5000", "¥8000", "不限"], hasCustom: false },
  { key: "people", label: "人数", type: "single" as const, options: ["独自旅行", "情侣出游", "家庭亲子", "朋友同行"], hasCustom: false },
  { key: "travelStyles", label: "旅行性格", type: "multi" as const, options: ["早睡早起", "晚睡晚起", "高精力", "低精力", "慢节奏", "特种兵"], hasCustom: false },
  { key: "preferences", label: "偏好", type: "multi" as const, options: ["自然风光", "人文美食", "文艺小众", "刺激冒险", "休闲购物"], hasCustom: false },
];

interface HomeViewProps {
  onSubmit: (request: TripRequest) => void;
}

interface ParsedImage {
  id: string;
  preview: string; // data URL for display
  base64: string;  // full base64 for API
}


interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
interface ExtractedInfo {
  destinations: string[];
  attractions: string[];
  restaurants: string[];
  hotels: string[];
  days: number | null;
  budget: number | null;
  highlights: string[];
  tips: string[];
  suggestedDescription: string;
}

export default function HomeView({ onSubmit }: HomeViewProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ParsedImage[]>([]);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [parsing, setParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [tags, setTags] = useState<Record<string, string | string[]>>({
    days: "",
    budget: "",
    people: "",
    travelStyles: [],
    preferences: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseTextRef = useRef<string>("");
  const voiceHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const showVoiceHint = (message: string, autoHide = true) => {
    if (voiceHintTimerRef.current) clearTimeout(voiceHintTimerRef.current);
    setVoiceHint(message);
    if (autoHide) {
      voiceHintTimerRef.current = setTimeout(() => setVoiceHint(null), 1800);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined" || isListening) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      const secureTip = window.isSecureContext ? "请换 Chrome/Edge 浏览器试试" : "语音输入需要 HTTPS 或 localhost";
      showVoiceHint(`当前浏览器不支持语音输入，${secureTip}`);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    voiceBaseTextRef.current = text.trimEnd();

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript || "";
      }

      const base = voiceBaseTextRef.current;
      const nextText = `${base}${base && transcript ? " " : ""}${transcript}`.slice(0, 500);
      setText(nextText);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const message = event.error === "not-allowed" ? "请允许浏览器使用麦克风" : "语音识别失败，请重试";
      showVoiceHint(message);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      showVoiceHint("正在听，松开结束", false);
    } catch {
      setIsListening(false);
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

  const handleTagClick = (groupKey: string, type: "single" | "multi", option: string) => {
    setTags((prev) => {
      const newTags = { ...prev };
      if (type === "single") {
        newTags[groupKey] = newTags[groupKey] === option ? "" : option;
      } else {
        const arr = newTags[groupKey] as string[];
        if (arr.includes(option)) {
          newTags[groupKey] = arr.filter((item) => item !== option);
        } else {
          newTags[groupKey] = [...arr, option];
        }
      }
      return newTags;
    });
  };

  // 图片上传处理
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 8 - images.length;
    const filesToProcess = files.slice(0, remaining);

    const newImages: ParsedImage[] = [];

    for (const file of filesToProcess) {
      const base64 = await fileToBase64(file);
      newImages.push({
        id: `${Date.now()}-${Math.random()}`,
        preview: base64,
        base64,
      });
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // 自动解析图片
    parseImages(updatedImages);

    // 清空 input 以允许重复选同一文件
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    if (updated.length === 0) {
      setExtractedInfo(null);
    }
  };

  // 调用豆包多模态解析
  const parseImages = async (imgs: ParsedImage[]) => {
    if (imgs.length === 0) return;
    setParsing(true);

    try {
      const res = await fetch("/api/trip/parse-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: imgs.map((img) => img.base64),
          context: text || undefined,
        }),
      });

      const data = await res.json();
      if (data.extracted) {
        setExtractedInfo(data.extracted);
        // 如果文本框为空，自动填入建议描述
        if (!text && data.extracted.suggestedDescription) {
          setText(data.extracted.suggestedDescription);
        }
      }
    } catch {
      // 解析失败静默处理
    } finally {
      setParsing(false);
    }
  };

  const hasInput =
    text.trim().length > 0 ||
    images.length > 0 ||
    !!tags.days ||
    !!customDays ||
    !!tags.budget ||
    !!tags.people ||
    (tags.travelStyles as string[]).length > 0 ||
    (tags.preferences as string[]).length > 0;

  const handleSubmit = () => {
    const daysMap: Record<string, number> = { "3天": 3, "5天": 5, "7天": 7 };
    const budgetMap: Record<string, number> = { "¥3000": 3000, "¥5000": 5000, "¥8000": 8000 };
    const peopleMap: Record<string, number> = { "独自旅行": 1, "情侣出游": 2, "家庭亲子": 3, "朋友同行": 4 };

    const daysValue = customDays ? parseInt(customDays) : daysMap[tags.days as string] || undefined;

    // 整合图片提取信息到描述中
    let description = text;
    if (extractedInfo) {
      const parts: string[] = [];
      if (description) parts.push(description);
      if (extractedInfo.attractions.length > 0) {
        parts.push(`想去：${extractedInfo.attractions.join("、")}`);
      }
      if (extractedInfo.restaurants.length > 0) {
        parts.push(`想吃：${extractedInfo.restaurants.join("、")}`);
      }
      if (extractedInfo.highlights.length > 0) {
        parts.push(`想体验：${extractedInfo.highlights.join("、")}`);
      }
      description = parts.join("；");
    }

    const request: TripRequest = {
      description: description || undefined,
      params: {
        days: daysValue || extractedInfo?.days || undefined,
        budget: budgetMap[tags.budget as string] || extractedInfo?.budget || undefined,
        travelers: peopleMap[tags.people as string] || undefined,
        travelStyles: (tags.travelStyles as string[]).length > 0 ? (tags.travelStyles as string[]) : undefined,
        preferences: (tags.preferences as string[]).length > 0 ? (tags.preferences as string[]) : undefined,
      },
    };

    onSubmit(request);
  };

  return (
    <div className="journal-home w-full h-full flex flex-col overflow-hidden">
      <div className="journal-home-content flex-1 overflow-y-auto overscroll-contain">
        {/* 品牌区 */}
        <div className="journal-brand relative w-full flex flex-col items-center pt-12 pb-8">
          <div className="journal-logo w-12 h-12 mb-3 flex items-center justify-center">
            <PlaneIcon className="w-12 h-12" />
          </div>
          <h1 className="journal-title text-[24px] font-bold">
            行迹
          </h1>
          <p className="journal-subtitle text-[13px] mt-1">旅行计划手账</p>
        </div>

        <div className="journal-home-main px-6 flex flex-col">
          <div className="journal-home-compose">
          {/* 文本输入框 */}
          <div className="journal-input w-full transition-all duration-300">
            <textarea
              className="w-full h-[128px] max-h-[180px] rounded-t-[7px] bg-transparent px-4 pt-4 pb-4 text-[15px] leading-[1.75] resize-none outline-none"
              placeholder={"描述你的旅行想法...\n\n例如：5天大理丽江，情侣游，预算5000"}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
            />
            <div className="h-[48px] mx-3 border-t border-[var(--line)] pl-2 pr-0 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {voiceHint ? (
                  <div className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-1 text-[12px] font-medium ${
                    isListening
                      ? "bg-[var(--paper-deep)] text-[var(--ink)]"
                      : "bg-[var(--paper)] text-[var(--ink-soft)]"
                  }`}>
                    {isListening && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] animate-pulse" />}
                    <span className="truncate">{voiceHint}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[12px] text-[var(--ink-muted)] tabular-nums">{text.length}/500</span>
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
                  data-listening={isListening}
                  className={`journal-mic w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-all active:scale-95 ${
                    isListening
                      ? "text-white"
                      : "text-[var(--ink)]"
                  }`}
                >
                  <MicIcon className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </div>
          {/* 图片上传区 */}
          <div className="mt-3">
            <span className="text-[12px] text-[var(--ink-muted)] mb-2 block">参考攻略截图</span>
            <div className="flex items-center gap-3">
              {/* 已上传的缩略图 */}
              {images.map((img) => (
                <div key={img.id} className="relative w-[72px] h-[72px] rounded-[7px] overflow-hidden flex-shrink-0 border border-[var(--line)]">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] text-gray-500 border border-gray-100"
                  >
                    ✕
                  </button>
                  {parsing && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}

              {/* 上传按钮 */}
              {images.length < 8 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="journal-upload w-[72px] h-[72px] border-2 border-dashed flex flex-col items-center justify-center transition-colors flex-shrink-0"
                >
                  <CameraIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] text-[var(--ink-muted)]">{images.length === 0 ? "添加截图" : "继续添加"}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-2">
              支持小红书/抖音攻略截图，AI 自动提取景点和美食信息
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 图片解析结果提示 */}
          {extractedInfo && !parsing && (
            <div className="mt-3 p-3 rounded-[7px] bg-[rgba(214,189,141,0.3)] border border-[var(--line)]">
              <div className="flex items-center gap-1.5 mb-2">
                <SparkIcon className="w-4 h-4" />
                <span className="text-[12px] font-medium text-[var(--ink)]">已识别攻略内容</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extractedInfo.destinations.map((d, i) => (
                  <span key={`d-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--ink)] text-[var(--paper-light)]">地点 · {d}</span>
                ))}
                {extractedInfo.attractions.map((a, i) => (
                  <span key={`a-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink)]">景点 · {a}</span>
                ))}
                {extractedInfo.restaurants.map((r, i) => (
                  <span key={`r-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink)]">餐饮 · {r}</span>
                ))}
                {extractedInfo.highlights.map((h, i) => (
                  <span key={`h-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink)]">体验 · {h}</span>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* 快捷标签区 */}
          <div className="journal-home-filters mt-5 flex flex-col gap-4">
            {TAG_GROUPS.map((group) => (
              <div key={group.key} className="flex flex-col">
                <span className="journal-filter-label text-[12px] text-[#9CA3AF] mb-2">{group.label}</span>
                <div data-tag-group={group.key} className="flex flex-wrap gap-2 items-center">
                  {group.options.map((opt) => {
                    const isSelected =
                      group.type === "single"
                        ? tags[group.key] === opt && !(group.key === "days" && showCustomDays)
                        : (tags[group.key] as string[]).includes(opt);

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          handleTagClick(group.key, group.type, opt);
                          if (group.key === "days") {
                            setShowCustomDays(false);
                            setCustomDays("");
                          }
                        }}
                        data-selected={isSelected}
                        className={`journal-tag h-[34px] px-3.5 rounded-full text-[13px] transition-all duration-300 active:scale-95 ${
                          isSelected
                            ? "text-white"
                            : "text-[var(--ink-soft)]"
                        }`}
                        style={
                          isSelected
                            ? { background: "var(--ink)", borderColor: "var(--ink)" }
                            : {}
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                  {/* 自定义天数 */}
                  {group.hasCustom && !showCustomDays && (
                    <button
                      onClick={() => {
                        setShowCustomDays(true);
                        setTags((prev) => ({ ...prev, days: "" }));
                      }}
                      className="journal-tag h-[34px] px-3.5 rounded-full text-[13px] transition-all duration-300 active:scale-95"
                    >
                      自定义
                    </button>
                  )}
                  {group.hasCustom && showCustomDays && (
                    <div className="flex items-center h-[34px] rounded-full border border-[var(--ink)] bg-[var(--paper-light)] overflow-hidden shadow-[0_0_0_3px_rgba(54,46,35,0.1)]">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max="30"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="输入"
                        autoFocus
                        className="w-[48px] h-full px-3 text-[13px] text-[#1E1B4B] text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[13px] text-[#6B7280] pr-3">天</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="journal-footer sticky bottom-0 z-20 w-full px-6 pb-8 pt-4 border-t flex-shrink-0">
        <button
          className={`journal-primary w-full h-[52px] rounded-[14px] text-white text-[16px] font-semibold transition-all duration-300 active:scale-[0.97] ${
            hasInput
              ? "opacity-100 hover:-translate-y-[1px]"
              : "opacity-40 pointer-events-none"
          }`}
          style={{ background: "var(--ink)" }}
          onClick={handleSubmit}
          disabled={parsing}
        >
          {parsing ? "正在识别图片..." : "开始规划  →"}
        </button>
      </div>
    </div>
  );
}















