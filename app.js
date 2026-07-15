// ======================== 配置 ========================
const APP_CONFIG = Object.freeze({
  MAX_NUMBERS: 5000,
  BALL_TOTAL: 49,
  ZODIAC_COUNT: 12,
  SPLASH_DURATION_MS: 3000,
  BASE_YEAR: 2024,
  HISTORY_PAGE_SIZE: 15,
  HISTORY_CACHE_MAX_AGE: 7 * 86400000,
  CACHE_MAX_YEARS: 3,
  HISTORY_MAX_ITEMS: 500,
  TOAST_DURATION_MS: 2000,
  DEBOUNCE_MS: 200,
  INPUT_SAVE_DEBOUNCE_MS: 1000,
  DRAW_WINDOW_CHECK_MS: 4000,
  DRAW_REGULAR_MS: 60000,
  DRAW_POLL_MS: 2000,
  ROLL_DURATION_MS: 900,
  ROLL_INTERVAL_MS: 60,
  BALL_STAGGER_MS: 80,
  FLY_PHASE1_MS: 2000,
  TRAIL_DURATION_MS: 500,
  JET_DURATION_MS: 600,
  BLACKHOLE_DURATION_MS: 4000,
  FADE_OUT_DELAY_MS: 800,
  API: {
    live: "https://macaumarksix.com/api/live2",
    historyBase: "https://history.macaumarksix.com/history/macaujc2/y/"
  },
  DRAW_WINDOW: {
    startH: 21, startM: 33, startS: 25,
    endH: 21, endM: 34, endS: 30
  },
  WUXING_BASE_SEQ: ['金','金','土','土','木','木','火','火','金','金','水','水','木','木','火','火','土','土','水','水','木','木','金','金','土','土','水','水','火','火'],
  ZODIAC_SEQUENCE: ["龍","蛇","馬","羊","猴","雞","狗","豬","鼠","牛","虎","兔"]
});

// ======================== data.js (不变) ========================
// 与 v3.7.12 相同，仅将数据放入 window.__SHARED_DATA__
(function () {
  "use strict";
  const CFG = APP_CONFIG;
  const BALL_TOTAL = CFG.BALL_TOTAL;
  const ZODIAC_COUNT = CFG.ZODIAC_COUNT;
  const ZODIAC_SEQUENCE = CFG.ZODIAC_SEQUENCE;
  const BASE_YEAR = CFG.BASE_YEAR;
  const WUXING_BASE_SEQ = CFG.WUXING_BASE_SEQ;

  function generateShengxiaoMap(year) {
    const taiSuiIdx = ((year - BASE_YEAR) % ZODIAC_COUNT + ZODIAC_COUNT) % ZODIAC_COUNT;
    const map = {};
    for (let i = 0; i < ZODIAC_COUNT; i++) {
      const offset = (taiSuiIdx - i + ZODIAC_COUNT) % ZODIAC_COUNT;
      const start = offset + 1;
      const nums = [];
      for (let k = 0; k < 5; k++) { const num = start + k * ZODIAC_COUNT; if (num <= BALL_TOTAL) nums.push(num); }
      map[ZODIAC_SEQUENCE[i]] = nums;
    }
    return map;
  }

  function generateWuxing(year) {
    const offset = year - 2023;
    const result = { '金':[],'木':[],'水':[],'火':[],'土':[] };
    for (let n = 1; n <= BALL_TOTAL; n++) {
      const wx = WUXING_BASE_SEQ[((n - 1) % 30 - offset + 30) % 30];
      result[wx].push(n);
    }
    return result;
  }

  function getNumberWuxing(num, year) {
    if (!Number.isInteger(num) || num < 1 || num > BALL_TOTAL) return "?";
    const idx = (num - 1) % 30;
    const offset = year - 2023;
    return WUXING_BASE_SEQ[(idx - offset + 30) % 30];
  }
  function getFive(num, year) { return getNumberWuxing(num, year); }

  const CURRENT_YEAR = (function() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const bjDate = new Date(utcMs + 8 * 3600000);
    return bjDate.getFullYear();
  })();

  const SHENGXIAO = generateShengxiaoMap(CURRENT_YEAR);
  const CATEGORIES = { "红波":[1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46], "蓝波":[3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48], "绿波":[5,6,11,16,17,21,22,27,28,32,33,38,39,43,44,49] };
  const DUAN = { "1段":[1,2,3,4,5,6,7],"2段":[8,9,10,11,12,13,14],"3段":[15,16,17,18,19,20,21],"4段":[22,23,24,25,26,27,28],"5段":[29,30,31,32,33,34,35],"6段":[36,37,38,39,40,41,42],"7段":[43,44,45,46,47,48,49] };
  const numProps = new Array(BALL_TOTAL + 1);
  const sxEntries = Object.entries(SHENGXIAO);
  const duanEntries = Object.entries(DUAN);
  for (let n = 1; n <= BALL_TOTAL; n++) {
    const head = Math.floor(n / 10), tail = n % 10, odd = n % 2 === 1 ? "单" : "双";
    const color = CATEGORIES.红波.includes(n) ? "red" : (CATEGORIES.蓝波.includes(n) ? "blue" : "green");
    const five = getNumberWuxing(n, CURRENT_YEAR);
    const sum = head + tail;
    const sumOdd = sum % 2 === 1 ? "合数单" : "合数双";
    let duan = "";
    for (let i = 0; i < duanEntries.length; i++) { if (duanEntries[i][1].includes(n)) { duan = duanEntries[i][0]; break; } }
    const halfOddEven = n > 24 ? (n % 2 === 1 ? "大单" : "大双") : (n % 2 === 1 ? "小单" : "小双");
    let shengXiao = "";
    for (let i = 0; i < sxEntries.length; i++) { if (sxEntries[i][1].includes(n)) { shengXiao = sxEntries[i][0]; break; } }
    numProps[n] = { head, tail, color, odd, five, sumOdd, duan, halfOddEven, shengXiao, sum };
  }

  window.__SHARED_DATA__ = {
    BALL_TOTAL, ZODIAC_COUNT, ZODIAC_SEQUENCE, BASE_YEAR,
    SHENGXIAO, CATEGORIES, DUAN, numProps,
    generateShengxiaoMap, generateWuxing, getNumberWuxing, getFive,
    WUXING_BASE_SEQ, CURRENT_YEAR
  };
})();

// ======================== app.js v3.7.13 (信号修复) ========================
(function () {
  "use strict";

  const CFG = APP_CONFIG;
  const SHARED = window.__SHARED_DATA__ || {};
  const BALL_TOTAL = SHARED.BALL_TOTAL || CFG.BALL_TOTAL;
  const MAX_NUMBERS = CFG.MAX_NUMBERS;
  const HISTORY_PAGE_SIZE = CFG.HISTORY_PAGE_SIZE;
  const LS_KEY = "shenma_v4_state";
  const LS_CACHE_KEY = "shenma_v4_lottery_cache";
  const LS_HISTORY_KEY = "shenma_v4_history_cache";
  const LS_INPUT_KEY = "shenma_v4_input";
  const HISTORY_CACHE_MAX_AGE = CFG.HISTORY_CACHE_MAX_AGE;
  const CACHE_MAX_YEARS = CFG.CACHE_MAX_YEARS;
  const HISTORY_MAX_ITEMS = CFG.HISTORY_MAX_ITEMS;
  const TOAST_DURATION_MS = CFG.TOAST_DURATION_MS;
  const DEBOUNCE_MS = CFG.DEBOUNCE_MS;
  const INPUT_SAVE_DEBOUNCE_MS = CFG.INPUT_SAVE_DEBOUNCE_MS;
  const DRAW_WINDOW_CHECK_MS = CFG.DRAW_WINDOW_CHECK_MS;
  const DRAW_REGULAR_MS = CFG.DRAW_REGULAR_MS;
  const DRAW_POLL_MS = CFG.DRAW_POLL_MS;
  const ROLL_DURATION_MS = CFG.ROLL_DURATION_MS;
  const ROLL_INTERVAL_MS = CFG.ROLL_INTERVAL_MS;
  const BALL_STAGGER_MS = CFG.BALL_STAGGER_MS;
  const FLY_PHASE1_MS = CFG.FLY_PHASE1_MS;
  const TRAIL_DURATION_MS = CFG.TRAIL_DURATION_MS;
  const JET_DURATION_MS = CFG.JET_DURATION_MS;
  const BLACKHOLE_DURATION_MS = CFG.BLACKHOLE_DURATION_MS;
  const FADE_OUT_DELAY_MS = CFG.FADE_OUT_DELAY_MS;
  const API_CONFIG = CFG.API;
  const DRAW_CONFIG = {
    startH: CFG.DRAW_WINDOW.startH,
    startM: CFG.DRAW_WINDOW.startM,
    startS: CFG.DRAW_WINDOW.startS,
    endH: CFG.DRAW_WINDOW.endH,
    endM: CFG.DRAW_WINDOW.endM,
    endS: CFG.DRAW_WINDOW.endS,
    pollMs: DRAW_POLL_MS,
    regularMs: DRAW_REGULAR_MS
  };

  const SCHEMA_VERSION = 1;
  const SHENGXIAO = SHARED.SHENGXIAO || {};
  const numProps = SHARED.numProps || [];
  const RED_SET = new Set(SHARED.CATEGORIES ? SHARED.CATEGORIES.红波 : []);
  const BLUE_SET = new Set(SHARED.CATEGORIES ? SHARED.CATEGORIES.蓝波 : []);
  const getNumberWuxing = SHARED.getNumberWuxing || function () { return "?"; };
  const getFive = SHARED.getFive || getNumberWuxing;
  const generateWuxingTable = SHARED.generateWuxing || function () { return { "金":[],"木":[],"水":[],"火":[],"土":[] }; };
  const generateShengxiaoMap = SHARED.generateShengxiaoMap || function() { return {}; };
  const CURRENT_YEAR = SHARED.CURRENT_YEAR || 2024;

  if (typeof Promise === 'undefined' || typeof fetch === 'undefined') {
    document.body.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#f87171;font-family:sans-serif;"><h2>浏览器版本过低</h2><p>请使用现代浏览器</p></div>';
    throw new Error('Browser not supported');
  }
  window.requestAnimationFrame = window.requestAnimationFrame || function(cb) { return setTimeout(cb, 16); };
  window.cancelAnimationFrame = window.cancelAnimationFrame || function(id) { clearTimeout(id); };

  // ===== 工具 =====
  function safeSetItem(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('shenma_') && k !== key) localStorage.removeItem(k);
          }
          localStorage.setItem(key, value);
          return true;
        } catch (retryErr) {}
      }
      return false;
    }
  }

  // ===== 修复 Critical: fetchWithTimeout 合并外部 signal =====
  function fetchWithTimeout(url, options = {}, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, timeout);

    // 合并外部 signal（如果存在）
    let signal = controller.signal;
    if (options.signal) {
      // 优先使用 AbortSignal.any（现代浏览器）
      if (typeof AbortSignal !== 'undefined' && AbortSignal.any) {
        try {
          signal = AbortSignal.any([controller.signal, options.signal]);
        } catch (_) {
          // 降级：监听外部 signal 的 abort 事件
          options.signal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      } else {
        // 旧浏览器降级
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    return fetch(url, { ...options, signal }).finally(() => clearTimeout(timeoutId));
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\//g, "&#x2F;");
  }

  function showToast(msg, isError) {
    const t = DOM.toast;
    if (!t) return;
    t.textContent = msg;
    t.style.borderColor = isError ? '#ff0055' : 'rgba(0,255,234,0.3)';
    t.style.color = isError ? '#ff0055' : '#00ffea';
    t.classList.remove("translate-y-20", "opacity-0");
    t.style.transform = "translate(-50%, 0)";
    t.style.opacity = "1";
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => {
      t.classList.add("translate-y-20", "opacity-0");
      t.style.transform = "translate(-50%, 5rem)";
      t.style.opacity = "0";
      t.style.borderColor = 'rgba(0,255,234,0.3)';
      t.style.color = '#00ffea';
    }, TOAST_DURATION_MS);
  }

  const DOM = {};
  function cacheDOM() {
    const ids = ["numbers","result","charCount","numberWarn","exampleBtn","clearBtn","copyResultBtn","lotteryPeriod","lotteryTime","lastRefreshTime","lotteryBalls","refreshLotteryBtn","drawer-overlay","drawer-container","drawer-title","drawer-content","drawer-close","toast"];
    ids.forEach(id => { DOM[id.replace(/-/g, "_")] = document.getElementById(id); });
    if (!DOM.drawer_content) DOM.drawer_content = document.getElementById("drawer-content");
    if (!DOM.drawer_container) DOM.drawer_container = document.getElementById("drawer-container");
    if (!DOM.drawer_overlay) DOM.drawer_overlay = document.getElementById("drawer-overlay");
    if (!DOM.drawer_title) DOM.drawer_title = document.getElementById("drawer-title");
    if (!DOM.drawer_close) DOM.drawer_close = document.getElementById("drawer-close");
  }

  // ===== 时间同步 =====
  let timeOffset = 0;
  let timeSyncFailed = false;

  function getBeijingDate() {
    const ts = Date.now() + timeOffset;
    const d = new Date(ts);
    const utcMs = ts + d.getTimezoneOffset() * 60000;
    return new Date(utcMs + 8 * 3600000);
  }

  function isInDrawWindow() {
    const now = getBeijingDate();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const startSec = DRAW_CONFIG.startH * 3600 + DRAW_CONFIG.startM * 60 + DRAW_CONFIG.startS;
    const endSec = DRAW_CONFIG.endH * 3600 + DRAW_CONFIG.endM * 60 + DRAW_CONFIG.endS;
    const nowSec = h * 3600 + m * 60 + s;
    return nowSec >= startSec && nowSec <= endSec;
  }

  function getNextDrawTime() {
    const now = getBeijingDate();
    const draw = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 33, 30);
    if (now >= draw) draw.setDate(draw.getDate() + 1);
    return draw;
  }

  async function syncTime() {
    timeSyncFailed = false;
    const sources = [
      async () => {
        const res = await fetchWithTimeout('https://vv.video.qq.com/checktime?otype=json', {}, 5000);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        const json = JSON.parse(text.replace(/^QZOutputJson=/, '').replace(/;?$/, ''));
        if (json && typeof json.t === 'number') {
          timeOffset = json.t * 1000 - Date.now();
          return;
        }
        throw new Error('Invalid response');
      },
      async () => {
        const res = await fetchWithTimeout('https://time.akamai.com/?iso', {}, 5000);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const iso = await res.text();
        const serverDate = new Date(iso);
        if (!isNaN(serverDate)) {
          timeOffset = serverDate.getTime() - Date.now();
          return;
        }
        throw new Error('Invalid date');
      },
      async () => {
        const res = await fetchWithTimeout('https://macaumarksix.com/api/live2', {}, 5000);
        const dateHeader = res.headers.get('date');
        if (dateHeader) {
          const serverDate = new Date(dateHeader);
          if (!isNaN(serverDate)) {
            timeOffset = serverDate.getTime() - Date.now();
            return;
          }
        }
        throw new Error('No date header');
      }
    ];
    for (const src of sources) {
      try { await src(); return; }
      catch (e) { console.warn('时间同步源失败', e); }
    }
    timeOffset = 0;
    timeSyncFailed = true;
    showToast("⚠️ 时间同步失败，使用本地时间", true);
  }

  // ===== 状态（闭包封装） =====
  let state = {
    killNums: [],
    selectedFilters: { shengxiao:[], haomatou:[], weishu:[], shuduan:[], bose:[], wuxing:[], bandanshuang:[], heshu:[] }
  };
  let subscribers = [], lastAnalysisResult = null, lastRawCount = null;
  let historyCache = {}, historyYearLoaded = null;
  let currentHistoryData = [], currentHistorySorted = [], currentHistoryPage = 1;
  let lastLotteryPeriod = "", isCurrentDrawComplete = false, isFetchingLottery = false;
  let fetchSeq = 0;
  let currentFetchController = null;
  let countdownTimer = null, autoRefreshTimer = null, regularPollTimer = null;
  let inDrawWindowFlag = false, lastDrawFetchTime = 0, lastRegularFetchTime = 0;
  let _rollTimer = null;
  let activeFlyAnim = null;
  let currentUniqueElement = null, lastUniqueNum = null;
  let truncToastShown = false;
  let debounceTimer = null;
  let inputSaveTimer = null;
  let cachedMatchFuncs = null, lastFilterSignature = "";
  let historyAbortController = null;
  let isAppReady = false;
  let freqAdjEnabled = true;

  function setFreqAdjEnabled(val) { freqAdjEnabled = val; runAnalysis(); }
  function getFreqAdjEnabled() { return freqAdjEnabled; }

  function subscribe(fn) { subscribers.push(fn); }
  function notify() { subscribers.forEach(fn => fn()); }
  function setKillNums(newNums) { state.killNums = [...newNums]; notify(); }
  function toggleFilter(category, value, checked) {
    if (!state.selectedFilters[category]) return;
    const set = new Set(state.selectedFilters[category]);
    if (checked) set.add(value); else set.delete(value);
    state.selectedFilters[category] = Array.from(set);
    notify();
  }
  function clearAllFilters() {
    state.killNums = [];
    Object.keys(state.selectedFilters).forEach(k => { state.selectedFilters[k] = []; });
    notify();
  }
  function getFilterSet() {
    const result = [];
    for (const key of Object.keys(state.selectedFilters)) {
      for (const val of state.selectedFilters[key]) result.push(val);
    }
    return result;
  }

  function saveState() {
    try {
      safeSetItem(LS_KEY, JSON.stringify({
        killNums: state.killNums,
        selectedFilters: state.selectedFilters,
        _t: Date.now(),
        _v: SCHEMA_VERSION
      }));
    } catch(e) { console.warn("saveState failed", e); }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (parsed._v !== undefined && parsed._v !== SCHEMA_VERSION) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      if (parsed._t && (Date.now() - parsed._t > 7 * 86400000)) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      if (Array.isArray(parsed.killNums)) {
        state.killNums = parsed.killNums.filter(n => Number.isInteger(n) && n >= 1 && n <= BALL_TOTAL);
      }
      if (parsed.selectedFilters && typeof parsed.selectedFilters === "object") {
        Object.keys(state.selectedFilters).forEach(k => {
          if (Array.isArray(parsed.selectedFilters[k])) {
            state.selectedFilters[k] = Array.from(parsed.selectedFilters[k]);
          }
        });
      }
    } catch(e) {
      console.warn("loadState failed:", e);
      showToast("⚠️ 加载状态失败，使用默认设置", true);
    }
  }

  // 修复 P2 #13: 裁剪方向修正，保留最新数据
  function pruneHistoryCache() {
    const currentYear = getBeijingDate().getFullYear();
    const years = Object.keys(historyCache).map(Number);
    const validYears = years.filter(y => y >= currentYear - CACHE_MAX_YEARS);
    for (const y of years) { if (!validYears.includes(y)) delete historyCache[y]; }

    // 限制总条目数，并确保保留最新数据（假设数据已按期号降序排列）
    let totalItems = 0;
    for (const year of Object.keys(historyCache)) {
      totalItems += historyCache[year] ? historyCache[year].length : 0;
    }
    if (totalItems > HISTORY_MAX_ITEMS) {
      // 按年份从新到旧排序
      const sortedYears = Object.keys(historyCache).sort((a, b) => Number(b) - Number(a));
      let toRemove = totalItems - HISTORY_MAX_ITEMS;
      for (const year of sortedYears) {
        if (toRemove <= 0) break;
        const items = historyCache[year];
        if (items && items.length > 0) {
          // 删除前段（旧数据），保留后段（最新数据）
          const removeCount = Math.min(items.length, toRemove);
          historyCache[year] = items.slice(removeCount); // 删除前 removeCount 个
          toRemove -= removeCount;
          if (historyCache[year].length === 0) delete historyCache[year];
        }
      }
    }
  }

  function saveHistoryCache() {
    try {
      pruneHistoryCache();
      const keys = Object.keys(historyCache);
      if (keys.length === 0) return;
      const toSave = {};
      for (const k of keys) {
        if (historyCache[k] && historyCache[k].length > 0) toSave[k] = historyCache[k];
      }
      safeSetItem(LS_HISTORY_KEY, JSON.stringify({
        cache: toSave,
        lastYear: historyYearLoaded || "",
        _t: Date.now(),
        _v: SCHEMA_VERSION
      }));
    } catch(e) { console.warn("saveHistoryCache failed", e); }
  }

  function loadHistoryCache() {
    try {
      const raw = localStorage.getItem(LS_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.cache || typeof parsed.cache !== "object") return;
      if (parsed._v !== undefined && parsed._v !== SCHEMA_VERSION) {
        localStorage.removeItem(LS_HISTORY_KEY);
        return;
      }
      if (parsed._t && (Date.now() - parsed._t > HISTORY_CACHE_MAX_AGE)) {
        localStorage.removeItem(LS_HISTORY_KEY);
        return;
      }
      for (const year of Object.keys(parsed.cache)) {
        if (Array.isArray(parsed.cache[year]) && parsed.cache[year].length > 0) {
          historyCache[year] = parsed.cache[year];
        }
      }
      if (parsed.lastYear) historyYearLoaded = parsed.lastYear;
      pruneHistoryCache();
    } catch(e) {
      console.warn("loadHistoryCache failed:", e);
      showToast("⚠️ 加载历史缓存失败", true);
    }
  }

  function saveInputCacheDelayed() {
    clearTimeout(inputSaveTimer);
    inputSaveTimer = setTimeout(() => {
      try {
        const val = DOM.numbers ? DOM.numbers.value : "";
        if (val && val.trim()) {
          safeSetItem(LS_INPUT_KEY, JSON.stringify({ value: val, _t: Date.now(), _v: SCHEMA_VERSION }));
        } else {
          localStorage.removeItem(LS_INPUT_KEY);
        }
      } catch(e) { /* 静默 */ }
    }, INPUT_SAVE_DEBOUNCE_MS);
  }

  function loadInputCache() {
    try {
      const raw = localStorage.getItem(LS_INPUT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.value) return;
      if (parsed._v !== undefined && parsed._v !== SCHEMA_VERSION) {
        localStorage.removeItem(LS_INPUT_KEY);
        return;
      }
      if (parsed._t && (Date.now() - parsed._t > 7 * 86400000)) {
        localStorage.removeItem(LS_INPUT_KEY);
        return;
      }
      if (DOM.numbers) {
        DOM.numbers.value = parsed.value;
        setTimeout(() => runAnalysis(), 50);
      }
    } catch(e) { /* 静默 */ }
  }

// ===== 核心分析函数 =====
  function normalizeZodiac(str) {
    const map = { '龙': '龍', '马': '馬', '鸡': '雞', '猪': '豬' };
    let result = '';
    for (let i = 0; i < str.length; i++) result += map[str[i]] || str[i];
    return result;
  }

  function parseInputCount(input) {
    if (!input || !input.trim()) return { nums: [], truncated: false };
    const cleaned = input.replace(/《[^》]*》/g, " ")
      .replace(/[^\d鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪\s]/g, " ")
      .replace(/([鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪])/g, " $1 ");
    const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
    let results = [];
    for (const token of tokens) {
      const normalizedToken = normalizeZodiac(token);
      const sxNums = SHENGXIAO[normalizedToken];
      if (sxNums && sxNums.length) {
        for (let j = 0; j < sxNums.length; j++) results.push(sxNums[j]);
      } else if (/^\d+$/.test(token)) {
        const n = Number(token);
        if (Number.isInteger(n) && n >= 1 && n <= BALL_TOTAL) results.push(n);
      }
    }
    let truncated = false;
    if (results.length > MAX_NUMBERS) {
      results = results.slice(0, MAX_NUMBERS);
      truncated = true;
    }
    return { nums: results, truncated: truncated };
  }

  function buildMatchFunc(cond) {
    if (cond.startsWith("生肖")) {
      const sx = cond.slice(2);
      return n => numProps[n] && numProps[n].shengXiao === sx;
    }
    if (cond.endsWith("头单") || cond.endsWith("头双")) {
      const parts = cond.split("头");
      const headVal = parseInt(parts[0], 10);
      const oe = parts[1];
      return n => numProps[n] && numProps[n].head === headVal && numProps[n].odd === oe;
    }
    if (cond.endsWith("尾")) {
      const tailVal = parseInt(cond[0], 10);
      return n => numProps[n] && numProps[n].tail === tailVal;
    }
    if (cond.endsWith("段")) {
      return n => numProps[n] && numProps[n].duan === cond;
    }
    if (cond.endsWith("波单") || cond.endsWith("波双")) {
      const parts = cond.split("波");
      const c = parts[0]; const oe = parts[1];
      const colorMap = { "红": "red", "蓝": "blue", "绿": "green" };
      return n => numProps[n] && numProps[n].color === colorMap[c] && numProps[n].odd === oe;
    }
    if (["金","木","水","火","土"].includes(cond)) {
      return n => getFive(n, CURRENT_YEAR) === cond;
    }
    if (["合数单","合数双","大单","大双","小单","小双"].includes(cond)) {
      if (cond === "合数单") return n => numProps[n] && numProps[n].sumOdd === "合数单";
      if (cond === "合数双") return n => numProps[n] && numProps[n].sumOdd === "合数双";
      return n => numProps[n] && numProps[n].halfOddEven === cond;
    }
    if (cond.endsWith("合")) {
      const sumVal = parseInt(cond, 10);
      return n => numProps[n] && numProps[n].sum === sumVal;
    }
    return () => false;
  }

  function getMatchFuncs(filters) {
    const allConds = filters || getFilterSet();
    const sig = allConds.slice().sort().join('\x00');
    if (cachedMatchFuncs && sig === lastFilterSignature) return cachedMatchFuncs;
    lastFilterSignature = sig;
    cachedMatchFuncs = allConds.map(cond => buildMatchFunc(cond));
    return cachedMatchFuncs;
  }

  function computeAnalysisMainThread(input, killNums, filters) {
    const nums = parseInputCount(input).nums;
    const rawCount = new Uint16Array(BALL_TOTAL + 1);
    for (let i = 0; i < nums.length; i++) {
      const n = nums[i];
      if (n >= 1 && n <= BALL_TOTAL) rawCount[n]++;
    }
    const killSet = new Set(killNums);
    const funcs = getMatchFuncs(filters);
    const hitCounts = new Uint8Array(BALL_TOTAL + 1);
    for (let n = 1; n <= BALL_TOTAL; n++) {
      let hit = killSet.has(n) ? 1 : 0;
      for (let i = 0; i < funcs.length; i++) {
        if (funcs[i](n)) { hit++; if (hit > 6) break; }
      }
      hitCounts[n] = hit;
    }
    const freqAdj = getFreqAdjEnabled();
    const adjustedCount = new Uint16Array(BALL_TOTAL + 1);
    let adjustedTotal = 0, unique = 0;
    for (let n = 1; n <= BALL_TOTAL; n++) {
      const adj = freqAdj ? Math.max(0, rawCount[n] - hitCounts[n]) : rawCount[n];
      adjustedCount[n] = adj;
      adjustedTotal += adj;
      if (adj > 0) unique++;
    }
    return {
      adjustedCount: Array.from(adjustedCount),
      adjustedTotal,
      unique,
      hitCounts: Array.from(hitCounts),
      rawCount: Array.from(rawCount)
    };
  }

  function runAnalysis() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const input = DOM.numbers ? DOM.numbers.value : "";
        const parsed = parseInputCount(input);
        if (DOM.charCount) DOM.charCount.textContent = parsed.nums.length;
        if (DOM.numberWarn) {
          if (parsed.truncated) {
            DOM.numberWarn.classList.remove("hidden");
            if (!truncToastShown) {
              showToast("⚠️ 输入号码超过" + MAX_NUMBERS + "个，已截断", true);
              truncToastShown = true;
              setTimeout(() => { truncToastShown = false; }, 2000);
            }
          } else {
            DOM.numberWarn.classList.add("hidden");
          }
        }
        const res = computeAnalysisMainThread(input, state.killNums, getFilterSet());
        lastRawCount = res.rawCount;
        renderResult(res.adjustedCount, res.adjustedTotal, res.unique, res.hitCounts, res.rawCount);
        saveInputCacheDelayed();
      } catch(err) {
        console.error("runAnalysis error:", err);
        showToast("⚠️ 分析出错，请检查输入", true);
      }
    }, DEBOUNCE_MS);
  }

  function onStateChange() { runAnalysis(); saveState(); }

  // ===== 渲染结果 =====
  function getBallColor(n) {
    if (numProps[n] && numProps[n].color) return numProps[n].color;
    if (RED_SET.has(n)) return "red";
    if (BLUE_SET.has(n)) return "blue";
    return "green";
  }
  const COLOR_CLASS_MAP = { red: "ball-red", green: "ball-green", blue: "ball-blue" };
  function getColorClass(color, isGray) {
    return isGray ? "ball-gray" : (COLOR_CLASS_MAP[color] || "ball-blue");
  }

  function cleanupFlyEffects() {
    if (activeFlyAnim) { cancelAnimationFrame(activeFlyAnim); activeFlyAnim = null; }
    document.querySelectorAll(".flying-unique-ball, .blackhole, .accretion-disk, .particle-stream, .jet-stream").forEach(el => el.remove());
  }

  function launchUniqueFlyEffect(targetNum, colorClass) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const targetEl = DOM.result ? DOM.result.querySelector('[data-num="' + targetNum + '"]') : null;
      if (targetEl) { targetEl.classList.add("flash-unique"); setTimeout(() => targetEl.classList.remove("flash-unique"), 1000); }
      return;
    }
    cleanupFlyEffects();
    const targetEl = DOM.result ? DOM.result.querySelector('[data-num="' + targetNum + '"]') : null;
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.35;
    const color = colorClass === "ball-red" ? "#ff3366" : colorClass === "ball-green" ? "#33cc66" : "#3366ff";
    const darkColor = colorClass === "ball-red" ? "#660022" : colorClass === "ball-green" ? "#004422" : "#002266";

    const disk = document.createElement("div");
    disk.className = "accretion-disk";
    disk.style.cssText = "position:fixed;left:" + centerX + "px;top:" + centerY + "px;width:0;height:0;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);";
    document.body.appendChild(disk);
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement("div");
      ring.style.cssText = "position:absolute;left:50%;top:50%;width:0;height:0;border:2px solid " + color + ";border-radius:50%;transform:translate(-50%,-50%);opacity:0.6;border-top-color:transparent;border-bottom-color:transparent;";
      disk.appendChild(ring);
      ring.animate([
        { width: '0px', height: '0px', transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 0 },
        { width: (100 + i * 40) + 'px', height: (100 + i * 40) + 'px', transform: 'translate(-50%,-50%) rotate(' + (i % 2 === 0 ? 180 : -180) + 'deg)', opacity: 0.6, offset: 0.5 },
        { width: (80 + i * 30) + 'px', height: (80 + i * 30) + 'px', transform: 'translate(-50%,-50%) rotate(' + (i % 2 === 0 ? 360 : -360) + 'deg)', opacity: 0.3 }
      ], { duration: 3000, delay: i * 200, easing: 'ease-in-out' }).onfinish = () => ring.remove();
    }

    const blackhole = document.createElement("div");
    blackhole.className = "blackhole";
    blackhole.style.cssText = "position:fixed;left:" + centerX + "px;top:" + centerY + "px;width:0;height:0;background:radial-gradient(circle,#000 20%," + darkColor + " 50%," + color + " 70%,transparent 100%);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;box-shadow:0 0 60px " + color + ", inset 0 0 40px " + color + ";";
    document.body.appendChild(blackhole);
    blackhole.animate([
      { width: '0px', height: '0px', opacity: 0 },
      { width: '80px', height: '80px', opacity: 1, offset: 0.2 },
      { width: '100px', height: '100px', opacity: 0.9, offset: 0.5 },
      { width: '80px', height: '80px', opacity: 0.9, offset: 0.7 },
      { width: '0px', height: '0px', opacity: 0 }
    ], { duration: BLACKHOLE_DURATION_MS, easing: 'ease-in-out' }).onfinish = () => { blackhole.remove(); disk.remove(); };

    const ball = document.createElement("div");
    ball.className = "flying-unique-ball " + colorClass;
    ball.textContent = String(targetNum).padStart(2, "0");
    ball.style.cssText = "position:fixed;left:" + endX + "px;top:" + endY + "px;transform:translate(-50%,-50%) scale(1);z-index:10000;";
    document.body.appendChild(ball);

    const startTime = performance.now();
    let phase2Start;
    const phase1Duration = FLY_PHASE1_MS;
    const phase2Duration = 1600;

    function phase1(now) {
      const progress = Math.min((now - startTime) / phase1Duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const currentX = endX + (centerX - endX) * ease;
      const currentY = endY + (centerY - endY) * ease;
      const scale = 1 - ease * 0.9;
      const rotate = ease * 1080;
      ball.style.left = currentX + "px";
      ball.style.top = currentY + "px";
      ball.style.transform = "translate(-50%,-50%) scale(" + scale + ") rotate(" + rotate + "deg)";
      if (progress < 1 && Math.random() > 0.5) {
        const trail = document.createElement("div");
        trail.className = "particle-stream";
        trail.style.cssText = "position:fixed;left:" + currentX + "px;top:" + currentY + "px;width:4px;height:4px;background:" + color + ";border-radius:50%;pointer-events:none;z-index:9997;opacity:0.6;";
        document.body.appendChild(trail);
        trail.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.6 },
          { transform: 'translate(-50%,-50%) scale(0)', opacity: 0 }
        ], { duration: TRAIL_DURATION_MS }).onfinish = () => trail.remove();
      }
      if (progress < 1) {
        activeFlyAnim = requestAnimationFrame(phase1);
      } else {
        ball.style.transform = "translate(-50%,-50%) scale(0)";
        ball.style.opacity = 0;
        setTimeout(() => { phase2Start = performance.now(); activeFlyAnim = requestAnimationFrame(phase2); }, 400);
      }
    }

    function phase2(now) {
      const progress = Math.min((now - phase2Start) / phase2Duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const currentX = centerX + (endX - centerX) * ease;
      const currentY = centerY + (endY - centerY) * ease;
      const scale = 0.1 + ease * 0.9;
      const rotate = -1080 * (1 - ease);
      ball.style.left = currentX + "px";
      ball.style.top = currentY + "px";
      ball.style.transform = "translate(-50%,-50%) scale(" + scale + ") rotate(" + rotate + "deg)";
      ball.style.opacity = Math.min(1, ease * 2);
      if (progress < 0.5 && Math.random() > 0.5) {
        const jet = document.createElement("div");
        jet.className = "jet-stream";
        jet.style.cssText = "position:fixed;left:" + currentX + "px;top:" + currentY + "px;width:3px;height:3px;background:" + color + ";border-radius:50%;pointer-events:none;z-index:9997;box-shadow:0 0 6px " + color + ";";
        document.body.appendChild(jet);
        const jetAngle = Math.random() * Math.PI * 2;
        const jetDist = 30 + Math.random() * 50;
        jet.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: 'translate(' + (Math.cos(jetAngle)*jetDist) + 'px,' + (Math.sin(jetAngle)*jetDist) + 'px) scale(0)', opacity: 0 }
        ], { duration: JET_DURATION_MS }).onfinish = () => jet.remove();
      }
      if (progress < 1) {
        activeFlyAnim = requestAnimationFrame(phase2);
      } else {
        activeFlyAnim = null;
        ball.remove();
        targetEl.classList.add("landing-shock", "flash-unique");
        setTimeout(() => targetEl.classList.remove("landing-shock"), 400);
        showToast("🌌 黑洞吞噬：" + String(targetNum).padStart(2, "0") + " 号");
      }
    }
    activeFlyAnim = requestAnimationFrame(phase1);
  }

  function renderResult(adjustedCount, adjustedTotal, unique, hitCounts, rawCount) {
    try {
      const container = DOM.result;
      if (!container) return;
      if (currentUniqueElement) { currentUniqueElement.classList.remove("flash-unique"); currentUniqueElement = null; }
      const freqMap = new Map();
      for (let n = 1; n <= BALL_TOTAL; n++) {
        const f = adjustedCount[n];
        if (f > 0) { if (!freqMap.has(f)) freqMap.set(f, []); freqMap.get(f).push(n); }
      }
      const freqs = Array.from(freqMap.keys()).sort((a, b) => b - a);
      let killDrawn = false;
      const avgThreshold = unique > 0 ? adjustedTotal / unique : 0;
      const unhitNumbers = [];
      for (let n = 1; n <= BALL_TOTAL; n++) {
        if (adjustedCount[n] > 0 && hitCounts[n] === 0) unhitNumbers.push(n);
      }
      const isUniqueUnhit = (unhitNumbers.length === 1);
      const uniqueUnhitNum = isUniqueUnhit ? unhitNumbers[0] : null;
      const killSet = new Set(state.killNums);
      const sortedFreqMap = new Map();

      const fragment = document.createDocumentFragment();

      for (const f of freqs) {
        if (!killDrawn && f <= avgThreshold) {
          const killLine = document.createElement('div');
          killLine.className = "kill-line";
          fragment.appendChild(killLine);
          killDrawn = true;
        }
        const row = document.createElement('div');
        row.className = "flex items-start gap-1 mb-1 flex-wrap";
        const label = document.createElement('span');
        label.className = "text-xs text-emerald-400 font-mono min-w-[30px] pt-2";
        label.textContent = String(f).padStart(2, "0") + "次：";
        row.appendChild(label);
        const ballsWrap = document.createElement('div');
        ballsWrap.className = "flex flex-wrap gap-1 flex-1";
        const nums = freqMap.get(f).sort((a, b) => a - b);
        sortedFreqMap.set(f, nums.slice());
        for (const n of nums) {
          const hit = hitCounts[n] || 0;
          const isGray = hit > 0;
          const color = numProps[n] ? numProps[n].color : getBallColor(n);
          const baseColorClass = getColorClass(color, isGray);
          const isTarget = n === uniqueUnhitNum;
          const flashClass = isTarget ? "flash-unique" : "";
          const btn = document.createElement('button');
          btn.className = ("ball-3d " + baseColorClass + " " + flashClass).trim();
          btn.dataset.num = n;
          btn.textContent = String(n).padStart(2, "0");
          if (killSet.has(n)) {
            const mark = document.createElement('span');
            mark.className = "hit-mark cross";
            mark.textContent = "✘";
            btn.appendChild(mark);
          } else if (hit > 0) {
            const mark = document.createElement('span');
            mark.className = "hit-mark";
            mark.textContent = hit;
            btn.appendChild(mark);
          }
          ballsWrap.appendChild(btn);
        }
        row.appendChild(ballsWrap);
        fragment.appendChild(row);
      }

      if (!killDrawn && freqs.length > 0) {
        const killLine = document.createElement('div');
        killLine.className = "kill-line";
        fragment.appendChild(killLine);
      }

      if (unique === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = "text-center py-8 text-amber-400";
        emptyDiv.textContent = "⚡ 所有号码频次归零，请调整筛选条件 ⚡";
        fragment.appendChild(emptyDiv);
      }

      const zeroCountNumbers = [];
      if (rawCount && rawCount.length) {
        for (let n = 1; n <= BALL_TOTAL; n++) {
          if (rawCount[n] === 0) zeroCountNumbers.push(n);
        }
        if (zeroCountNumbers.length > 0) {
          const row = document.createElement('div');
          row.className = "flex items-start gap-1 mb-2 flex-wrap";
          const label = document.createElement('span');
          label.className = "text-xs text-gray-500 font-mono min-w-[30px] pt-2";
          label.textContent = "00次：";
          row.appendChild(label);
          const ballsWrap = document.createElement('div');
          ballsWrap.className = "flex flex-wrap gap-1 flex-1";
          for (const n of zeroCountNumbers) {
            const color = numProps[n] ? numProps[n].color : getBallColor(n);
            const colorClass = getColorClass(color, false);
            const btn = document.createElement('button');
            btn.className = "ball-3d " + colorClass;
            btn.dataset.num = n;
            btn.textContent = String(n).padStart(2, "0");
            ballsWrap.appendChild(btn);
          }
          row.appendChild(ballsWrap);
          fragment.appendChild(row);
        }
      }

      const freqAdj = getFreqAdjEnabled();
      const totalLabel = freqAdj ? "调整后总次数" : "总次数";
      const avgLabel = freqAdj ? "调整后平均次数" : "平均次数";
      const statsDiv = document.createElement('div');
      statsDiv.className = "mt-4 grid grid-cols-3 gap-2 p-3 bg-transparent rounded-lg border border-[#00ffea]/20";
      const statItems = [
        { val: unique, label: "有效数字个数" },
        { val: adjustedTotal, label: totalLabel },
        { val: (unique > 0 ? (adjustedTotal / unique).toFixed(2) : "0.00"), label: avgLabel }
      ];
      for (const item of statItems) {
        const cell = document.createElement('div');
        cell.className = "text-center";
        const valDiv = document.createElement('div');
        valDiv.className = "text-[#00ffea] font-bold text-lg";
        valDiv.textContent = item.val;
        const labelDiv = document.createElement('div');
        labelDiv.className = "text-xs text-gray-500";
        labelDiv.textContent = item.label;
        cell.appendChild(valDiv);
        cell.appendChild(labelDiv);
        statsDiv.appendChild(cell);
      }
      fragment.appendChild(statsDiv);

      container.innerHTML = '';
      container.appendChild(fragment);

      if (uniqueUnhitNum) {
        currentUniqueElement = DOM.result ? DOM.result.querySelector(`[data-num="${uniqueUnhitNum}"]`) : null;
        if (currentUniqueElement && lastUniqueNum !== uniqueUnhitNum) {
          lastUniqueNum = uniqueUnhitNum;
          const flyColor = numProps[uniqueUnhitNum] ? numProps[uniqueUnhitNum].color : getBallColor(uniqueUnhitNum);
          const flyColorClass = getColorClass(flyColor, false);
          setTimeout(() => launchUniqueFlyEffect(uniqueUnhitNum, flyColorClass), 100);
        }
      } else { lastUniqueNum = null; }
      lastAnalysisResult = {
        sortedFreqMap,
        adjustedTotal,
        unique,
        avg: (unique > 0 ? (adjustedTotal / unique).toFixed(2) : "0.00")
      };
    } catch(err) {
      console.error("renderResult error:", err);
      if (DOM.result) DOM.result.innerHTML = '<div class="text-center py-8 text-red-400">渲染出错</div>';
      showToast("⚠️ 结果渲染失败", true);
    }
  }

  function initResultDelegation() {
    const resultEl = DOM.result;
    if (!resultEl) return;
    resultEl.addEventListener("click", e => {
      const btn = e.target.closest("[data-num]");
      if (!btn) return;
      const num = Number(btn.dataset.num);
      if (!Number.isNaN(num)) copyNumber(num);
    });
  }

  // ===== 开奖 =====
  function normalizeWaveToColor(waveRaw, num) {
    if (waveRaw !== undefined && waveRaw !== null && waveRaw !== "") {
      const w = String(waveRaw).trim().toLowerCase();
      if (w.includes('红') || w === '1' || w === 'red') return 'red';
      if (w.includes('绿') || w === '2' || w === 'green') return 'green';
      if (w.includes('蓝') || w === '3' || w === 'blue') return 'blue';
    }
    if (num >= 1 && num <= BALL_TOTAL) {
      if (RED_SET.has(num)) return 'red';
      if (BLUE_SET.has(num)) return 'blue';
      return 'green';
    }
    return 'blue';
  }

  function checkDrawComplete(item) {
    if (!item || !item.openCode) return false;
    const codes = String(item.openCode).split(",").filter(c => c.trim() !== "");
    return codes.length >= 7;
  }

  function rollBallNumbers(duration) {
    if (_rollTimer) return;
    const ballItems = DOM.lotteryBalls ? DOM.lotteryBalls.querySelectorAll('.result-ball') : [];
    if (ballItems.length === 0) return;
    ballItems.forEach(ball => { ball.style.animation = 'none'; ball.style.opacity = '1'; ball.style.transform = 'scale(1) rotate(0deg)'; });
    const rollInterval = setInterval(() => {
      ballItems.forEach(ball => {
        const randomNum = Math.floor(Math.random() * BALL_TOTAL) + 1;
        const numSpan = ball.querySelector('.ball-number');
        if (numSpan) numSpan.textContent = String(randomNum).padStart(2, '0');
      });
    }, ROLL_INTERVAL_MS);
    _rollTimer = rollInterval;
    setTimeout(() => {
      clearInterval(rollInterval);
      _rollTimer = null;
      ballItems.forEach(ball => {
        const finalNum = ball.dataset.finalNum;
        if (finalNum) {
          const numSpan = ball.querySelector('.ball-number');
          if (numSpan) numSpan.textContent = finalNum;
        }
      });
      ballItems.forEach((ball, idx) => {
        setTimeout(() => {
          ball.style.animation = '';
          void ball.offsetHeight;
          ball.style.animation = 'ballAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        }, idx * BALL_STAGGER_MS);
      });
    }, duration);
  }

  function renderLottery(item) {
    const codesRaw = String(item.openCode || "").split(",").map(c => c.trim());
    const wavesRaw = String(item.wave || "").split(",").map(w => w.trim());
    const codes = codesRaw.filter(c => /^\d+$/.test(c) && Number(c) >= 1 && Number(c) <= BALL_TOTAL);
    if (DOM.lotteryPeriod) DOM.lotteryPeriod.textContent = escapeHtml(item.expect || "--");
    if (DOM.lotteryTime) {
      const rawTime = item.openTime || "--";
      DOM.lotteryTime.textContent = escapeHtml(typeof rawTime === 'string' ? rawTime.replace(" ", "\n") : String(rawTime));
    }
    const colors = codes.map((code, idx) => {
      const num = parseInt(code, 10);
      return normalizeWaveToColor(idx < wavesRaw.length ? wavesRaw[idx] : "", num);
    });
    const zodiacs = codes.map(c => {
      const n = parseInt(c, 10);
      if (isNaN(n) || n < 1 || n > BALL_TOTAL) return "";
      return (numProps[n] && numProps[n].shengXiao) || "";
    });
    const wxClassMap = { "金": "wx-gold", "木": "wx-wood", "水": "wx-water", "火": "wx-fire", "土": "wx-earth" };
    const lotteryYear = getBeijingDate().getFullYear();
    const container = DOM.lotteryBalls;
    if (!container) return;
    const existingBalls = container.querySelectorAll('.result-ball').length;
    if (lastLotteryPeriod === item.expect && existingBalls === codes.length && existingBalls > 0) {
      rollBallNumbers(ROLL_DURATION_MS);
      return;
    }
    if (lastLotteryPeriod !== item.expect) {
      lastLotteryPeriod = item.expect;
      isCurrentDrawComplete = false;
    }
    container.className = "result-balls-row";
    container.innerHTML = "";
    function createBall(num, colorClass, zodiac, wx, idx) {
      const div = document.createElement("div");
      div.className = "result-ball-item";
      const ball = document.createElement("div");
      ball.className = "result-ball " + colorClass;
      ball.style.animation = "none";
      ball.style.opacity = "1";
      ball.style.transform = "scale(1)";
      ball.dataset.finalNum = codes[idx].padStart(2, "0");
      const numSpan = document.createElement("span");
      numSpan.className = "ball-number";
      numSpan.textContent = codes[idx].padStart(2, "0");
      ball.appendChild(numSpan);
      const meta = document.createElement("div");
      meta.className = "result-ball-meta";
      meta.innerHTML = escapeHtml(zodiac) + '<span class="' + escapeHtml(wxClassMap[wx] || "") + '">' + escapeHtml(wx) + '</span>';
      ball.appendChild(meta);
      div.appendChild(ball);
      return div;
    }
    for (let i = 0; i < 6 && i < codes.length; i++) {
      const num = parseInt(codes[i], 10);
      const colorClass = { red: "result-ball-red", green: "result-ball-green", blue: "result-ball-blue" }[colors[i]] || "result-ball-blue";
      const wx = (num >= 1 && num <= BALL_TOTAL) ? (getFive(num, lotteryYear) || "?") : "?";
      container.appendChild(createBall(num, colorClass, zodiacs[i], wx, i));
    }
    if (codes.length >= 7) {
      const plus = document.createElement("div");
      plus.className = "result-plus-sign";
      plus.textContent = "+";
      container.appendChild(plus);
      const num = parseInt(codes[6], 10);
      const colorClass = { red: "result-ball-red", green: "result-ball-green", blue: "result-ball-blue" }[colors[6]] || "result-ball-blue";
      const wx = (num >= 1 && num <= BALL_TOTAL) ? (getFive(num, lotteryYear) || "?") : "?";
      container.appendChild(createBall(num, colorClass, zodiacs[6], wx, 6));
    }
    void container.offsetHeight;
    rollBallNumbers(ROLL_DURATION_MS);
  }

  // 修复 P1 #7: fetchLottery 守卫顺序
  async function fetchLottery() {
    if (isFetchingLottery) return; // 先检查
    const seq = ++fetchSeq;
    if (currentFetchController) { try { currentFetchController.abort(); } catch(_) {} }
    currentFetchController = new AbortController();
    const signal = currentFetchController.signal;
    isFetchingLottery = true;
    const btn = DOM.refreshLotteryBtn;
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) { btn.innerHTML = '<svg class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>加载中...'; btn.disabled = true; }
    try {
      const res = await fetchWithTimeout(API_CONFIG.live + "?_t=" + Date.now(), { signal }, 8000);
      if (signal.aborted || seq !== fetchSeq) return;
      const data = await res.json();
      if (seq !== fetchSeq) return;
      if (!Array.isArray(data) || !data[0]) { showToast("暂无开奖数据"); return; }
      const item = data[0];
      if (!item.expect || !item.openCode || typeof item.openCode !== "string") {
        throw new Error("Invalid lottery data structure");
      }
      safeSetItem(LS_CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
      const isNewPeriod = lastLotteryPeriod !== item.expect;
      if (isNewPeriod) { lastLotteryPeriod = item.expect; isCurrentDrawComplete = false; }
      renderLottery(item);
      if (checkDrawComplete(item)) {
        if (!isCurrentDrawComplete) { isCurrentDrawComplete = true; showToast("当期开奖已完成"); }
        else if (isNewPeriod) { isCurrentDrawComplete = true; showToast("新期号已更新"); }
      }
      if (DOM.lastRefreshTime) DOM.lastRefreshTime.textContent = "上次刷新：" + new Date().toLocaleTimeString();
    } catch(e) {
      if (e.name === 'AbortError' || seq !== fetchSeq) return;
      console.error("fetchLottery error:", e);
      try {
        const cacheRaw = localStorage.getItem(LS_CACHE_KEY);
        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw);
          if (cache.data && cache.data[0]) {
            renderLottery(cache.data[0]);
            showToast("离线模式：显示缓存数据");
            return;
          }
        }
      } catch(cacheErr) {}
      showToast("⚠️ 获取开奖失败", true);
    } finally {
      isFetchingLottery = false;
      if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
      if (currentFetchController && currentFetchController.signal === signal) {
        currentFetchController = null;
      }
    }
  }

  // ===== 历史记录 =====
  function createHistoryItemElement(item, year) {
    const div = document.createElement('div');
    div.className = 'history-item';
    const header = document.createElement('div');
    header.className = 'history-item-header';
    const expect = item.expect || '';
    const openTime = item.openTime || '';
    header.textContent = `第${expect.slice(4)}期 · ${openTime.slice(5, 16) || ''}`;
    div.appendChild(header);
    const ballsRow = document.createElement('div');
    ballsRow.className = 'history-balls-row';

    if (item.openCode && item.openCode.trim()) {
      const codes = item.openCode.split(",").map(c => c.trim());
      const waves = (item.wave || "").split(",").map(w => w.trim());
      const recordYear = Number(year) || CURRENT_YEAR;
      const sxMap = generateShengxiaoMap(recordYear);

      codes.forEach((code, i) => {
        const num = parseInt(code, 10);
        const waveVal = i < waves.length ? waves[i] : "";
        const colorKey = normalizeWaveToColor(waveVal, num);
        const cc = colorKey === "red" ? "history-ball-red" : (colorKey === "green" ? "history-ball-green" : "history-ball-blue");
        const five = (num >= 1 && num <= BALL_TOTAL) ? getFive(num, recordYear) : "";
        let zodiac = "";
        if (num >= 1 && num <= BALL_TOTAL) {
          for (const [sx, nums] of Object.entries(sxMap)) {
            if (nums.includes(num)) { zodiac = sx; break; }
          }
        }
        const card = document.createElement('div');
        card.className = `history-ball-card ${cc}`;
        const numDiv = document.createElement('div');
        numDiv.className = 'history-ball-number';
        // 修复 Low: textContent 自动转义，无需 escapeHtml
        numDiv.textContent = code;
        card.appendChild(numDiv);
        const tagDiv = document.createElement('div');
        tagDiv.className = 'history-ball-tag';
        tagDiv.textContent = zodiac + '/' + five;
        card.appendChild(tagDiv);
        ballsRow.appendChild(card);
        if (i === 5) {
          const plus = document.createElement('span');
          plus.className = 'history-plus-sign';
          plus.textContent = '+';
          ballsRow.appendChild(plus);
        }
      });
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'display:flex; justify-content:center; align-items:center; padding:24px 0; color:#fbbf24; font-size:14px; font-weight:500;';
      placeholder.textContent = '待开奖';
      ballsRow.appendChild(placeholder);
    }
    div.appendChild(ballsRow);
    return div;
  }

  function ensureHistorySorted() {
    if (currentHistorySorted.length > 0) return;
    const seen = new Set();
    const unique = [];
    for (const item of currentHistoryData) {
      if (item && item.expect && !seen.has(item.expect)) {
        seen.add(item.expect);
        unique.push(item);
      }
    }
    currentHistorySorted = unique.sort((a, b) =>
      String(b.expect).localeCompare(String(a.expect), undefined, { numeric: true })
    );
  }

  function renderHistoryPage() {
    try {
      const cont = document.getElementById("historyContent");
      const pagi = document.getElementById("historyPagination");
      ensureHistorySorted();
      const sorted = currentHistorySorted;
      if (!sorted || sorted.length === 0) {
        if (cont) cont.innerHTML = '<div style="color:#9ca3af; padding:32px 0; text-align:center;">暂无数据</div>';
        if (pagi) pagi.classList.add("dhidden");
        return;
      }
      const totalPages = Math.max(1, Math.ceil(sorted.length / HISTORY_PAGE_SIZE));
      if (currentHistoryPage > totalPages) currentHistoryPage = totalPages;
      const start = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
      const pageData = sorted.slice(start, start + HISTORY_PAGE_SIZE);
      const frag = document.createDocumentFragment();
      const year = historyYearLoaded || CURRENT_YEAR;
      for (const item of pageData) {
        frag.appendChild(createHistoryItemElement(item, year));
      }
      if (cont) { cont.innerHTML = ""; cont.appendChild(frag); }
      const pageNumEl = document.getElementById("historyPageNum");
      const totalPagesEl = document.getElementById("historyTotalPages");
      if (pageNumEl) pageNumEl.textContent = currentHistoryPage;
      if (totalPagesEl) totalPagesEl.textContent = totalPages;
      if (pagi) {
        if (totalPages <= 1) pagi.classList.add("dhidden"); else pagi.classList.remove("dhidden");
        const prevBtn = document.getElementById("history-prev");
        const nextBtn = document.getElementById("history-next");
        if (prevBtn) prevBtn.disabled = currentHistoryPage <= 1;
        if (nextBtn) nextBtn.disabled = currentHistoryPage >= totalPages;
      }
    } catch(e) {
      console.error("renderHistoryPage error:", e);
      showToast("⚠️ 历史渲染失败", true);
    }
  }

  function loadHistoryData(year) {
    if (!year) return;
    if (historyAbortController) { try { historyAbortController.abort(); } catch(_) {} }
    historyAbortController = new AbortController();
    const signal = historyAbortController.signal;
    historyYearLoaded = Number(year);
    const loadDiv = document.getElementById("historyLoading");
    const cont = document.getElementById("historyContent");
    const sel = document.getElementById("historyYear");
    if (sel) sel.value = year;
    if (loadDiv) loadDiv.classList.remove("dhidden");

    (async () => {
      try {
        if (historyCache[year]) {
          currentHistoryData = historyCache[year];
        } else {
          const res = await fetchWithTimeout(API_CONFIG.historyBase + year, { signal }, 10000);
          if (signal.aborted) return;
          const json = await res.json();
          if (signal.aborted) return;
          if (json.code === 200 && Array.isArray(json.data)) {
            currentHistoryData = json.data;
            historyCache[year] = json.data;
            saveHistoryCache();
          } else {
            currentHistoryData = [];
          }
        }
        currentHistorySorted = [];
        currentHistoryPage = 1;
        renderHistoryPage();
        saveHistoryCache();
      } catch(e) {
        if (e.name === 'AbortError') return;
        console.error("loadHistoryData error:", e);
        currentHistoryData = [];
        if (cont) cont.innerHTML = '<div style="color:#f87171;">加载失败</div>';
        showToast("⚠️ 历史数据加载失败", true);
      } finally {
        if (loadDiv) loadDiv.classList.add("dhidden");
        if (historyAbortController && historyAbortController.signal === signal) {
          historyAbortController = null;
        }
      }
    })();
  }

  // ===== 抽屉系统 (修复 P2 #10: 统一转义) =====
  const DrawerSystem = {
    current: null,
    templates: {
      shama: () => `<textarea id="kill-input" rows="3" class="dinput">${escapeHtml(state.killNums.join(" "))}</textarea>`,
      shengxiao: () => {
        const sxs = ["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"];
        const sel = state.selectedFilters.shengxiao;
        return '<div class="dgrid-6">' + sxs.map(sx =>
          `<label><input type="checkbox" class="filter-checkbox hidden" value="生肖${escapeHtml(sx)}" data-drawer="shengxiao" ${sel.includes("生肖"+sx)?"checked":""}><span class="filter-label dbtn">${escapeHtml(sx)}</span></label>`
        ).join("") + "</div>";
      },
      haomatou: () => {
        const heads = [["0头单","1头单","2头单","3头单","4头单"],["0头双","1头双","2头双","3头双","4头双"]];
        const sel = state.selectedFilters.haomatou;
        return heads.map(row => '<div class="dflex">' + row.map(h =>
          `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(h)}" data-drawer="haomatou" ${sel.includes(h)?"checked":""}><span class="filter-label dbtn dbtn-sm">${escapeHtml(h)}</span></label>`
        ).join("") + "</div>").join("");
      },
      weishu: () => {
        const tails = [["0尾","1尾","2尾","3尾","4尾"],["5尾","6尾","7尾","8尾","9尾"]];
        const sel = state.selectedFilters.weishu;
        return tails.map(row => '<div class="dflex">' + row.map(t =>
          `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(t)}" data-drawer="weishu" ${sel.includes(t)?"checked":""}><span class="filter-label dbtn dbtn-sm">${escapeHtml(t)}</span></label>`
        ).join("") + "</div>").join("");
      },
      shuduan: () => {
        const duans = ["1段","2段","3段","4段","5段","6段","7段"];
        const sel = state.selectedFilters.shuduan;
        return '<div class="dflex-wrap">' + duans.map(d =>
          `<label><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(d)}" data-drawer="shuduan" ${sel.includes(d)?"checked":""}><span class="filter-label dbtn dbtn-md">${escapeHtml(d)}</span></label>`
        ).join("") + "</div>";
      },
      bose: () => {
        const items = [["红波单","蓝波单","绿波单"],["红波双","蓝波双","绿波双"]];
        const sel = state.selectedFilters.bose;
        return items.map(row => '<div class="dflex">' + row.map(item =>
          `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(item)}" data-drawer="bose" ${sel.includes(item)?"checked":""}><span class="filter-label dbtn dbtn-sm">${escapeHtml(item.replace("波",""))}</span></label>`
        ).join("") + "</div>").join("");
      },
      wuxing: () => {
        const table = generateWuxingTable(CURRENT_YEAR);
        const wx = {};
        for (const [k, v] of Object.entries(table)) {
          wx[k] = v.map(n => String(n).padStart(2,'0')).join(' ');
        }
        const sel = state.selectedFilters.wuxing;
        return '<div class="dspace-y">' + Object.entries(wx).map(([k,v]) =>
          `<div class="wuxing-row"><label class="ditems-center" style="gap:8px;min-width:0;flex-shrink:0;"><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(k)}" data-drawer="wuxing" ${sel.includes(k)?"checked":""}><span class="filter-label dbtn dbtn-fixed wuxing-btn-fixed">${escapeHtml(k)}</span></label><span class="wuxing-nums">${escapeHtml(v)}</span></div>`
        ).join("") + "</div>";
      },
      bandanshuang: () => {
        const items = [["合数单","小单","大单"],["合数双","小双","大双"]];
        const sel = state.selectedFilters.bandanshuang;
        return items.map(row => '<div class="dflex">' + row.map(item =>
          `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(item)}" data-drawer="bandanshuang" ${sel.includes(item)?"checked":""}><span class="filter-label dbtn dbtn-sm">${escapeHtml(item)}</span></label>`
        ).join("") + "</div>").join("");
      },
      heshu: () => {
        const hes = Array.from({ length: 13 }, (_, i) => (i + 1) + "合");
        const sel = state.selectedFilters.heshu;
        return '<div class="dgrid-4">' + hes.map(h =>
          `<label><input type="checkbox" class="filter-checkbox hidden" value="${escapeHtml(h)}" data-drawer="heshu" ${sel.includes(h)?"checked":""}><span class="filter-label dbtn dbtn-sm">${escapeHtml(h)}</span></label>`
        ).join("") + "</div>";
      },
history: () => {
  let opts = "";
  for (let y = getBeijingDate().getFullYear(); y >= 2020; y--) {
    opts += `<option value="${y}">${y}年</option>`;
  }
  return [
    '<div>',
      '<div class="history-header-row">',
        `<select id="historyYear" class="dselect">${opts}</select>`,
        `<button type="button" id="historyRefreshBtn" class="dbtn dbtn-sm history-refresh-btn">刷新</button>`,
      '</div>',
      '<div id="historyLoading" class="dhidden dtext-center dpy-4"><svg class="animate-spin" style="width:12px;height:12px;margin:0 auto;color:#00ffea;" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>',
      '<div id="historyContent" class="dmt-3 hide-scrollbar"></div>',
      '<div id="historyPagination" class="dflex-between dmt-6 dpx-1 dhidden">',
        '<button type="button" id="history-prev" class="dpage-btn">← 上1页</button>',
        '<div class="dtext-sm" style="text-align:center;">第 <span id="historyPageNum" style="font-weight:bold;color:#00ffea;">1</span> 页 / <span id="historyTotalPages" class="dtext-gray">1</span> 页</div>',
        '<button type="button" id="history-next" class="dpage-btn">下1页 →</button>',
      '</div>',
    '</div>'
  ].join("");
}
    },
    open(type) {
      if (this.current === type) { this.close(); return; }
      this.current = type;
      const titles = { shama: "杀码", shengxiao: "生肖", haomatou: "头数", weishu: "尾数", shuduan: "数段", bose: "波色", wuxing: "五行", bandanshuang: "半单双", heshu: "合数", history: "历史开奖" };
      if (DOM.drawer_title) DOM.drawer_title.textContent = titles[type] || "筛选器";
      const contentDiv = DOM.drawer_content;
      if (!contentDiv) { showToast("抽屉初始化失败"); return; }
      try {
        contentDiv.innerHTML = this.templates[type] ? this.templates[type]() : "<p>暂无内容</p>";
      } catch(e) {
        contentDiv.innerHTML = '<p style="color:#f87171; text-align:center;">模板加载失败</p>';
        showToast("⚠️ 模板加载异常", true);
        console.error("Drawer template error:", e);
        return;
      }
      if (DOM.drawer_overlay) {
        DOM.drawer_overlay.classList.remove("hidden");
        DOM.drawer_overlay.style.display = "block";
        setTimeout(() => {
          DOM.drawer_overlay.classList.remove("opacity-0");
          DOM.drawer_overlay.style.opacity = "1";
        }, 10);
      }
      if (DOM.drawer_container) DOM.drawer_container.classList.add("open");
      this.updateNavState(type);
      if (type === "history") {
        const now = getBeijingDate();
        const currentYear = now.getFullYear();
        loadHistoryData(String(currentYear));
      }
    },
    close() {
      if (DOM.drawer_container) DOM.drawer_container.classList.remove("open");
      if (DOM.drawer_overlay) {
        DOM.drawer_overlay.classList.add("opacity-0");
        DOM.drawer_overlay.style.opacity = "0";
        setTimeout(() => {
          DOM.drawer_overlay.classList.add("hidden");
          DOM.drawer_overlay.style.display = "none";
        }, 300);
      }
      this.current = null;
      this.updateNavState(null);
    },
    bindGlobalDelegation() {
      const content = DOM.drawer_content;
      if (!content || content._delegationBound) return;
      content._delegationBound = true;
      content.addEventListener("change", e => {
        const cb = e.target;
        if (cb.classList.contains("filter-checkbox")) {
          toggleFilter(cb.dataset.drawer, cb.value, cb.checked);
          return;
        }
        if (e.target.id === "historyYear") {
          const year = e.target.value;
          if (!year) return;
          loadHistoryData(year);
        }
      });
      content.addEventListener("input", e => {
        if (e.target.id === "kill-input") {
          const parsed = parseInputCount(e.target.value);
          setKillNums(parsed.nums.filter(n => n >= 1 && n <= BALL_TOTAL));
        }
      });
      content.addEventListener("click", e => {
        if (e.target.closest("#history-prev")) {
          if (currentHistoryPage > 1) { currentHistoryPage--; renderHistoryPage(); }
        } else if (e.target.closest("#history-next")) {
          ensureHistorySorted();
          if (currentHistoryPage < Math.ceil(currentHistorySorted.length / HISTORY_PAGE_SIZE)) {
            currentHistoryPage++;
            renderHistoryPage();
          }
        } else if (e.target.closest("#historyRefreshBtn")) {
          const sel = document.getElementById("historyYear");
          const year = sel ? sel.value : (historyYearLoaded || getBeijingDate().getFullYear());
          if (year) {
            delete historyCache[year];
            saveHistoryCache();
            loadHistoryData(year);
          }
        }
      });
    },
    updateNavState(activeType) {
      document.querySelectorAll(".nav-item").forEach(el => {
        const dr = el.dataset.drawer;
        if (dr === activeType) el.classList.add("active");
        else el.classList.remove("active");
      });
    }
  };

  // ===== 复制 =====
  function copyResult() {
    if (!lastAnalysisResult) { showToast("暂无分析结果"); return; }
    let text = "";
    lastAnalysisResult.sortedFreqMap.forEach((nums, f) => {
      text += `${f}次：${nums.map(n => String(n).padStart(2, "0")).join(" ")}\n`;
    });
    if (!text.trim()) { showToast("暂无可复制内容"); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast("已复制")).catch(() => execCopy(text));
    } else execCopy(text);
  }
  function execCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    try { document.execCommand("copy"); showToast("已复制"); }
    catch(e) { showToast("复制失败"); }
    document.body.removeChild(ta);
  }
  function copyNumber(n) {
    const txt = String(n).padStart(2, "0");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => showToast("已复制")).catch(() => execCopy(txt));
    } else execCopy(txt);
  }

  // ===== 自动刷新 =====
  function updateCountdown() {
    if (!DOM.lotteryTime) return;
    // [修复] 时间同步失败时显示离线模式，暂停倒计时
    if (timeSyncFailed) {
      DOM.lotteryTime.textContent = "⚠️ 离线模式";
      DOM.lotteryTime.style.color = "#fbbf24";
      return;
    }
    DOM.lotteryTime.style.color = "";
    const now = getBeijingDate();
    const nextDraw = getNextDrawTime();
    const diff = nextDraw - now;
    if (diff <= 0) { DOM.lotteryTime.textContent = "开奖中..."; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    DOM.lotteryTime.textContent = "距开奖 " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function checkDrawWindow() {
    const wasInWindow = inDrawWindowFlag;
    inDrawWindowFlag = isInDrawWindow();
    if (inDrawWindowFlag && !wasInWindow) {
      fetchLottery();
      lastDrawFetchTime = Date.now();
      return;
    }
    if (inDrawWindowFlag) {
      const elapsed = Date.now() - lastDrawFetchTime;
      if (elapsed >= DRAW_CONFIG.pollMs) {
        lastDrawFetchTime = Date.now();
        fetchLottery();
      }
    }
  }

  function regularPoll() {
    if (inDrawWindowFlag) return;
    const elapsed = Date.now() - lastRegularFetchTime;
    if (elapsed >= DRAW_CONFIG.regularMs) {
      lastRegularFetchTime = Date.now();
      fetchLottery();
    }
  }

  function initAutoRefresh() {
    // [修复] 时间同步失败时显示离线模式，不启动倒计时定时器
    updateCountdown();
    if (!timeSyncFailed) {
      countdownTimer = setInterval(updateCountdown, 1000);
    }
    checkDrawWindow();
    autoRefreshTimer = setInterval(checkDrawWindow, DRAW_WINDOW_CHECK_MS);
    regularPollTimer = setInterval(regularPoll, DRAW_REGULAR_MS);
    const onForeground = function() { setTimeout(fetchLottery, 300); };
    const onPageShow = function(e) {
      if (e.persisted || document.visibilityState === 'visible') onForeground();
    };
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') onForeground();
    });
    window.addEventListener('pageshow', onPageShow);
    // 修复 P1 #9: 在 beforeunload 中清理所有副作用
    window.addEventListener('beforeunload', function cleanup() {
      document.removeEventListener('visibilitychange', onForeground);
      window.removeEventListener('pageshow', onPageShow);
      if (countdownTimer) clearInterval(countdownTimer);
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      if (regularPollTimer) clearInterval(regularPollTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (inputSaveTimer) clearTimeout(inputSaveTimer);
      if (_rollTimer) clearInterval(_rollTimer);
      if (currentFetchController) { try { currentFetchController.abort(); } catch(_) {} }
      if (historyAbortController) { try { historyAbortController.abort(); } catch(_) {} }
      cleanupFlyEffects();
    });
  }

  // ===== 启动画面 (修复 P1 #8: 由业务就绪显式关闭) =====
  let splashResolve = null;
  const splashPromise = new Promise((resolve) => { splashResolve = resolve; });

  function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    let switched = false;
    function switchToMain() {
      if (switched) return;
      switched = true;
      if (!splash) return;
      splash.style.animation = 'none';
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.8s ease-out';
      splash.style.pointerEvents = 'none';
      setTimeout(() => {
        splash.style.display = 'none';
        try { window.dispatchEvent(new Event('resize')); } catch(e) {}
        if (splashResolve) splashResolve();
      }, 800);
    }

    // 强制超时（仅作为安全网，不再依赖它关闭）
    setTimeout(() => {
      if (!switched) {
        console.warn('[启动画面] 强制超时关闭（安全网）');
        switchToMain();
      }
    }, 8000);

    const finalText = "神码再现";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
    const textContainer = document.getElementById('text-scramble');
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');
    let isLoaded = false;

    function initText() {
      if (!textContainer) return;
      textContainer.innerHTML = '';
      finalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.setAttribute('data-text', char);
        const core = document.createElement('span');
        core.className = 'char-core';
        core.textContent = char;
        span.appendChild(core);
        textContainer.appendChild(span);
      });
    }

    function animateText() {
      const coreSpans = document.querySelectorAll('.char-core');
      let frame = 0;
      const totalFrames = 60;
      function step() {
        coreSpans.forEach((span, index) => {
          if (frame > index * 5) {
            if (frame < totalFrames) {
              span.textContent = chars[Math.floor(Math.random() * chars.length)];
            } else {
              span.textContent = finalText[index];
            }
          }
        });
        frame++;
        if (frame <= totalFrames + 10) {
          requestAnimationFrame(step);
        } else {
          coreSpans.forEach((span, index) => span.textContent = finalText[index]);
        }
      }
      step();
    }

    document.addEventListener('mousemove', (e) => {
      if (isLoaded || !textContainer) return;
      const rect = textContainer.getBoundingClientRect();
      textContainer.style.setProperty('--x', (e.clientX - rect.left) + 'px');
      textContainer.style.setProperty('--y', (e.clientY - rect.top) + 'px');
    });

    function simulateLoading() {
      initText();
      animateText();
      let progress = 0;
      const interval = 50;
      const step = 100 / (CFG.SPLASH_DURATION_MS / interval);
      const timer = setInterval(() => {
        progress += step + Math.random() * 2;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          finishLoading();
        }
        if (progressBar) progressBar.style.width = progress + '%';
        if (loadingText) {
          loadingText.textContent = 'SYSTEM INITIALIZING... ' + Math.floor(progress) + '%';
        }
      }, interval);
    }

    function finishLoading() {
      isLoaded = true;
      if (loadingText) {
        loadingText.textContent = 'ACCESS GRANTED';
        loadingText.style.color = '#00f3ff';
      }
      if (progressBar) progressBar.style.boxShadow = '0 0 20px #00f3ff';
      // 业务就绪后延迟关闭
      setTimeout(switchToMain, FADE_OUT_DELAY_MS);
    }

    simulateLoading();

    // 返回一个函数，允许外部提前关闭（当业务就绪时）
    return function forceClose() {
      if (!switched) {
        console.log('[启动画面] 业务就绪，提前关闭');
        finishLoading();
      }
    };
  }

  // ===== 设置菜单 (修复 P2 #12: 使用统一初始化) =====
  function initSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const settingsWrapper = document.getElementById('settingsWrapper');
    const freqAdjToggle = document.getElementById('freqAdjToggle');

    try {
      const saved = localStorage.getItem('shenma_freq_adj');
      if (saved !== null) {
        const val = JSON.parse(saved);
        if (val && typeof val.enabled === 'boolean') {
          freqAdjEnabled = val.enabled;
          if (freqAdjToggle) freqAdjToggle.checked = val.enabled;
        }
      }
    } catch(e) {}

    if (settingsBtn && settingsDropdown) {
      settingsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        settingsDropdown.classList.toggle('hidden');
      });
    }

    if (settingsDropdown) {
      settingsDropdown.addEventListener('click', function(e) { e.stopPropagation(); });
    }

    document.addEventListener('click', function(e) {
      if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
        if (settingsWrapper && !settingsWrapper.contains(e.target)) {
          settingsDropdown.classList.add('hidden');
        }
      }
    });

    window.addEventListener('scroll', function() {
      if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
        settingsDropdown.classList.add('hidden');
      }
    }, true);

    window.addEventListener('resize', function() {
      if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
        settingsDropdown.classList.add('hidden');
      }
    });

    if (freqAdjToggle) {
      freqAdjToggle.addEventListener('change', function() {
        const enabled = freqAdjToggle.checked;
        freqAdjEnabled = enabled;
        try {
          safeSetItem('shenma_freq_adj', JSON.stringify({ enabled: enabled, _t: Date.now() }));
        } catch(e) {}
        runAnalysis();
      });
    }
  }
  // ===== 主初始化 =====
  async function init() {
    try {
      // 先启动启动画面（异步动画，不阻塞）
      const closeSplash = initSplashScreen();

      // 并行执行时间同步（最多 3 秒）
      await Promise.race([syncTime(), new Promise(r => setTimeout(r, 3000))]);

      // DOM 缓存
      cacheDOM();

      // 加载状态
      loadState();
      loadHistoryCache();

      // 延迟加载输入缓存
      setTimeout(() => loadInputCache(), 100);

      // 订阅状态变化
      subscribe(onStateChange);

      // 初始化事件委托
      initResultDelegation();
      DrawerSystem.bindGlobalDelegation();

      // 事件绑定
      if (DOM.exampleBtn) {
        DOM.exampleBtn.addEventListener("click", function() {
          DOM.numbers.value = "龍蛇馬 12 25 36 8 17 29 41 5 19 33 47";
          runAnalysis();
          saveInputCacheDelayed();
        });
      }

      if (DOM.clearBtn) {
        DOM.clearBtn.addEventListener("click", function() {
          DOM.numbers.value = "";
          runAnalysis();
          saveInputCacheDelayed();
          showToast("已清空输入");
        });
      }

      if (DOM.copyResultBtn) DOM.copyResultBtn.addEventListener("click", copyResult);
      if (DOM.numbers) DOM.numbers.addEventListener("input", function() { runAnalysis(); });
      if (DOM.refreshLotteryBtn) {
        DOM.refreshLotteryBtn.addEventListener("click", function() { fetchLottery(); });
      }

      document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          const drawer = btn.dataset.drawer;
          if (drawer === "selectnone") {
            clearAllFilters();
            DrawerSystem.close();
            showToast("已清空所有筛选");
          } else {
            DrawerSystem.open(drawer);
          }
        });
      });

      if (DOM.drawer_close) DOM.drawer_close.addEventListener("click", () => DrawerSystem.close());
      if (DOM.drawer_overlay) DOM.drawer_overlay.addEventListener("click", () => DrawerSystem.close());

      // 初始化设置菜单
      initSettings();

      // 首次数据拉取
      fetchLottery();
      runAnalysis();
      initAutoRefresh();

      // 标记就绪，关闭启动画面
      isAppReady = true;
      if (closeSplash) closeSplash();

      console.log("%c✅ 神码再现 v3.7.12 安全修复版已启动", "color:#00ffea;font-weight:bold");
    } catch(e) {
      console.error("初始化失败:", e);
      showToast("⚠️ 应用初始化失败，请刷新重试", true);
    }
  }

  // ===== 启动 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
