import OpenAI from "openai";
import { TripRequest, TripPlan } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function generateTripPlan(request: TripRequest): Promise<TripPlan> {
  const userPrompt = buildUserPrompt(request);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content || "";

  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
                    content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("AI 返回格式错误，无法解析 JSON");
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const plan: TripPlan = JSON.parse(jsonStr);

  return plan;
}

export async function* generateTripPlanStream(request: TripRequest): AsyncGenerator<string> {
  const userPrompt = buildUserPrompt(request);

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
