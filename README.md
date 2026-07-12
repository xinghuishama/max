神码再现 · 前端技术架构文档

一个纯前端静态单页应用（SPA），用于澳门六合彩数据辅助分析。
版本：v3.7.14 · 严格 CSP 版
在线地址：https://xinghuishama.github.io/max/index.html

---

📦 项目简介

神码再现 是一个完全运行在浏览器端的号码频次分析工具，无需任何后端服务。它通过调用第三方 API 获取实时开奖与历史数据，在本地完成号码解析、频次统计、多维度筛选与可视化渲染，所有用户状态（输入记录、筛选条件、历史缓存）均持久化在浏览器的 localStorage 中。

---

🧱 技术栈概览

类别 技术选型 说明
核心语言 原生 JavaScript (ES6+) 无框架依赖，零构建工具
样式方案 Tailwind CSS (工具类内联) + 自定义 CSS 通过 style.css 提供全部样式，无运行时生成
模块架构 IIFE (Immediately Invoked Function Expression) 三大模块：data.js → app.js → 设置菜单，通过 window.__SHARED_DATA__ 共享数据
数据持久化 localStorage + JSON 序列化 含 Schema 版本控制、过期清理、容量超限自动清理
网络请求 原生 fetch + AbortController 超时控制：Promise.race([fetch, timeout])，支持外部信号合并（竞态取消）
日期时间 手动计算北京时间（UTC+8） 多源时间同步（腾讯 / Akamai / API 响应头），失败时降级到本地时间
安全策略 CSP (Content Security Policy) + SRI (Subresource Integrity) 通过 <meta> 标签限制资源来源，外部文件均附带 integrity 哈希校验
性能优化 输入防抖 (200ms) · 缓存写入防抖 (1s) · TypedArray 频次统计 · DOM 文档片段批量渲染 低端设备友好
部署平台 GitHub Pages 纯静态托管，不支持自定义 HTTP 头，因此 CSP 只能通过 <meta> 实现

---

🏗️ 架构设计

模块分层

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│  (HTML 结构 + CSP meta + 外部资源引用)              │
├─────────────────────────────────────────────────────┤
│                     style.css                        │
│  (所有样式：Tailwind 工具类 + 自定义组件样式)       │
├─────────────────────────────────────────────────────┤
│                     app.js                          │
│  ┌─────────────────────────────────────────────┐    │
│  │              APP_CONFIG                      │    │
│  │  (所有配置常量：API、超时、缓存上限等)       │    │
│  ├─────────────────────────────────────────────┤    │
│  │              data.js (IIFE)                 │    │
│  │  • 生肖/五行/波色/数段映射生成               │    │
│  │  • 号码属性数组 numProps                    │    │
│  │  • 导出到 window.__SHARED_DATA__            │    │
│  ├─────────────────────────────────────────────┤    │
│  │              app.js (IIFE)                  │    │
│  │  • 状态管理 (Pub-Sub 模式)                  │    │
│  │  • 输入解析 + 频次计算 (Uint16Array)        │    │
│  │  • 结果渲染 (DocumentFragment)              │    │
│  │  • 开奖实时刷新 (轮询 + 开奖窗口检测)        │    │
│  │  • 历史数据缓存 (年份 + 分页)               │    │
│  │  • 抽屉系统 (动态模板 + 事件委托)            │    │
│  │  • 启动画面 (进度模拟 + 业务就绪关闭)        │    │
│  ├─────────────────────────────────────────────┤    │
│  │         设置菜单 (IIFE)                     │    │
│  │  • 频次动态调整开关                         │    │
│  │  • localStorage 同步                        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

数据流

```
用户输入 (textarea)
       ↓
   parseInputCount()     ← 生肖 → 号码展开
       ↓
   rawCount (Uint16Array)
       ↓
   killSet + 筛选条件 → hitCounts
       ↓
   freqAdjEnabled ? 衰减 : 原始
       ↓
   adjustedCount (Uint16Array)
       ↓
   renderResult()
       ↓
   DOM 更新 (DocumentFragment)
       ↓
   saveInputCacheDelayed() (1s 防抖)
```

状态管理（极简 Pub-Sub）

```javascript
let state = { killNums: [], selectedFilters: { ... } };
let subscribers = [];

function subscribe(fn) { subscribers.push(fn); }
function notify() { subscribers.forEach(fn => fn()); }

// 每次状态变更 → notify() → runAnalysis() → saveState()
```

---

🔐 安全措施详解

1. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  connect-src https://macaumarksix.com https://history.macaumarksix.com https://vv.video.qq.com https://time.akamai.com;
  img-src * data:;
">
```

· ✅ 脚本与样式完全拒绝内联，只能加载同源外部文件。
· ✅ API 请求限制在指定域名白名单内。
· ⚠️ 图片策略较宽松（* data:），但图片通常不构成主要攻击面。

2. 子资源完整性 (SRI)

```html
<link rel="stylesheet" href="style.css" integrity="sha384-..." crossorigin="anonymous">
<script src="app.js" integrity="sha384-..." crossorigin="anonymous"></script>
```

· 浏览器加载外部文件前校验哈希，防止 CDN / 服务器被篡改。
· 每次修改 style.css 或 app.js 后，需用 openssl dgst -sha384 -binary <file> | base64 | tr -d '\n' 重新生成并更新 integrity 属性。

---

⚙️ 核心算法与数据结构

生肖映射

```javascript
// 以 2024 年为基准 (龙年)，动态计算任意年份的生肖 → 号码映射
const BASE_YEAR = 2024;
const ZODIAC_SEQUENCE = ["龍","蛇","馬","羊","猴","雞","狗","豬","鼠","牛","虎","兔"];

function generateShengxiaoMap(year) {
  const taiSuiIdx = ((year - BASE_YEAR) % 12 + 12) % 12;
  // 每个生肖对应 5 个号码 (1~49 范围内)
}
```

五行映射（30 年周期）

```javascript
const WUXING_BASE_SEQ = ['金','金','土','土','木','木','火','火','金','金', ...];
// 每个号码 (1~49) 根据 (num - 1) % 30 和年份偏移计算五行
```

频次计算（内存高效）

· 使用 Uint16Array / Uint8Array 而非普通 Array，内存占用更低。
· 单次分析时间复杂度：O(n + 49 * k)，其中 n 为输入号码数，k 为筛选条件数。

输入解析（容错强）

```javascript
// 支持：数字 12、生肖中文 "龙蛇马"、混合输入 "12 龙 25 马"
// 内部将繁体/简体统一映射
const cleaned = input.replace(/《[^》]*》/g, " ")
  .replace(/[^\d鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪\s]/g, " ")
  .replace(/([鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪])/g, " $1 ");
```

---

📁 文件结构

```
/
├── index.html          # 主页面 (含 CSP meta + 外部资源引用)
├── style.css           # 所有样式 (Tailwind 工具类 + 自定义组件)
├── app.js              # 完整应用逻辑 (data + app + 设置菜单)
└── README.md           # 本文档
```

---

🚀 部署

GitHub Pages

```bash
# 1. 提交代码到仓库
git add .
git commit -m "v3.7.14"
git push origin main

# 2. 在 GitHub 仓库设置中启用 Pages (分支: main, 目录: /)
# 3. 访问 https://<username>.github.io/<repo>/index.html
```

本地预览

```bash
# 使用 Python 3 内置服务器
python3 -m http.server 8080

# 或使用 Node.js 的 serve
npx serve .
```

---

🔧 配置常量 (APP_CONFIG)

配置项 值 说明
MAX_NUMBERS 5000 输入最大解析数量
BALL_TOTAL 49 号码总数
HISTORY_MAX_ITEMS 500 历史缓存最大条目数
DEBOUNCE_MS 200 输入防抖间隔
INPUT_SAVE_DEBOUNCE_MS 1000 缓存写入防抖间隔
DRAW_POLL_MS 2000 开奖窗口内轮询间隔
DRAW_REGULAR_MS 60000 非开奖窗口刷新间隔
API.live macaumarksix.com/api/live2 实时开奖 API
API.historyBase history.macaumarksix.com/history/macaujc2/y/ 历史数据 API

---

📌 技术债与后续优化方向

现状 目标
IIFE 模块 + window.__SHARED_DATA__ ES Module (type="module") + import/export
无单元测试 引入 Vitest 测试生肖/五行/频次计算
手动 DOM 渲染 考虑轻量级响应式框架 (如 Preact / Vue)
localStorage 历史缓存 大数据量时迁移至 IndexedDB
手动时区计算 使用 Intl.DateTimeFormat 或 dayjs
CSP 通过 <meta> 实现 若迁移至支持 HTTP 头的服务器，改为响应头方式

---

📄 免责声明

本工具仅供技术学习与个人研究使用。用户应遵守当地法律法规，不得将本工具用于任何违法违规用途。作者对使用本工具产生的任何后果不承担法律责任。

---

📝 更新日志

v3.7.14 (2026-07-12)

· 移除所有内联样式，收紧 style-src 至 'self'
· 添加 SRI (Subresource Integrity) 支持
· 修复历史抽屉刷新按钮换行问题
· 时间同步失败时，倒计时显示"⚠️ 离线模式"

v3.7.13 (2026-07-12)

· 修复 fetchWithTimeout 外部信号合并问题 (竞态取消失效)
· 修复历史缓存裁剪方向 (保留最新数据)
· 修复 fetchLottery 守卫顺序

v3.7.12 (2026-07-12)

· 移除 CSP nonce 硬编码，移除 unsafe-inline
· 修复 fetchWithTimeout 内存泄漏
· 增加时间同步失败用户提示
· 全局状态封装在 IIFE 闭包内
· 输入缓存增加独立防抖
· 历史缓存增加条目上限 (500 条)

---

维护者：xinghuishama
许可证：MIT