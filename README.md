# TripCraft 行迹

AI 旅行规划助手。通过自然语言、语音或攻略截图收集旅行需求，生成包含日程、地图路线、预算明细和对话式调整能力的完整旅行方案。
项目链接：https://tripcraft-ai-travel-planner.vercel.app/

## 功能亮点

- 自然语言与长按语音输入
- 攻略截图识别与信息提取
- 天数、预算、同行人、旅行性格与偏好设置
- AI 生成结构化旅行计划
- SSE 生成进度反馈
- 日程、地图、预算三视图展示及全程路线总览
- AI 悬浮助手对话式调整，并在确认后应用修改
- PDF、Excel 和长图三种行程导出格式
- 牛皮纸旅行手账视觉，适配桌面端、平板与移动端
- `/prototype-flow` 真实组件版前端流程展示页

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- DeepSeek API
- Doubao 多模态 API
- 高德地图 Web API

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

真实前端流程展示页：

```text
http://localhost:3000/prototype-flow
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填入自己的密钥。

```bash
cp .env.example .env.local
```

Windows PowerShell 可以手动复制，或执行：

```powershell
Copy-Item .env.example .env.local
```

## 注意

`.env.local` 不要提交到 GitHub。部署到 Vercel 时，请在项目的 Environment Variables 中配置与 `.env.example` 对应的变量。项目中的 AI 生成、截图解析和地图能力依赖第三方 API Key。
