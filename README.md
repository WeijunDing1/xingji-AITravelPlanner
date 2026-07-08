# TripCraft 行迹

AI 旅行规划助手。输入旅行想法或上传攻略截图，生成包含日程、地图路线、预算明细和 AI 对话修改能力的完整旅行方案。

## 功能亮点

- 自然语言旅行需求输入
- 攻略截图识别与信息提取
- AI 生成结构化旅行计划
- SSE 生成进度反馈
- 日程、地图、预算三视图展示
- AI 悬浮助手对话式修改行程
- 移动端优先的拟 App 体验
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

