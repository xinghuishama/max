// ======================== app.js — v4.0 UI 兼容版（霓虹粉主题） ========================
// 逻辑保持 v3.6 完整一致，只调整 DOM 结构以适配 v4.0 UI

(function () {
  "use strict";

  // ======================== 数据 ========================
  const DATA = window.APP_DATA || {};
  const MAX_NUMBERS = DATA.MAX_NUMBERS || 5000;
  const SHENGXIAO = DATA.SHENGXIAO || {};
  const numProps = DATA.numProps || [];

  // ======================== DOM 缓存 ========================
  const DOM = {
    numbers: document.getElementById("numbers"),
    result: document.getElementById("result"),
    charCount: document.getElementById("charCount"),
    numberWarn: document.getElementById("numberWarn"),
    exampleBtn: document.getElementById("exampleBtn"),
    clearBtn: document.getElementById("clearBtn"),
    copyResultBtn: document.getElementById("copyResultBtn"),
    toast: document.getElementById("toast")
  };

  // ======================== 状态 ========================
  let state = {
    killNums: [],
    selectedFilters: {
      shengxiao: [],
      haomatou: [],
      weishu: [],
      shuduan: [],
      bose: [],
      wuxing: [],
      bandanshuang: [],
      heshu: []
    }
  };

  let cachedMatchFuncs = null;
  let lastFilterSignature = "";
  let lastAnalysisResult = null;

  // ======================== 工具函数 ========================
  function showToast(msg) {
    const t = DOM.toast;
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateX(-50%) translateY(40px)";
    }, 1800);
  }

  // ======================== 输入解析 ========================
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

  // ======================== 条件编译器（与 v3.6 完全一致） ========================
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

    if (/^\d+合$/.test(cond)) {
      const numPart = cond.slice(0, -1);
      const sumVal = parseInt(numPart, 10);
      return n => numProps[n].sum === sumVal;
    }

    return () => false;
  }

  function getMatchFuncs(filters) {
    const sig = filters.join("\x00");
    if (cachedMatchFuncs && sig === lastFilterSignature) return cachedMatchFuncs;

    lastFilterSignature = sig;
    cachedMatchFuncs = filters.map(buildMatchFunc);
    return cachedMatchFuncs;
  }

  // ======================== 主线程分析（与 v3.6 完全一致） ========================
  function computeAnalysis(input, killNums, filters) {
    const { nums } = parseInputCount(input);

    const rawCount = new Uint16Array(50);
    for (let n of nums) rawCount[n]++;

    const funcs = getMatchFuncs(filters);
    const killSet = new Set(killNums);

    const hitCounts = new Uint8Array(50);

    for (let n = 1; n <= 49; n++) {
      let hit = killSet.has(n) ? 1 : 0;
      for (let fn of funcs) {
        if (fn(n)) hit++;
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

  // ======================== 渲染结果（v4.0 UI） ========================
  function renderResult() {
    const box = DOM.result;
    if (!box) return;

    const res = lastAnalysisResult;
    if (!res) {
      box.innerHTML = `<div class="empty">暂无数据</div>`;
      return;
    }

    const { adjustedCount, hitCounts } = res;

    let html = "";

    for (let n = 1; n <= 49; n++) {
      const adj = adjustedCount[n];
      const hit = hitCounts[n];

      let cls = "num-box";
      if (adj > 0) cls += " glow";
      if (hit > 0) cls += " hit";

      html += `
        <div class="${cls}">
          <div>${n}</div>
          <div style="opacity:0.7;font-size:11px">${adj}</div>
        </div>
      `;
    }

    box.innerHTML = html;
  }

  // ======================== 输入事件 ========================
  function bindEvents() {
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

  // ======================== 主运行 ========================
  function runAnalysis() {
    const input = DOM.numbers.value;
    const filters = Object.values(state.selectedFilters).flat();
    lastAnalysisResult = computeAnalysis(input, state.killNums, filters);
    renderResult();
  }

  function init() {
    bindEvents();
    runAnalysis();
  }

  document.addEventListener("DOMContentLoaded", init);
})();