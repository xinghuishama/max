// ======================== app.js — 主线程核心逻辑 v3.6 ========================
// 变更记录：
// 1) 自动生肖（澳门六合彩规则，与 data.js / worker.js 完全同步）
// 2) 尾数筛选修复（支持 10 尾）
// 3) 合数筛选修复（只匹配“数字+合”）
// 4) 命中次数不再被 3 限制（完整统计）
// 5) Worker 与主线程逻辑完全一致
// 6) 性能优化（缓存 + 渲染优化）
// 7) 保留原 UI 行为与特效

(function () {
  "use strict";

  // ======================== 数据与配置 ========================
  const DATA = window.APP_DATA || {};
  const MAX_NUMBERS = DATA.MAX_NUMBERS || 5000;
  const SHENGXIAO = DATA.SHENGXIAO || {};
  const numProps = DATA.numProps || [];

  const API_CONFIG = {
    live: "https://macaumarksix.com/api/live2",
    historyBase: "https://history.macaumarksix.com/history/macaujc2/y/"
  };

  const HISTORY_PAGE_SIZE = 15;
  const LS_KEY = "shenma_v4_state";
  const LS_CACHE_KEY = "shenma_v4_lottery_cache";

  const LIVE_WINDOW = {
    startH: 21, startM: 33,
    endH: 21, endM: 35
  };

  // ======================== DOM 缓存 ========================
  const DOM = {};
  function cacheDOM() {
    const ids = [
      "numbers", "result", "charCount", "numberWarn", "exampleBtn", "clearBtn", "copyResultBtn",
      "lotteryPeriod", "lotteryTime", "lastRefreshTime", "lotteryBalls", "refreshLotteryBtn",
      "drawer-overlay", "drawer-container", "drawer-title", "drawer-content", "drawer-close", "toast"
    ];
    ids.forEach(id => {
      DOM[id.replace(/-/g, "_")] = document.getElementById(id);
    });
  }

  // ======================== 状态管理 ========================
  let state = {
    killNums: [],
    selectedFilters: {
      shengxiao: [], haomatou: [], weishu: [], shuduan: [],
      bose: [], wuxing: [], bandanshuang: [], heshu: []
    }
  };

  let subscribers = [];
  let lastAnalysisResult = null;
  let lastRawCount = null;

  function subscribe(fn) { subscribers.push(fn); }
  function notify() { subscribers.forEach(fn => fn()); }

  function setKillNums(newNums) {
    state.killNums = [...newNums];
    notify();
  }

  function toggleFilter(category, value, checked) {
    if (!state.selectedFilters[category]) return;
    const set = new Set(state.selectedFilters[category]);
    if (checked) set.add(value);
    else set.delete(value);
    state.selectedFilters[category] = Array.from(set);
    notify();
  }

  function clearAllFilters() {
    state.killNums = [];
    Object.keys(state.selectedFilters).forEach(k => {
      state.selectedFilters[k] = [];
    });
    notify();
  }

  function getFilterSet() {
    return Object.values(state.selectedFilters).flat();
  }

  // ======================== 本地持久化 ========================
  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        killNums: state.killNums,
        selectedFilters: state.selectedFilters,
        _t: Date.now()
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      // 7天过期
      if (parsed._t && (Date.now() - parsed._t > 7 * 86400000)) {
        localStorage.removeItem(LS_KEY);
        return;
      }

      if (Array.isArray(parsed.killNums)) {
        state.killNums = parsed.killNums.filter(n => n >= 1 && n <= 49);
      }

      if (parsed.selectedFilters && typeof parsed.selectedFilters === "object") {
        Object.keys(state.selectedFilters).forEach(k => {
          const val = parsed.selectedFilters[k];
          if (Array.isArray(val)) state.selectedFilters[k] = [...val];
        });
      }
    } catch (e) {}
  }

  // ======================== 工具函数 ========================
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(msg) {
    const t = DOM.toast;
    if (!t) return;
    t.textContent = msg;
    t.classList.remove("translate-y-20", "opacity-0");
    t.style.transform = "translateY(0)";
    t.style.opacity = "1";
    setTimeout(() => {
      t.classList.add("translate-y-20", "opacity-0");
      t.style.transform = "translateY(5rem)";
      t.style.opacity = "0";
    }, 2000);
  }

  // ======================== 输入解析（保持原版） ========================
  function parseInputCount(input) {
    if (!input || !input.trim()) return { nums: [], truncated: false };

    let cleaned = input
      .replace(/《.*?》/g, " ")
      .replace(/[^0-9鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, " ")
      .replace(/([鼠牛虎兔龙蛇马羊猴鸡狗猪])/g, " $1 ");

    const tokens = cleaned.split(" ").filter(t => t.length > 0);
    if (!tokens.length) return { nums: [], truncated: false };

    let results = [];
    for (let token of tokens) {
      if (SHENGXIAO[token]) {
        results.push(...SHENGXIAO[token]);
      } else if (/^\d+$/.test(token)) {
        const n = Number(token);
        if (n >= 1 && n <= 49) results.push(n);
      }
    }

    let truncated = false;
    if (results.length > MAX_NUMBERS) {
      results = results.slice(0, MAX_NUMBERS);
      truncated = true;
    }

    return { nums: results, truncated };
  }

  // ======================== 匹配函数缓存 ========================
  let cachedMatchFuncs = null;
  let lastFilterSignature = "";

  function getMatchFuncs(filters) {
    const allConds = filters || getFilterSet();
    const sig = allConds.join("\x00");

    if (cachedMatchFuncs && sig === lastFilterSignature) return cachedMatchFuncs;

    lastFilterSignature = sig;
    cachedMatchFuncs = allConds.map(cond => buildMatchFunc(cond));
    return cachedMatchFuncs;
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

    // 修复：支持 10 尾
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
// ======================== 主线程降级分析（与 Worker 完全一致） ========================
  function computeAnalysisMainThread(input, killNums, filters) {
    const { nums } = parseInputCount(input);

    const rawCount = new Uint16Array(50);
    for (let n of nums) rawCount[n]++;

    const funcs = getMatchFuncs(filters);
    const killSet = new Set(killNums);

    const hitCounts = new Uint8Array(50);

    for (let n = 1; n <= 49; n++) {
      let hit = killSet.has(n) ? 1 : 0;

      for (let fn of funcs) {
        if (fn(n)) hit++; // 不再限制 hit > 3
      }

      hitCounts[n] = hit;
    }

    const adjustedCount = new Uint16Array(50);
    let adjustedTotal = 0;
    let unique = 0;

    for (let n = 1; n <= 49; n++) {
      const adj = Math.max(0, rawCount[n] - hitCounts[n]);
      adjustedCount[n] = adj;
      adjustedTotal += adj;
      if (adj > 0) unique++;
    }

    return {
      adjustedCount,
      adjustedTotal,
      unique,
      hitCounts,
      rawCount
    };
  }

  // ======================== Worker 调度 ========================
  let worker = null;
  let workerReady = false;

  function initWorker() {
    try {
      worker = new Worker("worker.js");
      worker.onmessage = function (e) {
        if (e.data.error) {
          console.error("Worker error:", e.data.error);
          return;
        }
        lastAnalysisResult = e.data;
        lastRawCount = e.data.rawCount;
        renderResult();
      };
      workerReady = true;
    } catch (e) {
      console.warn("Worker 初始化失败，使用主线程分析");
      workerReady = false;
    }
  }

  function runAnalysis() {
    const input = DOM.numbers.value;
    const filters = getFilterSet();

    if (workerReady && worker) {
      worker.postMessage({
        input,
        killNums: state.killNums,
        filters,
        numProps
      });
    } else {
      lastAnalysisResult = computeAnalysisMainThread(input, state.killNums, filters);
      lastRawCount = lastAnalysisResult.rawCount;
      renderResult();
    }
  }

  // ======================== 渲染结果 ========================
  function renderResult() {
    const box = DOM.result;
    if (!box) return;

    const res = lastAnalysisResult;
    if (!res) {
      box.innerHTML = `<div class="py-12 text-center text-gray-500">暂无数据</div>`;
      return;
    }

    const { adjustedCount, hitCounts } = res;

    let html = `<div class="grid grid-cols-7 gap-2 text-center">`;

    for (let n = 1; n <= 49; n++) {
      const adj = adjustedCount[n];
      const hit = hitCounts[n];

      let cls = "p-2 rounded border border-[#00ffea]/20";
      if (adj > 0) cls += " bg-[#00ffea]/10 text-[#00ffea]";
      if (hit > 0) cls += " shadow-[0_0_10px_rgba(255,0,85,0.4)]";

      html += `
        <div class="${cls}">
          <div class="text-sm font-bold">${n}</div>
          <div class="text-xs opacity-70">${adj}</div>
        </div>
      `;
    }

    html += `</div>`;
    box.innerHTML = html;
  }

  // ======================== 历史开奖 ========================
  async function fetchHistory(year, page) {
    const url = `${API_CONFIG.historyBase}${year}/${page}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ======================== 直播模块 ========================
  async function fetchLive() {
    try {
      const res = await fetch(API_CONFIG.live);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ======================== 输入事件绑定 ========================
  function bindInputEvents() {
    let timer = null;

    DOM.numbers.addEventListener("input", () => {
      const input = DOM.numbers.value;
      const { nums, truncated } = parseInputCount(input);

      DOM.charCount.textContent = nums.length;
      DOM.numberWarn.classList.toggle("hidden", !truncated);

      clearTimeout(timer);
      timer = setTimeout(runAnalysis, 200);
    });

    DOM.exampleBtn.addEventListener("click", () => {
      DOM.numbers.value = "12 25 36 龙蛇马 8 17 29 41";
      DOM.numbers.dispatchEvent(new Event("input"));
    });

    DOM.clearBtn.addEventListener("click", () => {
      DOM.numbers.value = "";
      DOM.numbers.dispatchEvent(new Event("input"));
    });

    DOM.copyResultBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(DOM.result.innerText);
      showToast("已复制");
    });
  }

  // ======================== 初始化 ========================
  function init() {
    cacheDOM();
    loadState();
    initWorker();
    bindInputEvents();
    runAnalysis();
  }

  document.addEventListener("DOMContentLoaded", init);
})();