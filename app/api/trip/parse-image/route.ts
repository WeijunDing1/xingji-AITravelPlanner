import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY!,
  baseURL: process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
});

const MODEL = process.env.DOUBAO_MODEL || "doubao-seed-2.1-pro";

const PARSE_PROMPT = `你是旅行攻略信息提取助手。用户会上传旅游攻略截图（来自小红书、抖音等平台）。

请从图片中提取以下信息，以 JSON 格式返回：

\`\`\`json
{
  "destinations": ["目的地列表"],
  "attractions": ["提到的景点"],
  "restaurants": ["提到的餐厅/美食"],
  "hotels": ["提到的住宿"],
  "days": null,
  "budget": null,
  "highlights": ["行程亮点/推荐活动"],
  "tips": ["实用小贴士"],
  "suggestedDescription": "一句话概括这张攻略的核心内容"
}
\`\`\`

注意：
- 如果某项信息图片中没有提到，用空数组或 null
- days 和 budget 用数字，没提到就用 null
- suggestedDescription 要简洁有用，可以直接作为旅行需求输入
- 只提取图片中明确提到的信息，不要自己编造`;

export async function POST(req: NextRequest) {
  try {
    const { images, context } = await req.json();

    if (!images || images.length === 0) {
      return Response.json({ error: "请上传至少一张图片" }, { status: 400 });
    }

    // 构建多模态消息
    const content: any[] = [
      { type: "text", text: context ? `用户补充说明：${context}\n\n请提取图片中的旅行攻略信息：` : "请提取图片中的旅行攻略信息：" },
    ];

    // 添加图片（支持多张）
    for (const imageBase64 of images) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    }

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: PARSE_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseContent = response.choices[0]?.message?.content || "";

    // 提取 JSON
    const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)```/) ||
                      responseContent.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      return Response.json({
        extracted: {
          destinations: [],
          attractions: [],
          restaurants: [],
          hotels: [],
          days: null,
          budget: null,
          highlights: [],
          tips: [],
          suggestedDescription: responseContent.slice(0, 200),
        },
      });
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const extracted = JSON.parse(jsonStr);

    return Response.json({ extracted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片解析失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
