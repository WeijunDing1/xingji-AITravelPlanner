# 行迹 TripCraft — 可交互原型生成指令（分步发送版）

> 本文档按步骤拆分，每一步复制发送给原型 AI。每步之间等 AI 完成后再发下一步。

---

## 📌 使用说明

1. 按 `Step 1 → Step 2 → Step 3 → Step 4 → Step 5` 顺序发送
2. 每一步之间用分割线 `---` 隔开，单独复制发送
3. Step 1 建立全局设计基础，Step 2-4 逐页生成，Step 5 串联交互和润色
4. 如果 AI 输出截断，回复「继续」即可

---

---

# Step 1：项目初始化 + 全局设计系统

请帮我创建一个**单文件 HTML 可交互原型**，模拟一个名为「行迹 TripCraft」的 AI 旅行规划助手产品。

## 产品背景
行迹 TripCraft 是一个面向 18-35 岁年轻用户的 AI 旅行规划工具。用户输入旅行想法（文字或截图），AI 自动输出带地图路线、预算明细、真实推荐的完整攻略。移动端 Web 优先。

## 技术要求
- **单个 HTML 文件**，内联所有 CSS 和 JS
- 原生 CSS + 原生 JavaScript（不使用任何框架）
- CSS 变量管理所有设计 token
- 响应式：移动端全屏，桌面端居中卡片（max-width: 390px，min-height: 844px）
- 桌面端背景有微妙的渐变网格纹理，手机模拟器容器带圆角
- 所有图标使用 emoji 或内联 SVG
- 确保 iOS Safari 和 Chrome 流畅运行

## 设计审美方向
- **风格**：Glassmorphism + 微渐变 + 呼吸感留白 + 精致微交互
- **气质参考**：Linear.app 的精致感 × 小红书的年轻活力 × Apple Maps 的地图质感
- **避免**：廉价感、过于扁平无层次、老气的 UI、拥挤排版

## 设计 Token（请用 CSS 变量定义）

```css
:root {
  /* 配色 */
  --color-primary: #6366F1;
  --color-primary-end: #8B5CF6;
  --gradient-primary: linear-gradient(135deg, #6366F1, #8B5CF6);
  --color-accent: #F59E0B;          /* 琥珀金，金额/高亮 */
  --color-success: #10B981;          /* 翡翠绿 */
  --color-bg: #FAFBFE;              /* 微带蓝的白底 */
  --color-card: #FFFFFF;
  --color-glass: rgba(255, 255, 255, 0.72);
  --color-text: #1E1B4B;            /* 深靛蓝黑 */
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-border: rgba(99, 102, 241, 0.08);

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(99,102,241,0.04), 0 4px 12px rgba(99,102,241,0.06);
  --shadow-md: 0 4px 16px rgba(99,102,241,0.08), 0 12px 32px rgba(99,102,241,0.12);
  --shadow-lg: 0 8px 24px rgba(99,102,241,0.12), 0 20px 48px rgba(99,102,241,0.16);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* 动效 */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* 字体 */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Noto Sans SC", sans-serif;
}
```

## 页面结构概述
共 3 个视图（单页应用，JS 控制切换）：
1. **首页** — 输入旅行需求
2. **Loading 页** — AI 生成进度动画
3. **结果页** — 行程/地图/预算三个 Tab

## 本步要求
请先搭建好：
1. HTML 骨架结构（三个页面容器）
2. 全局 CSS reset + 设计 token 变量
3. 手机模拟器外框 + 桌面端背景（右上角和左下角各一个大的模糊渐变色块做装饰）
4. 页面切换的 JS 基础逻辑（用 CSS transform + opacity 做滑动过渡动画）
5. 全局按钮按压动效（active 时 scale 0.96）

先完成这个基础框架，后面我会逐步给你各页面的详细设计。

---

---

# Step 2：首页（输入页）完整设计

在 Step 1 的基础上，请完成**首页（输入页）**的全部 UI 和交互。

## 布局结构（从上到下）

### 1. 顶部品牌区
- 一个精致的渐变 icon：用 SVG 画一个飞机+路径的抽象图形（主色渐变填充）
- 产品名「行迹」— 24px 粗体，使用 gradient text 效果（主色渐变裁剪文字）
- 副标题「AI 旅行规划师」— 13px，颜色 var(--color-text-secondary)
- 整体居中，顶部留 48px 呼吸空间
- 品牌区底部加一层极淡的噪点纹理（用 CSS background-image SVG filter 实现）

### 2. 文本输入框
- 圆角 16px 的 textarea，最小高度 120px，max-height 200px（超出滚动）
- 内边距 16px，背景 var(--color-card)
- 默认边框：1px solid var(--color-border)
- placeholder 文字（灰色）：
  ```
  描述你的旅行想法...
  
  例如：5天大理丽江，情侣游，预算5000，喜欢自然风光和美食
  ```
- **focus 状态**：边框变为 2px 主色，外层 box-shadow 发出一圈淡紫色 glow：
  ```css
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  ```
- 右下角显示字数统计「0/500」— 12px 灰色，动态更新

### 3. 图片上传区
- 文本框下方 12px
- 一个圆角 12px、虚线边框（2px dashed var(--color-border)）的矩形区域，高度 60px
- 居中显示：📷 图标 + 「上传旅游笔记截图（最多3张）」灰色文字
- 点击时模拟上传效果：显示一个 60×60 的圆角缩略图色块 + 右上角 × 删除按钮
- 纯 UI 模拟，不需要真实上传功能

### 4. 快捷标签区
- 标签区与输入区间距 24px
- 4 组标签，每组有一个 label（12px，var(--color-text-muted)，margin-bottom 8px）：

**天数**（单选）：`3天` `5天` `7天` `自定义`
**预算**（单选）：`¥3000` `¥5000` `¥8000` `不限`
**人数**（单选）：`独自旅行` `情侣出游` `家庭亲子` `朋友同行`
**偏好**（多选）：`自然风光` `人文美食` `文艺小众` `刺激冒险` `休闲购物`

**标签胶囊样式**：
```css
/* 未选中 */
background: var(--color-card);
border: 1px solid rgba(99, 102, 241, 0.12);
border-radius: 9999px;
height: 34px;
padding: 0 14px;
font-size: 13px;
color: var(--color-text-secondary);
transition: all var(--duration-normal) var(--ease-out);

/* 选中 */
background: var(--gradient-primary);
color: #fff;
border-color: transparent;
box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
transform: scale(1); /* 点击时先 0.95 再弹到 1.02 再回 1 */

/* hover（桌面端） */
background: rgba(99, 102, 241, 0.06);
```

- 每组标签之间间距 16px
- 标签之间水平间距 8px，允许换行

### 5. 底部操作按钮
- 标签区下方 32px
- **「开始规划 ✨」** — 全宽按钮
- 样式：
  ```css
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-out);
  ```
- **未激活态**（文本框为空且无标签选中）：opacity: 0.4，pointer-events: none
- **激活态**：opacity: 1，hover 时 translateY(-1px) + shadow-lg
- **点击态**：transform: scale(0.97)
- 底部留 32px 安全区

### 交互逻辑（JS）
1. textarea 输入任意字符 → 按钮激活
2. 或选中任何一个标签 → 按钮也激活
3. 点击标签：
   - 天数/预算/人数组：单选（点击已选中的取消选中）
   - 偏好组：多选（toggle）
   - 选中时添加弹性动画 class
4. 点击「开始规划」→ 调用页面切换函数，过渡到 Loading 页

---

---

# Step 3：Loading 页（生成中）完整设计

在前面的基础上，请完成 **Loading 页（生成中）** 的全部 UI 和动画。

## 视觉设计

### 背景
- 页面背景使用径向渐变：中心 var(--color-bg)，四周 #F0F0FE（微微带紫）

### 主视觉动画区（垂直居中偏上，top 约 25%）
- **中心图标**：一个 80×80px 的圆形区域
  - 内部放一个飞机 ✈️ emoji（font-size 36px）或用 SVG
  - 外圈：用 conic-gradient 画一个旋转的渐变光环
  ```css
  .spinner-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent, var(--color-primary), transparent);
    animation: spin 2s linear infinite;
    /* 内部用一个小圆遮罩出环形效果 */
  }
  ```
- **标题文字**：光环下方 20px
  - 「正在为您规划完美行程...」— 18px，var(--color-text)，font-weight 500
  - 整行有淡入淡出呼吸灯效果（opacity 在 0.6-1 之间循环）

### 进度步骤列表
- 位于标题下方 32px
- 宽度 max-width: 260px，居中
- 5 个步骤项，垂直排列，每项高 44px，左对齐

每项结构：`[状态图标 20px] [步骤文字 14px]`

状态图标三种形态：
- **等待中** ⚪：一个 20px 空心圆，border: 2px solid var(--color-text-muted)
- **进行中** 🔄：主色 spinner 小圈旋转（16px 直径）
- **已完成** ✅：翡翠绿实心圆 + 白色对勾 SVG，用 scale 弹入动画（0 → 1.2 → 1）

步骤内容及时序（自动播放）：
```
1. "分析旅行需求"        → 进入页面 1.0s 后完成
2. "搜索目的地信息"      → 2.0s 后完成
3. "规划最优路线"        → 3.5s 后完成
4. "计算预算明细"        → 5.0s 后完成
5. "生成推荐方案"        → 6.5s 后完成
```

### 底部倒计时
- 步骤列表下方 32px
- 「预计还需 X 秒」— 13px，var(--color-text-muted)
- 数字从 8 开始每秒递减至 0
- 使用 tabular-nums 避免数字宽度跳动

### 动画时序总控（JS）
```
0.0s — 页面滑入，中心动画 fade in + scale(0.8→1)
0.3s — 步骤列表淡入
1.0s — 步骤1 完成（spinner→勾）
2.0s — 步骤2 完成
3.5s — 步骤3 完成
5.0s — 步骤4 完成
6.5s — 步骤5 完成
7.0s — 整页淡出 + 上移退出 → 结果页从下方滑入
```

### 注意
- 此页面不需要返回按钮
- 过渡动画要平滑（duration 500ms，ease-out）
- 步骤完成时那个绿色对勾要有明显的「弹入」感，让用户觉得有进展

---

---

# Step 4：结果页（日程 / 地图 / 预算）完整设计

在前面基础上，请完成**结果页**的全部 UI 和交互。这是最复杂的一页，包含导航栏、摘要卡、Tab 切换、三个 Tab 内容区、底部操作栏。

## 整体结构（从上到下）

### 1. 顶部导航栏（固定 sticky）
- 高度 56px，背景 var(--color-glass) + backdrop-filter: blur(20px)
- 左侧：「←」返回按钮（点击回到首页）
- 中间：「大理丽江5日游」— 16px semibold
- 右侧：🔗 分享图标（点击后 toast 提示「链接已复制」）
- 底部 1px border-bottom: var(--color-border)

### 2. 行程摘要卡
- padding: 16px 20px
- 标题：「5天4晚大理丽江浪漫之旅」— 20px bold，使用 gradient text（主色渐变裁剪）
- 副信息：「2人 · 预计 ¥4,860」— 14px，灰色文字，其中 ¥4,860 用 var(--color-accent) 琥珀色
- 底部一条 1px 渐变分割线（从透明到主色到透明）

### 3. Tab 切换栏（sticky，紧贴导航栏下）
- 三个等宽 Tab：`📋 日程` · `🗺 地图` · `💰 预算`
- 未选中：var(--color-text-secondary)，14px
- 选中：var(--color-primary)，font-weight 600
- 底部指示条：3px 高，圆角，主色渐变背景，宽度与文字等宽
- 指示条切换时有滑动过渡动画（transform: translateX）
- 指示条下方加一层模糊光晕（filter: blur(4px), opacity 0.5）

### 4. Tab 内容区

---

#### Tab 1：日程视图

**Day 横向切换条**：
- 横向滚动容器，内有 5 个胶囊按钮：`Day1` `Day2` `Day3` `Day4` `Day5`
- 选中态：主色背景 + 白色文字 + 轻微放大（scale 1.05）
- 未选中：白底 + 浅灰边框 + 灰色文字
- 允许手指左右滑动

**日程时间线**：
- 左侧有一条 2px 渐变竖线（从主色顶部到底部淡出）
- 每个 POI 为一张卡片，卡片左边缘有 3px 彩色竖线（类型色）
- 卡片间有交通节点：虚线 + 交通信息文字

**POI 卡片**（Day 1 共 5 张）：
```
┌──────────────────────────────────────┐
│ 09:00                    ┌────────┐  │
│                          │🏛 景点  │  │ ← 类型标签（小胶囊）
│ 大理古城                  └────────┘  │ ← 16px bold
│ 漫步古城，感受白族建筑和文化           │ ← 13px 灰色
│                                      │
│ ⏱ 2小时  ·  ⭐ 4.5  ·  💰 免费      │ ← 12px 灰色
│ 📍 人民路                            │ ← 12px 灰色
└──────────────────────────────────────┘
```

卡片样式：
- 背景白色，圆角 var(--radius-lg)
- 阴影 var(--shadow-sm)
- padding 16px
- 左边缘 3px 竖线颜色按类型：景点=#6366F1，餐厅=#F59E0B，住宿=#10B981

**交通连接节点**样式：
```
        ┆  🚶 步行 10分钟 · 0.8km
```
- 虚线 + 图标 + 灰色小字 13px

**Day 1 mock 数据**：

| 时间 | 类型 | 名称 | 描述 | 时长 | 费用 | 评分 | 地址 |
|------|------|------|------|------|------|------|------|
| 09:00 | attraction | 大理古城 | 漫步古城，感受白族建筑和文化 | 2h | 免费 | 4.5 | 人民路 |
| 11:30 | restaurant | 段公子·白族菜 | 推荐：砂锅鱼、烤乳扇、凉鸡米线 | 1h | ¥78/人 | 4.6 | 古城人民路112号 |
| 14:00 | attraction | 洱海环湖东线 | 租电动车沿环海东路骑行，途经双廊 | 4h | ¥80/车 | 4.8 | 环海东路 |
| 18:30 | restaurant | 翠田·洱海边餐厅 | 洱海边日落晚餐，推荐酸辣鱼 | 1.5h | ¥120/人 | 4.7 | 双廊镇环海路 |
| 20:30 | hotel | 大理海景民宿 | 洱海边观景民宿，含早餐 | — | ¥380/晚 | 4.9 | 双廊镇大建旁村 |

交通连接：
- 古城 → 段公子：🚶 步行 10 分钟 · 0.8km
- 段公子 → 洱海东线：🚗 打车 25 分钟 · 18km
- 洱海东线 → 翠田：🚲 骑行 15 分钟 · 4km
- 翠田 → 民宿：🚶 步行 5 分钟 · 0.4km

**Day 2-5**：只需放少量占位卡片（各 2-3 个），用于演示切换效果。

---

#### Tab 2：地图视图

**地图区域**（占视口约 55% 高度）：
- 用 CSS 画一个简化抽象地图：
  - 背景：浅绿色 #E8F5E9
  - 左侧一块蓝色水域（模拟洱海）：#BBDEFB，不规则形状（用 border-radius 或 clip-path）
  - 几条白色细线交叉（模拟路网）
- 地图上 5 个 POI 标注点（绝对定位）：
  - 小圆形图标（24px），颜色按类型
  - 点击显示名称 tooltip
  - 相邻点之间用彩色虚线连接
- 标注点分布合理（不要堆叠）

**底部信息面板**：
- 从底部上浮的圆角面板（border-radius: 20px 20px 0 0）
- 顶部有一个拖拽提示条（40px 宽 4px 高灰色圆角条，居中，纯装饰）
- 内含：
  - Day 切换胶囊（同日程视图）
  - 统计信息：「总距离 12.3km · 步行3段 · 骑行1段 · 打车1段」
  - 14px，灰色

---

#### Tab 3：预算视图

**总预算卡片**（居中）：
- 「总预算」— 14px 灰色
- **¥4,860** — 32px bold，var(--color-accent) 琥珀色
  - 首次出现时有数字从 0 滚动上升的动画（count up）
- 「人均 ¥2,430」— 13px 灰色

**环形图**（CSS conic-gradient 实现）：
- 外径 180px，内径 120px（用内圆遮罩）
- 分段：
  - 交通 28% → #6366F1
  - 住宿 35% → #8B5CF6
  - 餐饮 22% → #F59E0B
  - 门票 10% → #10B981
  - 其他 5% → #9CA3AF
- 入场动画：环形从 0° 转到完整角度（1s ease-out）
- 中心文字：「¥4,860」16px bold
- 图例在环形图下方，每项一行：`色块圆点 + 类目名 + 金额 + 百分比`

**费用明细列表**：
```
🚗 交通                    ¥1,360
  · 大理机票往返              ¥1,000
  · 市内交通                  ¥360

🏨 住宿                    ¥1,700
  · 大理海景民宿3晚            ¥900
  · 丽江古城客栈1晚            ¥800

🍜 餐饮                    ¥1,070
  · 约¥107/餐 × 10餐

🎫 门票                     ¥480
  · 苍山索道 ¥200
  · 玉龙雪山 ¥180
  · 其他小景点 ¥100

🛍 其他                     ¥250
  · 伴手礼/零食等
```
- 每个大类是一个可折叠区块（点击 toggle 子项）
- 大类：15px semibold，金额右对齐
- 子项：13px 灰色，左侧 padding-left: 24px

---

### 5. 底部操作栏（固定底部）
- 高度 76px（含 safe-area padding）
- 背景 var(--color-glass) + backdrop-filter: blur(20px)
- 顶部 1px border
- 内部两个按钮并排，间距 12px，margin: 0 20px：
  - 左按钮「🔄 重新生成」：白底 + 主色边框 + 主色文字，flex: 1
  - 右按钮「💾 保存行程」：渐变背景 + 白色文字，flex: 1
  - 共同：高 46px，圆角 12px，font-size 14px，font-weight 500
- 「重新生成」点击 → 回到首页
- 「保存行程」点击 → toast 提示「行程已保存」

---

---

# Step 5：全局串联 + 微交互润色 + 最终检查

请对整个原型做最后一轮**打磨和串联**，确保以下体验完美：

## 页面过渡动画
- 首页 → Loading：当前页向左滑出 + 淡出，Loading 从右滑入 + 淡入（duration 500ms）
- Loading → 结果页：Loading 向上滑出 + 淡出，结果页从下方滑入（duration 500ms）
- 结果页 → 首页（返回）：结果页向右滑出，首页从左滑入
- 所有过渡使用 var(--ease-out) 曲线

## 微交互清单（逐项确认）
1. ✅ 所有可点击元素 active 时 transform: scale(0.96)
2. ✅ 桌面端卡片 hover 时 translateY(-2px) + shadow 增强
3. ✅ Tab 切换时内容区有 fade + 轻微横移过渡
4. ✅ 标签选中时弹性缩放（keyframes: 1 → 0.95 → 1.02 → 1）
5. ✅ Loading 对勾弹入动画（scale: 0 → 1.3 → 1，带 ease-spring）
6. ✅ 预算金额首次显示时 count-up 动画（从 0 到目标数字，1s）
7. ✅ 环形图旋转入场（从 0 conic 角度到正确比例，1s ease-out）
8. ✅ Day 切换条横向可滑动 + scroll-snap-type: x mandatory
9. ✅ 输入框 focus 时紫色外发光（glow）
10. ✅ Toast 通知：从底部弹出，3 秒后自动消失

## 设计增强确认
1. ✅ 结果页标题使用 gradient text（-webkit-background-clip: text）
2. ✅ POI 卡片左侧 3px 彩色竖线（按类型着色）
3. ✅ Tab 指示条有底部光晕（blur 伪元素）
4. ✅ 外层背景有两个装饰性 blob（右上 + 左下，大尺寸模糊渐变圆）
5. ✅ 品牌区有极淡噪点纹理
6. ✅ 所有颜色通过 CSS 变量管理（dark mode ready）

## 最终验收流程（请自查）
1. 打开页面 → 首页美观完整
2. 输入文字或选标签 → 按钮从灰变亮
3. 点击「开始规划」→ 平滑滑入 Loading
4. Loading 进度逐步完成（~7s）→ 自动跳转结果页
5. 结果页 Tab 可自由切换（日程/地图/预算）
6. 日程页 Day 可切换，内容更新
7. 地图页有可视化 POI 和路线
8. 预算页环形图比例正确 + 明细可折叠
9. 点击「← 返回」→ 回到首页，可重新开始
10. 所有动画丝滑流畅，无跳帧

## 如有遗漏或 bug，请直接修复后输出最终完整代码。

---

---

# 💡 备用指令：一次性生成版

> 如果你使用的 AI 支持超长输出（如 Claude / GPT-4 + Canvas），也可以将 Step 1-5 合并为一条消息发送。方法：删除各 Step 之间的分割说明，将全部内容作为一个连续 prompt 发送，在开头加上：

```
请一次性生成完整的单文件 HTML 可交互原型，包含所有页面、交互和动画。以下是完整的设计规格：
```
