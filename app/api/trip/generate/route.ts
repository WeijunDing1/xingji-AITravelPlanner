import { NextRequest } from "next/server";
import { generateTripPlanStream } from "@/lib/ai";
import { TripRequest, TripPlan } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body: TripRequest = await req.json();

  if (!body.description && !body.params) {
    return new Response(JSON.stringify({ error: "请提供旅行需求描述" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // 阶段 1：分析需求（收到请求即触发）
        send("progress", { stage: "analyzing", message: "正在分析您的旅行需求..." });

        let fullContent = "";
        let sentStages = new Set(["analyzing"]);

        const stream = generateTripPlanStream(body);

        for await (const chunk of stream) {
          fullContent += chunk;

          // 阶段 2：AI 开始输出 → 已在搜索信息
          if (!sentStages.has("searching") && fullContent.length > 20) {
            send("progress", { stage: "searching", message: "搜索目的地信息..." });
            sentStages.add("searching");
          }

          // 阶段 3：出现 "days" 关键字 → 开始规划路线
          if (!sentStages.has("planning") && fullContent.includes('"day"')) {
            send("progress", { stage: "planning", message: "规划最优路线..." });
            sentStages.add("planning");
          }

          // 阶段 4：出现 "budget" 或 "cost" → 计算预算
          if (!sentStages.has("budgeting") && (fullContent.includes('"budget"') || fullContent.includes('"cost"'))) {
            send("progress", { stage: "budgeting", message: "计算预算明细..." });
            sentStages.add("budgeting");
          }
        }

        // 阶段 5：流结束 → 生成推荐方案
        send("progress", { stage: "generating", message: "生成推荐方案..." });

        // 解析 JSON
        const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)```/) ||
                          fullContent.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
          send("error", { message: "AI 返回格式异常，请重试" });
          controller.close();
          return;
        }

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const plan: TripPlan = JSON.parse(jsonStr);

        send("complete", { plan });
      } catch (error) {
        const message = error instanceof Error ? error.message : "生成失败，请重试";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
