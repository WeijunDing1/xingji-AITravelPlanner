# 行迹 TripCraft — 技术设计文档（TRD）

## 1. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    客户端（Browser）                   │
│  Next.js + React + TailwindCSS + 高德 JS API 2.0     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                   后端服务（API）                      │
│            Next.js API Routes / Edge Functions        │
├─────────────┬─────────────┬─────────────────────────┤
│  行程生成    │  图片解析    │  地图/POI 服务           │
│  模块       │  模块        │  模块                   │
└──────┬──────┴──────┬──────┴──────┬──────────────────┘
       │             │             │
┌──────▼───┐  ┌──────▼───┐  ┌─────▼────────┐
│ Claude   │  │ Claude   │  │ 高德开放平台   │
│ API      │  │ Vision   │  │ Web服务API    │
│(文本生成) │  │(图片识别) │  │(POI/路线/地理) │
└──────────┘  └──────────┘  └──────────────┘
```

---

## 2. 技术栈选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Next.js 14 (App Router) | SSR + API Routes 一体化，部署简单 |
| UI | TailwindCSS + shadcn/ui | 快速构建移动端 UI，组件质量高 |
| 地图 | 高德 JS API 2.0 | 国内数据最全，Web端 Key + Middleware 代理鉴权 |
| AI - 文本 | DeepSeek API (deepseek-chat) | OpenAI 兼容格式，结构化输出稳定，性价比高 |
| AI - 视觉 | 豆包 doubao-seed-2.1-pro | 火山引擎多模态模型，用于攻略截图识别 |
| 部署 | Vercel | 零配置部署 Next.js，全球 CDN |
| 包管理 | npm | Node.js 内置，零额外安装 |

---

## 3. 核心模块设计

### 3.1 行程生成模块

#### 输入
```typescript
interface TripRequest {
  // 文本输入
  description?: string;        // "5天大理丽江，预算5000，情侣"
  // 图片输入
  images?: string[];           // base64 编码的图片数组
  // 结构化参数（快捷标签）
  params?: {
    destination?: string;      // 目的地
    days?: number;             // 天数 1-30（支持自定义）
    budget?: number;           // 总预算（元）
    travelers?: number;        // 出行人数
    preferences?: string[];    // ["自然风光", "美食", "文艺"]
  };
}
```

#### 输出
```typescript
interface TripPlan {
  title: string;               // "5天4晚大理丽江浪漫之旅"
  summary: string;             // 行程概述
  destination: string;         // 主要目的地
  days: DayPlan[];             // 每日行程
  budget: BudgetBreakdown;     // 预算明细
}

interface DayPlan {
  day: number;
  date?: string;
  theme: string;               // "环洱海骑行日"
  items: ItineraryItem[];
}

interface ItineraryItem {
  type: "attraction" | "restaurant" | "hotel" | "transport";
  name: string;
  description: string;
  time: string;                // "09:00-11:00"
  duration: number;            // 分钟
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  cost: number;                // 预估费用
  rating?: number;             // 评分
  tips?: string;               // 小贴士
  transportToNext?: {
    mode: "walking" | "driving" | "transit" | "cycling";
    duration: number;           // 分钟
    distance: number;           // 米
    cost: number;               // 该段交通费用（人民币），步行/骑行为 0
  };
}

interface BudgetBreakdown {
  total: number;
  transport: number;           // 大交通 + 市内交通
  accommodation: number;
  food: number;
  tickets: number;             // 门票
  other: number;
}
```

#### AI Prompt 策略
```
System Prompt 要求：
1. 角色：资深旅行规划师
2. 输出格式：严格 JSON（附 schema 约束）
3. 路径优化规则（核心）：
   - 先将景点按地理位置分区
   - 每天只在一个区域内活动（5km 半径）
   - 不同天不重复去同一区域
   - 每天路线为单向链路，无回头路
   - 多城市按城市分天
4. 规划原则：
   - 考虑景点开放时间和最佳游览时段
   - 餐厅安排在景点附近步行可达
   - 预算估算基于当地实际消费水平
   - 所有费用统一为人民币（海外按汇率换算）
   - 交通段标注费用（步行/骑行为 0）
5. 必须返回精确经纬度坐标
```

### 3.2 图片解析模块

#### 流程
```
用户上传攻略截图（最多 8 张，来自小红书/抖音等）
    ↓
前端读取为 base64 DataURL
    ↓
发送至后端 /api/trip/parse-image
    ↓
调用豆包 doubao-seed-2.1-pro 多模态 API
    ↓
提取结构化信息：
  - 目的地列表
  - 提及的景点名称
  - 提及的餐厅/美食
  - 提及的住宿
  - 行程天数 / 预算
  - 行程亮点 / 推荐活动
  - 实用小贴士
    ↓
前端展示识别结果标签 → 自动填充建议描述 → 合并进行程生成请求
```

#### 图片压缩（前端）
```typescript
async function compressImage(file: File): Promise<string> {
  // 使用 canvas 压缩到 1024px 宽度
  // 输出 JPEG quality 0.8
  // 转 base64
}
```

### 3.3 地图服务模块

#### 高德 API 使用清单

| API | 用途 | 配额（免费） |
|-----|------|-------------|
| Web服务 - 地理编码 | 地名 → 经纬度 | 5000次/天 |
| Web服务 - POI搜索 | 搜索周边餐厅/景点 | 5000次/天 |
| Web服务 - 路径规划 | 计算两点间路线 | 5000次/天 |
| JS API - Map | 地图展示 | 无限制 |
| JS API - Marker | POI 标注 | 无限制 |
| JS API - Polyline | 路线绘制 | 无限制 |

#### 路线规划逻辑
```typescript
async function planRoute(items: ItineraryItem[]): Promise<Route[]> {
  const routes = [];
  for (let i = 0; i < items.length - 1; i++) {
    const origin = items[i].location;
    const destination = items[i + 1].location;
    const distance = calcDistance(origin, destination);

    // 根据距离选择交通方式
    let mode: "walking" | "transit" | "driving";
    if (distance < 2000) mode = "walking";
    else if (distance < 20000) mode = "transit";
    else mode = "driving";

    const route = await amapDirectionAPI(origin, destination, mode);
    routes.push(route);
  }
  return routes;
}
```

### 3.4 预算估算模块

#### 数据来源优先级
1. 高德 POI 详情中的 `cost` 字段（人均消费）
2. AI 基于目的地消费水平的估算
3. 用户手动修正

#### 预算计算
```typescript
function calculateBudget(plan: TripPlan): BudgetBreakdown {
  let transport = 0, accommodation = 0, food = 0, tickets = 0;

  for (const day of plan.days) {
    for (const item of day.items) {
      switch (item.type) {
        case "transport": transport += item.cost; break;
        case "hotel": accommodation += item.cost; break;
        case "restaurant": food += item.cost; break;
        case "attraction": tickets += item.cost; break;
      }
    }
  }

  return {
    total: transport + accommodation + food + tickets,
    transport, accommodation, food, tickets,
    other: Math.round((transport + accommodation + food + tickets) * 0.1)
  };
}
```

### 3.5 AI 对话修改模块

#### 功能
用户在结果页通过悬浮球对话窗口输入自然语言修改指令，系统在现有行程基础上局部更新。

#### 流程
```
用户输入修改指令（如 "Day1 午餐换成烤鸭"）
    ↓
前端将 currentPlan + instruction 发送至 /api/trip/refine
    ↓
后端组装 Prompt：REFINE_SYSTEM_PROMPT + 当前行程 JSON + 用户指令
    ↓
调用 DeepSeek API（非流式，因为是小改动）
    ↓
解析返回的修改后 JSON + 摘要说明
    ↓
前端更新 TripPlan state → 日程/地图/预算自动刷新
```

#### Prompt 策略
- System Prompt 要求：只改动相关部分，其余不变
- 修改后重新计算 budget
- 输出格式：一句话说明 + 完整 JSON

---

## 4. API 设计

### 4.1 行程生成

```
POST /api/trip/generate
```

**Request Body:**
```json
{
  "description": "5天大理丽江，预算5000，情侣游",
  "params": {
    "days": 5,
    "budget": 5000,
    "travelers": 2,
    "preferences": ["自然风光", "美食"]
  }
}
```

**Response (SSE Stream):**
```
event: progress
data: {"stage": "analyzing", "message": "正在分析您的旅行需求..."}

event: progress
data: {"stage": "planning", "message": "规划行程路线中..."}

event: progress
data: {"stage": "enriching", "message": "获取景点详情..."}

event: complete
data: {"plan": { ... TripPlan 对象 ... }}
```

### 4.2 图片解析

```
POST /api/trip/parse-image
```

**Request Body:**
```json
{
  "images": ["base64..."],
  "context": "用户补充说明（可选）"
}
```

**Response:**
```json
{
  "extracted": {
    "destinations": ["大理古城", "洱海", "丽江古城"],
    "restaurants": ["段公子·大理白族菜"],
    "days": 5,
    "highlights": ["环洱海骑行", "苍山索道"],
    "estimatedBudget": 4000
  },
  "suggestedDescription": "5天大理丽江之旅，包含环洱海骑行、苍山索道..."
}
```

### 4.3 POI 详情

```
GET /api/poi/detail?name={name}&city={city}
```

**Response:**
```json
{
  "name": "段公子·大理白族菜",
  "rating": 4.6,
  "cost": 78,
  "address": "大理古城人民路 112 号",
  "location": { "lat": 25.6065, "lng": 100.1553 },
  "openTime": "11:00-22:00",
  "tags": ["白族菜", "特色餐厅"]
}
```

### 4.4 路线规划

```
POST /api/map/route
```

**Request Body:**
```json
{
  "origin": { "lat": 25.6065, "lng": 100.1553 },
  "destination": { "lat": 25.6102, "lng": 100.1612 },
  "mode": "walking"
}
```

### 4.5 行程追问修改（双模式：对话 + 修改）

```
POST /api/trip/refine
```

**Request Body:**
```json
{
  "currentPlan": { "...完整 TripPlan JSON..." },
  "instruction": "推荐几个酒店 / Day1 午餐换成北京烤鸭",
  "history": [
    { "role": "user", "content": "之前的对话..." },
    { "role": "assistant", "content": "之前的回复..." }
  ]
}
```

**Response（对话模式）：**
```json
{
  "type": "chat",
  "reply": "这里有几个推荐的酒店：1. xxx 2. xxx 3. xxx"
}
```

**Response（修改模式）：**
```json
{
  "type": "update",
  "plan": { "...修改后的完整 TripPlan JSON..." },
  "summary": "已将 Day1 午餐从鼎泰丰替换为全聚德烤鸭店"
}
```

---

## 5. 项目结构

```
tripcraft/
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx                # 主页面（单页应用 shell）
│   ├── globals.css             # 全局样式 + 动画
│   ├── api/
│   │   ├── trip/
│   │   │   ├── generate/route.ts    # 行程生成 API（SSE 流式）
│   │   │   ├── refine/route.ts      # 行程追问修改 API（对话+修改双模式）
│   │   │   └── parse-image/route.ts # 图片解析 API（豆包多模态）
│   │   ├── poi/
│   │   │   └── detail/route.ts      # POI 详情 API
│   │   └── map/
│   │       └── route/route.ts       # 路线规划 API
├── components/
│   ├── HomeView.tsx            # 首页输入组件（文本+图片+标签）
│   ├── LoadingView.tsx         # 生成进度页（真实 SSE 事件驱动）
│   ├── ResultView.tsx          # 结果页 shell
│   ├── ChatBubble.tsx          # AI 对话助手（可拖拽悬浮球+对话面板）
│   ├── ScheduleView.tsx        # 日程视图
│   ├── MapView.tsx             # 地图视图（高德 JS API 2.0）
│   ├── BudgetView.tsx          # 预算面板（含逐项明细展开）
│   └── PoiCard.tsx             # POI 推荐卡片
├── lib/
│   ├── ai.ts                   # DeepSeek API 封装（流式 + 非流式）
│   ├── prompts.ts              # Prompt 模板（生成 + 修改 + 路径优化）
│   └── types.ts                # TypeScript 类型定义
├── middleware.ts               # 高德地图代理（Key 替换）
├── public/
├── .env.local                  # 环境变量
├── next.config.ts              # Next.js 配置
├── package.json
└── tsconfig.json
```

---

## 6. 环境变量

```env
# DeepSeek API（行程生成 + 对话修改）
DEEPSEEK_API_KEY=sk-xxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 豆包多模态 API（攻略截图识别）
DOUBAO_API_KEY=ark-xxxxx
DOUBAO_MODEL=doubao-seed-2.1-pro
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 高德开放平台
NEXT_PUBLIC_AMAP_KEY=xxxxxxxx       # Web端 JS API Key（前端地图渲染）
NEXT_PUBLIC_AMAP_SECRET=xxxxxxxx    # 安全密钥
# 另需一个 Web服务 Key 用于 middleware 代理鉴权（写在 middleware.ts 中）

# 应用配置
NEXT_PUBLIC_BASE_URL=https://tripcraft.vercel.app
```

---

## 7. 性能优化

| 策略 | 实现 |
|------|------|
| 流式响应 | AI 生成使用 SSE，边生成边展示 |
| 图片压缩 | 前端上传前压缩至 1024px / < 1MB |
| 地图懒加载 | 结果页切到地图 Tab 时才初始化高德 |
| POI 缓存 | 相同城市的 POI 查询结果缓存 1 小时 |
| 骨架屏 | 结果页加载时展示骨架占位 |

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|----------|
| AI 生成失败 | 重试 1 次，仍失败则提示用户重新输入 |
| AI 返回格式错误 | 后端做 JSON 校验 + 修复，兜底重新请求 |
| 高德 API 限流 | 返回降级结果（有行程无路线） |
| 图片识别失败 | 提示用户换一张图或改用文本输入 |
| 网络超时 | 前端 30s 超时，提示重试 |

---

## 9. 安全考虑

| 风险 | 措施 |
|------|------|
| API Key 泄露 | 高德 Web服务 Key 仅后端使用，JS Key 设域名白名单 |
| 用户图片隐私 | 图片处理后不持久化存储 |
| Prompt 注入 | 对用户输入做基础过滤，System Prompt 强约束输出格式 |
| 接口滥用 | Vercel Edge 层做频率限制（10 次/分钟/IP） |

---

## 10. 部署方案

```
代码推送 GitHub → Vercel 自动构建 → 全球 CDN 分发
                                    ↓
                         自定义域名（可选）
                         tripcraft.vercel.app（默认）
```

### Vercel 配置
- Framework: Next.js
- Build Command: `pnpm build`
- Node.js Version: 20.x
- Region: Hong Kong（hkg1）— 国内访问快
- Environment Variables: 在 Vercel Dashboard 配置
