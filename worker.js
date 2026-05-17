// ======================== worker.js — 独立 Worker 分析引擎 v3.6 ========================
// 特性：
// 1. 自动生肖（澳门六合彩规则）
// 2. 尾数筛选修复（支持 10 尾）
// 3. 合数筛选修复（只匹配“数字+合”）
// 4. 命中次数不再被 3 限制（完整统计）
// 5. 与主线程 app.js 完全同步
// 6. 性能优化（缓存 + 循环优化）

(function () {
  "use strict";

  const MAX_NUMBERS = 5000;

  // ======================== 自动生肖（澳门六合彩规则） ========================
  function getCurrentZodiac() {
    const seq = ["龙","蛇","马","羊","猴","鸡","狗","猪","鼠","牛","虎","兔"];
    const year = new Date().getFullYear();
    const index = (year - 2024) % 12;
    return seq[(index + 12) % 12];
  }

  function buildZodiacMap() {
    const seq = ["龙","蛇","马","羊","猴","鸡","狗","猪","鼠","牛","虎","兔"];
    const year = new Date().getFullYear();
    const startIndex = (year - 2024) % 12;

    const ordered = [];
    for (let i = 0; i < 12; i++) {
      ordered.push(seq[(startIndex + i + 12) % 12]);
    }

    const map = {};
    let num = 1;
    for (let i = 0; i < 12; i++) {
      const name = ordered[i];
      map[name] = [];
      for (let j = 0; j < 4; j++) {
        map[name].push(num++);
      }
    }

    map[getCurrentZodiac()].push(49);
    return map;
  }

  const SHENGXIAO = buildZodiacMap();

  // ======================== 五行 / 波色 / 数段（保持原版） ========================
  const CATEGORIES = {
    金: [4, 5, 12, 13, 26, 27, 34, 35, 42, 43],
    木: [8, 9, 16, 17, 24, 25, 38, 39, 46, 47],
    水: [1, 14, 15, 22, 23, 30, 31, 44, 45],
    火: [2, 3, 10, 11, 18, 19, 32, 33, 40, 41, 48, 49],
    土: [6, 7, 20, 21, 28, 29, 36, 37],
    红波: [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46],
    蓝波: [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48],
    绿波: [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]
  };

  const DUAN = {
    "1段": [1, 2, 3, 4, 5, 6, 7],
    "2段": [8, 9, 10, 11, 12, 13, 14],
    "3段": [15, 16, 17, 18, 19, 20, 21],
    "4段": [22, 23, 24, 25, 26, 27, 28],
    "5段": [29, 30, 31, 32, 33, 34, 35],
    "6段": [36, 37, 38, 39, 40, 41, 42],
    "7段": [43, 44, 45, 46, 47, 48, 49]
  };

  // ======================== numProps 预计算（与 data.js 同步） ========================
  let numProps = new Array(50);

  function buildNumProps() {
    const sxEntries = Object.entries(SHENGXIAO);
    const duanEntries = Object.entries(DUAN);

    for (let n = 1; n <= 49; n++) {
      const head = Math.floor(n / 10);
      const tail = n % 10;
      const odd = n % 2 === 1 ? "单" : "双";
      const color = CATEGORIES.红波.includes(n)
        ? "red"
        : CATEGORIES.蓝波.includes(n)
        ? "blue"
        : "green";
      const five =
        CATEGORIES.金.includes(n)
          ? "金"
          : CATEGORIES.木.includes(n)
          ? "木"
          : CATEGORIES.水.includes(n)
          ? "水"
          : CATEGORIES.火.includes(n)
          ? "火"
          : "土";

      const sum = head + tail;
      const sumOdd = sum % 2 === 1 ? "合数单" : "合数双";

      let duan = "";
      for (let i = 0; i < duanEntries.length; i++) {
        if (duanEntries[i][1].includes(n)) {
          duan = duanEntries[i][0];
          break;
        }
      }

      const halfOddEven =
        n > 24
          ? n % 2 === 1
            ? "大单"
            : "大双"
          : n % 2 === 1
          ? "小单"
          : "小双";

      let shengXiao = "";
      for (let i = 0; i < sxEntries.length; i++) {
        if (sxEntries[i][1].includes(n)) {
          shengXiao = sxEntries[i][0];
          break;
        }
      }

      numProps[n] = {
        head,
        tail,
        color,
        odd,
        five,
        sumOdd,
        duan,
        halfOddEven,
        shengXiao,
        sum
      };
    }
  }

  buildNumProps();

  // ======================== 输入解析（保持原版） ========================
  function parseInputWorker(input) {
    if (!input || !input.trim()) return [];
    let cleaned = input
      .replace(/《.*?》/g, " ")
      .replace(/[^0-9鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, " ")
      .replace(/([鼠牛虎兔龙蛇马羊猴鸡狗猪])/g, " $1 ");

    const tokens = cleaned.split(" ").filter(t => t.length > 0);
    if (!tokens.length) return [];

    let results = [];
    for (let token of tokens) {
      if (SHENGXIAO[token]) {
        results.push(...SHENGXIAO[token]);
      } else if (/^\d+$/.test(token)) {
        const n = Number(token);
        if (n >= 1 && n <= 49) results.push(n);
      }
    }

    return results.length > MAX_NUMBERS
      ? results.slice(0, MAX_NUMBERS)
      : results;
  }

  // ======================== 条件编译器（修复版） ========================
  function buildMatchFunc(cond) {
    if (cond.startsWith("生肖")) {
      const sx = cond.slice(2);
      return n => numProps[n].shengXiao === sx;
    }

    if (cond.endsWith("头单") || cond.endsWith("头双")) {
      const parts = cond.split("头");
      const headVal = parseInt(parts[0], 10);
      const oe = parts[1];
      return n => numProps[n].head === headVal && numProps[n].odd === oe;
    }

    // 修复：支持 10 尾，不误判
    if (cond.endsWith("尾")) {
      const numPart = cond.slice(0, -1);
      const tailVal = parseInt(numPart, 10);
      if (!Number.isInteger(tailVal) || tailVal < 0 || tailVal > 9)
        return () => false;
      return n => numProps[n].tail === tailVal;
    }

    if (cond.endsWith("段")) {
      return n => numProps[n].duan === cond;
    }

    if (cond.endsWith("波单") || cond.endsWith("波双")) {
      const parts = cond.split("波");
      const c = parts[0];
      const oe = parts[1];
      const colorMap = { 红: "red", 蓝: "blue", 绿: "green" };
      return n => numProps[n].color === colorMap[c] && numProps[n].odd === oe;
    }

    if (["金", "木", "水", "火", "土"].includes(cond)) {
      return n => numProps[n].five === cond;
    }

    if (["合数单", "合数双", "大单", "大双", "小单", "小双"].includes(cond)) {
      if (cond === "合数单") return n => numProps[n].sumOdd === "合数单";
      if (cond === "合数双") return n => numProps[n].sumOdd === "合数双";
      return n => numProps[n].halfOddEven === cond;
    }

    // 修复：只匹配“数字+合”
    if (/^\d+合$/.test(cond)) {
      const numPart = cond.slice(0, -1);
      const sumVal = parseInt(numPart, 10);
      return n => numProps[n].sum === sumVal;
    }

    return () => false;
  }

  // ======================== 匹配函数缓存 ========================
  let cachedFuncs = null;
  let lastFiltersSignature = "";

  function computeHitCounts(killNums, filters) {
    const hits = new Uint8Array(50);
    const killSet = new Set(killNums);
    const sig = filters.join("\x00");

    if (!cachedFuncs || sig !== lastFiltersSignature) {
      cachedFuncs = filters.map(buildMatchFunc);
      lastFiltersSignature = sig;
    }

    for (let n = 1; n <= 49; n++) {
      let hit = killSet.has(n) ? 1 : 0;

      for (let fn of cachedFuncs) {
        if (fn(n)) hit++; // 不再限制 hit > 3
      }

      hits[n] = hit;
    }

    return hits;
  }

  // ======================== Worker 消息入口 ========================
  self.onmessage = function (e) {
    try {
      if (e.data.numProps && Array.isArray(e.data.numProps)) {
        numProps = e.data.numProps;
      }

      const input = e.data.input || "";
      const killNums = e.data.killNums || [];
      const filters = e.data.filters || [];

      const nums = parseInputWorker(input);

      const rawCount = new Uint16Array(50);
      for (let n of nums) rawCount[n]++;

      const hitCounts = computeHitCounts(killNums, filters);

      const adjustedCount = new Uint16Array(50);
      let adjustedTotal = 0;
      let unique = 0;

      for (let n = 1; n <= 49; n++) {
        const adj = Math.max(0, rawCount[n] - hitCounts[n]);
        adjustedCount[n] = adj;
        adjustedTotal += adj;
        if (adj > 0) unique++;
      }

      self.postMessage({
        adjustedCount: Array.from(adjustedCount),
        adjustedTotal,
        unique,
        hitCounts: Array.from(hitCounts),
        rawCount: Array.from(rawCount)
      });
    } catch (err) {
      self.postMessage({ error: err.message || "Worker 分析失败" });
    }
  };
})();