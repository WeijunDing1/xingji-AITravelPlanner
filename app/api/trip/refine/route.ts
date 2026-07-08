import { NextRequest } from "next/server";
import OpenAI from "openai";
import { TripPlan } from "@/lib/types";
import { REFINE_SYSTEM_PROMPT } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function POST(req: NextRequest) {
  const { currentPlan, instruction, history } = await req.json();

  if (!currentPlan || !instruction) {
    return Response.json({ error: "缺少参数" }, { status: 400 });
  }

  try {
    // 构建消息列表（支持多轮对话）
    const messages: any[] = [
      { role: "system", content: REFINE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `当前行程 JSON（仅供参考，不需要每次都输出）：\n\`\`\`json\n${JSON.stringify(currentPlan)}\n\`\`\``,
      },
      { role: "assistant", content: "好的，我已了解你的行程。有什么需要调整或想问的？" },
    ];

    // 加入历史对话
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // 加入当前用户消息
    messages.push({ role: "user", content: instruction });

    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content || "";

    // 检查是否包含 JSON（即是否修改了行程）
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);

    if (jsonMatch) {
      // 修改模式：提取 JSON + 摘要
      const jsonStart = content.indexOf("```json");
      const summary = jsonStart > 0 ? content.slice(0, jsonStart).trim() : "已完成修改";

      try {
        const jsonStr = jsonMatch[1];
        const plan: TripPlan = JSON.parse(jsonStr);
        return Response.json({ type: "update", plan, summary });
      } catch {
        return Response.json({ type: "chat", reply: content });
      }
    } else {
      // 纯对话模式：直接返回回复文本
      return Response.json({ type: "chat", reply: content });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
