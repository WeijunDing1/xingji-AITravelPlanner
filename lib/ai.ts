import OpenAI from "openai";
import { TripRequest, TripPlan } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

function getMaxOutputTokens(request: TripRequest): number {
  const days = request.params?.days || 0;
  if (days >= 14) return 16000;
  if (days >= 8) return 12000;
  return 8000;
}
export async function generateTripPlan(request: TripRequest): Promise<TripPlan> {
  const userPrompt = buildUserPrompt(request);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: getMaxOutputTokens(request),
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
    max_tokens: getMaxOutputTokens(request),
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
export async function repairTripPlanJson(rawContent: string, parseError: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a strict JSON repair tool. Return only valid JSON. Do not explain. Do not wrap with markdown. Keep the original data and field names unchanged.",
      },
      {
        role: "user",
        content: `The following travel-plan JSON failed to parse. Fix only JSON syntax errors such as missing commas, trailing commas, invalid quotes, or incomplete brackets. Return the complete valid JSON object only.\n\nParse error:\n${parseError}\n\nContent:\n${rawContent}`,
      },
    ],
    temperature: 0,
    max_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content || "";
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("AI returned repaired content without JSON");
  }

  return jsonMatch[1] || jsonMatch[0];
}




