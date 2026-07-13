// ======================== app.js v3.7.14 ========================
// 全离线自包含 · 时间同步失败离线模式 · 频次调整联动 · 滚动动画防重入
(function () {
  "use strict";

  // ---------- 兼容性填充 ----------
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(cb) { return setTimeout(cb, 16); };
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) { clearTimeout(id); };

  if (typeof Promise === 'undefined' || typeof fetch === 'undefined') {
    document.body.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#f87171;font-family:sans-serif;"><h2>浏览器版本过低</h2><p>请使用支持 Promise 和 fetch 的现代浏览器（Chrome 45+, Safari 10.1+, Firefox 40+, iOS 10.3+）</p></div>';
    throw new Error('Browser does not support Promise or fetch');
  }

  // ---------- 安全 localStorage 包装 ----------
  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('shenma_') && k !== key) {
              localStorage.removeItem(k);
            }
          }
          localStorage.setItem(key, value);
          return true;
        } catch (retryErr) {}
        console.warn('[localStorage] 存储已满:', key);
      }
      return false;
    }
  }

  // ---------- 全局错误监听 ----------
  window.addEventListener('error', function(e) {
    console.error('[全局错误]', e.message, 'at', e.filename + ':' + e.lineno, e.error);
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.error('[未处理Promise拒绝]', e.reason);
  });

  // ---------- 在线状态检测 ----------
  (function initOnlineTracking() {
    function updateOnlineStatus() {
      if (!navigator.onLine) {
        showToast("⚠️ 网络已断开，部分功能可能不可用");
      } else {
        showToast("🟢 网络已恢复");
      }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  })();

  // ======================== 数据定义 ========================
  const MAX_NUMBERS = 5000;
  const ZODIAC_SEQUENCE = ["龍","蛇","馬","羊","猴","雞","狗","豬","鼠","牛","虎","兔"];
  const BASE_YEAR = 2024;
  function generateShengxiaoMap(year) {
    const taiSuiIdx = ((year - BASE_YEAR) % 12 + 12) % 12;
    const map = {};
    for (let i = 0; i < 12; i++) {
      const offset = (taiSuiIdx - i + 12) % 12;
      const start = offset + 1;
      const nums = [];
      for (let k = 0; k < 5; k++) { const num = start + k * 12; if (num <= 49) nums.push(num); }
      map[ZODIAC_SEQUENCE[i]] = nums;
    }
    return map;
  }
  const WUXING_BASE_SEQ = ['金','金','土','土','木','木','火','火','金','金','水','水','木','木','火','火','土','土','水','水','木','木','金','金','土','土','水','水','火','火'];
  function generateWuxing(year) { const offset = year - 2023; const result = { '金':[],'木':[],'水':[],'火':[],'土':[] }; for (let n=1;n<=49;n++) { const wx = WUXING_BASE_SEQ[((n-1)%30 - offset + 30)%30]; result[wx].push(n); } return result; }
  function getNumberWuxing(num,year) {
    if (!Number.isInteger(num) || num < 1 || num > 49) return "?";
    const idx=(num-1)%30; const offset=year-2023;
    return WUXING_BASE_SEQ[(idx-offset+30)%30];
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
  const numProps = new Array(50);
  const sxEntries = Object.entries(SHENGXIAO);
  const duanEntries = Object.entries(DUAN);
  for (let n=1;n<=49;n++) {
    const head=Math.floor(n/10), tail=n%10, odd=n%2===1?"单":"双";
    const color = CATEGORIES.红波.includes(n)?"red":(CATEGORIES.蓝波.includes(n)?"blue":"green");
    const five=getNumberWuxing(n,CURRENT_YEAR);
    const sum=head+tail;
    const sumOdd=sum%2===1?"合数单":"合数双";
    let duan=""; for(let i=0;i<duanEntries.length;i++) if(duanEntries[i][1].includes(n)){duan=duanEntries[i][0];break;}
    const halfOddEven=n>24?(n%2===1?"大单":"大双"):(n%2===1?"小单":"小双");
    let shengXiao=""; for(let i=0;i<sxEntries.length;i++) if(sxEntries[i][1].includes(n)){shengXiao=sxEntries[i][0];break;}
    numProps[n]={head,tail,color,odd,five,sumOdd,duan,halfOddEven,shengXiao,sum};
  }

  // 导出数据到全局（供其他模块使用）
  window.APP_DATA = { MAX_NUMBERS, SHENGXIAO, CATEGORIES, DUAN, numProps, ZODIAC_SEQUENCE, BASE_YEAR, generateShengxiaoMap, generateWuxing, getNumberWuxing, WUXING_BASE_SEQ };

  // ======================== API 配置 ========================
  const API_CONFIG = {
    live: "https://macaumarksix.com/api/live2",
    historyBase: "https://history.macaumarksix.com/history/macaujc2/y/"
  };
  const HISTORY_PAGE_SIZE = 15;
  const LS_KEY = "shenma_v4_state";
  const LS_CACHE_KEY = "shenma_v4_lottery_cache";
  const LS_HISTORY_KEY = "shenma_v4_history_cache";
  const LS_INPUT_KEY = "shenma_v4_input";
  const HISTORY_CACHE_MAX_AGE = 7 * 86400000;
  const CACHE_MAX_YEARS = 3;

  // ========== 北京时间校准（多时间源） ==========
  let timeOffset = 0;
  let timeSyncFailed = false;  // 新增：标记时间同步是否失败

  function getBeijingDate() {
    const ts = Date.now() + timeOffset;
    const d = new Date(ts);
    const utcMs = ts + d.getTimezoneOffset() * 60000;
    return new Date(utcMs + 8 * 3600000);
  }

  async function syncTime() {
    const TIME_SOURCES = [
      { url: 'https://vv.video.qq.com/checktime?otype=json', parser: (text) => { const json = JSON.parse(text.replace(/^QZOutputJson=/, '').replace(/;?$/, '')); return json.t * 1000; } },
      { url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai', parser: (json) => new Date(json.utc_datetime).getTime() },
      { url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai', parser: (json) => new Date(json.dateTime).getTime() }
    ];
    for (const src of TIME_SOURCES) {
      try {
        const res = await fetch(src.url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let data;
        if (src.url.includes('vv.video.qq.com')) {
          const text = await res.text();
          data = src.parser(text);
        } else {
          data = src.parser(await res.json());
        }
        if (typeof data === 'number' && !isNaN(data)) {
          timeOffset = data - Date.now();
          timeSyncFailed = false;
          console.log('✅ 时间同步成功，偏移量:', timeOffset, 'ms');
          return;
        }
      } catch (e) {
        console.warn('⏰ 时间源失败:', src.url, e.message);
      }
    }
    // 所有源都失败
    timeSyncFailed = true;
    timeOffset = 0;
    console.warn('⏰ 所有时间源均失败，进入离线模式，使用本地时间');
  }

  // ========== 开奖窗口配置 ==========
  const DRAW_START_HOUR = 21, DRAW_START_MINUTE = 33, DRAW_START_SECOND = 25;
  const DRAW_END_HOUR = 21, DRAW_END_MINUTE = 34, DRAW_END_SECOND = 30;
  const DRAW_POLL_MS = 2000;
  const DRAW_REGULAR_MS = 60000;

  function isInDrawWindow() {
    const now = getBeijingDate();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const startSec = DRAW_START_HOUR * 3600 + DRAW_START_MINUTE * 60 + DRAW_START_SECOND;
    const endSec = DRAW_END_HOUR * 3600 + DRAW_END_MINUTE * 60 + DRAW_END_SECOND;
    const nowSec = h * 3600 + m * 60 + s;
    return nowSec >= startSec && nowSec <= endSec;
  }

  // ========== DOM 缓存 ==========
  const DOM = {};
  function cacheDOM() {
    const ids = [
      "numbers","result","charCount","numberWarn","exampleBtn","clearBtn","copyResultBtn",
      "lotteryPeriod","lotteryTime","lastRefreshTime","lotteryBalls","refreshLotteryBtn",
      "drawer-overlay","drawer-container","drawer-title","drawer-content","drawer-close","toast"
    ];
    ids.forEach(id => { DOM[id.replace(/-/g, "_")] = document.getElementById(id); });
    if (!DOM.drawer_content) DOM.drawer_content = document.getElementById("drawer-content");
    if (!DOM.drawer_container) DOM.drawer_container = document.getElementById("drawer-container");
    if (!DOM.drawer_overlay) DOM.drawer_overlay = document.getElementById("drawer-overlay");
    if (!DOM.drawer_title) DOM.drawer_title = document.getElementById("drawer-title");
    if (!DOM.drawer_close) DOM.drawer_close = document.getElementById("drawer-close");
  }

  // ========== 状态管理 ==========
  let state = {
    killNums: [],
    selectedFilters: { shengxiao:[], haomatou:[], weishu:[], shuduan:[], bose:[], wuxing:[], bandanshuang:[], heshu:[] }
  };
  let subscribers = [], lastAnalysisResult = null, lastRawCount = null;

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
    const keys = Object.keys(state.selectedFilters);
    for (let i = 0; i < keys.length; i++) {
      const arr = state.selectedFilters[keys[i]];
      for (let j = 0; j < arr.length; j++) result.push(arr[j]);
    }
    return result;
  }

  function saveState() {
    try {
      safeSetItem(LS_KEY, JSON.stringify({ killNums: state.killNums, selectedFilters: state.selectedFilters, _t: Date.now() }));
    } catch (e) {}
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (parsed._t && (Date.now() - parsed._t > 7 * 86400000)) { localStorage.removeItem(LS_KEY); return; }
      if (Array.isArray(parsed.killNums)) state.killNums = parsed.killNums.filter(n => Number.isInteger(n) && n >= 1 && n <= 49);
      if (parsed.selectedFilters && typeof parsed.selectedFilters === "object") {
        Object.keys(state.selectedFilters).forEach(k => {
          const val = parsed.selectedFilters[k];
          if (Array.isArray(val)) state.selectedFilters[k] = Array.from(val);
        });
      }
    } catch (e) { console.warn("loadState failed", e); }
  }

  // 历史缓存 LRU
  let historyCache = {}, historyYearLoaded = null;
  function pruneHistoryCache() {
    const currentYear = getBeijingDate().getFullYear();
    const years = Object.keys(historyCache).map(Number);
    const validYears = years.filter(y => y >= currentYear - CACHE_MAX_YEARS);
    for (const y of years) {
      if (!validYears.includes(y)) {
        delete historyCache[y];
      }
    }
  }
  function saveHistoryCache() {
    try {
      pruneHistoryCache();
      const keys = Object.keys(historyCache);
      if (keys.length === 0) return;
      const toSave = {};
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const data = historyCache[k];
        if (data && data.length > 0) toSave[k] = data;
      }
      safeSetItem(LS_HISTORY_KEY, JSON.stringify({ cache: toSave, lastYear: historyYearLoaded || "", _t: Date.now() }));
    } catch (e) {}
  }
  function loadHistoryCache() {
    try {
      const raw = localStorage.getItem(LS_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.cache || typeof parsed.cache !== "object") return;
      if (parsed._t && (Date.now() - parsed._t > HISTORY_CACHE_MAX_AGE)) { localStorage.removeItem(LS_HISTORY_KEY); return; }
      const years = Object.keys(parsed.cache);
      for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const data = parsed.cache[year];
        if (Array.isArray(data) && data.length > 0) historyCache[year] = data;
      }
      if (parsed.lastYear) historyYearLoaded = parsed.lastYear;
      pruneHistoryCache();
    } catch (e) { console.warn("loadHistoryCache failed", e); }
  }

  function saveInputCache() {
    try {
      const val = DOM.numbers ? DOM.numbers.value : "";
      if (val && val.trim()) safeSetItem(LS_INPUT_KEY, JSON.stringify({ value: val, _t: Date.now() }));
      else localStorage.removeItem(LS_INPUT_KEY);
    } catch (e) {}
  }
  function loadInputCache() {
    try {
      const raw = localStorage.getItem(LS_INPUT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.value) return;
      if (parsed._t && (Date.now() - parsed._t > 7 * 86400000)) { localStorage.removeItem(LS_INPUT_KEY); return; }
      if (DOM.numbers) {
        DOM.numbers.value = parsed.value;
        runAnalysis();
      }
    } catch (e) { console.warn("loadInputCache failed", e); }
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

  let truncToastShown = false;
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

  // ======================== 输入解析 ========================
  function normalizeZodiac(str) {
    const map = { '龙': '龍', '马': '馬', '鸡': '雞', '猪': '豬' };
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += map[str[i]] || str[i];
    }
    return result;
  }

  function parseInputCount(input) {
    if (!input || !input.trim()) return { nums: [], truncated: false };
    let cleaned = input.replace(/《[^》]*》/g, " ").replace(/[^\d鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪\s]/g, " ").replace(/([鼠牛虎兔龍蛇馬羊猴雞狗豬鸡马龙猪])/g, " $1 ");
    const tokens = cleaned.split(/\s+/).filter(function(t) { return t.length > 0; });
    let results = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const normalizedToken = normalizeZodiac(token);
      const sxNums = SHENGXIAO[normalizedToken];
      if (sxNums && sxNums.length) {
        for (let j = 0; j < sxNums.length; j++) results.push(sxNums[j]);
      } else if (/^\d+$/.test(token)) {
        const n = Number(token);
        if (Number.isInteger(n) && n >= 1 && n <= 49) results.push(n);
      }
    }
    let truncated = false;
    if (results.length > MAX_NUMBERS) {
      results = results.slice(0, MAX_NUMBERS);
      truncated = true;
    }
    return { nums: results, truncated: truncated };
  }

  let cachedMatchFuncs = null, lastFilterSignature = "";
  function getMatchFuncs(filters) {
    const allConds = filters || getFilterSet();
    const sig = allConds.join("\x00");
    if (cachedMatchFuncs && sig === lastFilterSignature) return cachedMatchFuncs;
    lastFilterSignature = sig;
    cachedMatchFuncs = allConds.map(cond => buildMatchFunc(cond));
    return cachedMatchFuncs;
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

  // ======================== 核心分析 ========================
  // 频次动态调整开关（全局，由设置菜单控制）
  let FREQ_ADJ_ENABLED = true;  // 默认开启

  function computeAnalysisMainThread(input, killNums, filters) {
    const nums = parseInputCount(input).nums;
    const rawCount = new Uint16Array(50);
    for (let i = 0; i < nums.length; i++) rawCount[nums[i]]++;
    const killSet = new Set(killNums);
    const funcs = getMatchFuncs(filters);
    const hitCounts = new Uint8Array(50);
    for (let n = 1; n <= 49; n++) {
      let hit = killSet.has(n) ? 1 : 0;
      for (let i = 0; i < funcs.length; i++) {
        if (funcs[i](n)) { hit++; if (hit > 6) break; }
      }
      hitCounts[n] = hit;
    }
    // 使用 FREQ_ADJ_ENABLED 决定是否调整
    const adjustedCount = new Uint16Array(50);
    let adjustedTotal = 0, unique = 0;
    for (let n = 1; n <= 49; n++) {
      const adj = FREQ_ADJ_ENABLED ? Math.max(0, rawCount[n] - hitCounts[n]) : rawCount[n];
      adjustedCount[n] = adj;
      adjustedTotal += adj;
      if (adj > 0) unique++;
    }
    return { adjustedCount: Array.from(adjustedCount), adjustedTotal, unique, hitCounts: Array.from(hitCounts), rawCount: Array.from(rawCount) };
  }

  let debounceTimer = null;
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
              showToast("⚠️ 输入号码超过" + MAX_NUMBERS + "个，已截断");
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
      } catch (err) { console.error("runAnalysis error:", err); }
    }, 200);
  }
  function onStateChange() { runAnalysis(); saveState(); saveInputCache(); }

  // ======================== 飞入动画（独苗） ========================
  let currentUniqueElement = null, lastUniqueNum = null;
  let activeFlyAnim = null;
  function launchUniqueFlyEffect(targetNum, colorClass) {
    if (activeFlyAnim) { cancelAnimationFrame(activeFlyAnim); activeFlyAnim = null; }
    const els = document.querySelectorAll(".flying-unique-ball, .blackhole, .distortion, .accretion-disk, .particle-stream");
    for (let ei = 0; ei < els.length; ei++) {
      const el = els[ei];
      if (el._anim) { try { el._anim.cancel(); } catch(e) {} }
      el.remove();
    }
    const targetEl = DOM.result.querySelector('[data-num="' + targetNum + '"]');
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
      (function(idx) {
        const ring = document.createElement("div");
        ring.style.cssText = "position:absolute;left:50%;top:50%;width:0;height:0;border:2px solid " + color + ";border-radius:50%;transform:translate(-50%,-50%);opacity:0.6;border-top-color:transparent;border-bottom-color:transparent;";
        disk.appendChild(ring);
        const anim = ring.animate([
          { width: '0px', height: '0px', transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 0 },
          { width: (100 + idx * 40) + 'px', height: (100 + idx * 40) + 'px', transform: 'translate(-50%,-50%) rotate(' + (idx % 2 === 0 ? 180 : -180) + 'deg)', opacity: 0.6, offset: 0.5 },
          { width: (80 + idx * 30) + 'px', height: (80 + idx * 30) + 'px', transform: 'translate(-50%,-50%) rotate(' + (idx % 2 === 0 ? 360 : -360) + 'deg)', opacity: 0.3 }
        ], { duration: 3000, delay: idx * 200, easing: 'ease-in-out' });
        anim.onfinish = function() { ring.remove(); };
      })(i);
    }
    const blackhole = document.createElement("div");
    blackhole.className = "blackhole";
    blackhole.style.cssText = "position:fixed;left:" + centerX + "px;top:" + centerY + "px;width:0;height:0;background:radial-gradient(circle,#000 20%," + darkColor + " 50%," + color + " 70%,transparent 100%);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;box-shadow:0 0 60px " + color + ", inset 0 0 40px " + color + ";";
    document.body.appendChild(blackhole);
    const bhAnim = blackhole.animate([
      { width: '0px', height: '0px', opacity: 0 },
      { width: '80px', height: '80px', opacity: 1, offset: 0.2 },
      { width: '100px', height: '100px', opacity: 0.9, offset: 0.5 },
      { width: '80px', height: '80px', opacity: 0.9, offset: 0.7 },
      { width: '0px', height: '0px', opacity: 0 }
    ], { duration: 4000, easing: 'ease-in-out' });
    bhAnim.onfinish = function() { blackhole.remove(); disk.remove(); };
    const ball = document.createElement("div");
    ball.className = "flying-unique-ball " + colorClass;
    ball.textContent = String(targetNum).padStart(2, "0");
    ball.style.cssText = "position:fixed;left:" + endX + "px;top:" + endY + "px;transform:translate(-50%,-50%) scale(1);z-index:10000;";
    document.body.appendChild(ball);
    const startTime = performance.now();
    const phase1Duration = 2000;
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
        ], { duration: 500 }).onfinish = function() { trail.remove(); };
      }
      if (progress < 1) {
        activeFlyAnim = requestAnimationFrame(phase1);
      } else {
        ball.style.transform = "translate(-50%,-50%) scale(0)";
        ball.style.opacity = 0;
        setTimeout(function() {
          const phase2Start = performance.now();
          activeFlyAnim = requestAnimationFrame(phase2);
        }, 400);
      }
    }
    let phase2Start;
    const phase2Duration = 1600;
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
        jet.style.cssText = "position:fixed;left:" + currentX + "px;top:" + currentY + "px;width:3px;height:3px;background:" + color + ";border-radius:50%;pointer-events:none;z-index:9997;box-shadow:0 0 6px " + color + ";";
        document.body.appendChild(jet);
        const jetAngle = Math.random() * Math.PI * 2;
        const jetDist = 30 + Math.random() * 50;
        jet.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: 'translate(' + (Math.cos(jetAngle)*jetDist) + 'px,' + (Math.sin(jetAngle)*jetDist) + 'px) scale(0)', opacity: 0 }
        ], { duration: 600 }).onfinish = function() { jet.remove(); };
      }
      if (progress < 1) {
        activeFlyAnim = requestAnimationFrame(phase2);
      } else {
        activeFlyAnim = null;
        ball.remove();
        targetEl.classList.add("landing-shock", "flash-unique");
        setTimeout(function() { targetEl.classList.remove("landing-shock"); }, 400);
        showToast("🌌 黑洞吞噬：" + String(targetNum).padStart(2, "0") + " 号");
      }
    }
    activeFlyAnim = requestAnimationFrame(phase1);
  }

  // ======================== 结果渲染 ========================
  function renderResult(adjustedCount, adjustedTotal, unique, hitCounts, rawCount) {
    try {
      const container = DOM.result;
      if (!container) return;
      if (currentUniqueElement) { currentUniqueElement.classList.remove("flash-unique"); currentUniqueElement = null; }
      const freqMap = new Map();
      for (let n = 1; n <= 49; n++) {
        const f = adjustedCount[n];
        if (f > 0) { if (!freqMap.has(f)) freqMap.set(f, []); freqMap.get(f).push(n); }
      }
      const freqs = Array.from(freqMap.keys()).sort((a, b) => b - a);
      let killDrawn = false;
      const avg = unique ? (adjustedTotal / unique).toFixed(2) : "0.00";
      const unhitNumbers = [];
      for (let n = 1; n <= 49; n++) { if (adjustedCount[n] > 0 && hitCounts[n] === 0) unhitNumbers.push(n); }
      const isUniqueUnhit = (unhitNumbers.length === 1);
      const uniqueUnhitNum = isUniqueUnhit ? unhitNumbers[0] : null;
      const killSet = new Set(state.killNums);
      const sortedFreqMap = new Map();

      const fragment = document.createDocumentFragment();

      for (const f of freqs) {
        if (!killDrawn && f <= (adjustedTotal / unique)) {
          const killLine = document.createElement('div');
          killLine.className = "kill-line relative h-0.5 bg-gradient-to-r from-transparent via-[#00ffea] to-transparent my-3 rounded-full";
          fragment.appendChild(killLine);
          killDrawn = true;
        }

        const row = document.createElement('div');
        row.className = "flex items-start gap-1 mb-1 flex-wrap";

        const label = document.createElement('span');
        label.className = "text-xs text-green-500 font-mono min-w-[30px] pt-2";
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

      if (unique === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = "text-center py-8 text-amber-400";
        emptyDiv.textContent = "⚡ 所有号码频次归零，请调整筛选条件 ⚡";
        fragment.appendChild(emptyDiv);
      }

      const zeroCountNumbers = [];
      if (rawCount && rawCount.length) {
        for (let n = 1; n <= 49; n++) { if (rawCount[n] === 0) zeroCountNumbers.push(n); }
        if (zeroCountNumbers.length > 0) {
          if (!killDrawn) {
            const killLine = document.createElement('div');
            killLine.className = "kill-line relative h-0.5 bg-gradient-to-r from-transparent via-[#00ffea] to-transparent my-3 rounded-full";
            fragment.appendChild(killLine);
          }

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

      const totalLabel = FREQ_ADJ_ENABLED ? "调整后总次数" : "总次数";
      const avgLabel = FREQ_ADJ_ENABLED ? "调整后平均次数" : "平均次数";

      const statsDiv = document.createElement('div');
      statsDiv.className = "mt-4 grid grid-cols-3 gap-2 p-3 bg-transparent rounded-lg border border-[#00ffea]/20";

      const statItems = [
        { val: unique, label: "有效数字个数" },
        { val: adjustedTotal, label: totalLabel },
        { val: avg, label: avgLabel }
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
        currentUniqueElement = DOM.result.querySelector(`[data-num="${uniqueUnhitNum}"]`);
        if (lastUniqueNum !== uniqueUnhitNum) {
          lastUniqueNum = uniqueUnhitNum;
          const flyColor = numProps[uniqueUnhitNum] ? numProps[uniqueUnhitNum].color : getBallColor(uniqueUnhitNum);
          const flyColorClass = getColorClass(flyColor, false);
          setTimeout(() => launchUniqueFlyEffect(uniqueUnhitNum, flyColorClass), 100);
        }
      } else { lastUniqueNum = null; }

      lastAnalysisResult = { sortedFreqMap, adjustedTotal, unique, avg };
    } catch (err) {
      console.error("renderResult error:", err);
      if (DOM.result) DOM.result.innerHTML = '<div class="text-center py-8 text-red-400">渲染出错，请检查控制台</div>';
    }
  }

  function getBallColor(n) {
    if (numProps[n] && numProps[n].color) return numProps[n].color;
    const RED_SET = new Set(CATEGORIES.红波);
    const BLUE_SET = new Set(CATEGORIES.蓝波);
    if (RED_SET.has(n)) return "red";
    if (BLUE_SET.has(n)) return "blue";
    return "green";
  }
  const COLOR_CLASS_MAP = { red: "ball-red", green: "ball-green", blue: "ball-blue" };
  function getColorClass(color, isGray) {
    if (isGray) return "ball-gray";
    return COLOR_CLASS_MAP[color] || "ball-blue";
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

  // ========== 开奖相关变量 ==========
  let lastLotteryPeriod = "", isCurrentDrawComplete = false, isFetchingLottery = false;
  let fetchSeq = 0;
  let countdownTimer = null;
  let autoRefreshTimer = null;
  let inDrawWindowFlag = false;
  let lastDrawFetchTime = 0;
  let lastRegularFetchTime = 0;
  let _rollTimer = null;  // 摇奖滚动动画防重入

  function checkDrawComplete(item) {
    if (!item || !item.openCode) return false;
    const codes = String(item.openCode).split(",").filter(c => c.trim() !== "");
    return codes.length >= 7;
  }

  function getNextDrawTime() {
    const now = getBeijingDate();
    const draw = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 33, 30);
    if (now >= draw) draw.setDate(draw.getDate() + 1);
    return draw;
  }

  function updateCountdown() {
    if (!DOM.lotteryTime) return;
    // 离线模式：时间同步失败则显示警告并跳过倒计时
    if (timeSyncFailed) {
      DOM.lotteryTime.textContent = "⚠️ 离线模式";
      DOM.lotteryTime.style.color = "#fbbf24";
      return;
    }
    const now = getBeijingDate();
    const nextDraw = getNextDrawTime();
    const diff = nextDraw - now;
    if (diff <= 0) { DOM.lotteryTime.textContent = "开奖中..."; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    DOM.lotteryTime.textContent = "距开奖 " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    DOM.lotteryTime.style.color = ""; // 恢复默认颜色
  }

  // 安全 fetch 带超时和重试
  async function safeFetch(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), options.timeout || 8000);
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("json") && !ct.includes("text")) {
          throw new Error("Unexpected content-type: " + ct);
        }
        return res;
      } catch (e) {
        if (i === retries) throw e;
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  // 增强版波色标准化
  function normalizeWaveToColor(waveRaw, num) {
    if (waveRaw !== undefined && waveRaw !== null && waveRaw !== "") {
      const w = String(waveRaw).trim().toLowerCase();
      if (w.includes('红') || w === '1' || w === 'red') return 'red';
      if (w.includes('绿') || w === '2' || w === 'green') return 'green';
      if (w.includes('蓝') || w === '3' || w === 'blue') return 'blue';
    }
    if (num >= 1 && num <= 49) {
      const RED_SET = new Set(CATEGORIES.红波);
      const BLUE_SET = new Set(CATEGORIES.蓝波);
      if (RED_SET.has(num)) return 'red';
      if (BLUE_SET.has(num)) return 'blue';
      return 'green';
    }
    return 'blue';
  }

  // ======================== 开奖拉取和渲染 ========================
  async function fetchLottery() {
    const seq = ++fetchSeq;
    if (isFetchingLottery) return;
    isFetchingLottery = true;
    const btn = DOM.refreshLotteryBtn;
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) { btn.innerHTML = '<svg class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>加载中...'; btn.disabled = true; }
    try {
      const res = await safeFetch(API_CONFIG.live + "?_t=" + Date.now());
      const data = await res.json();
      if (seq !== fetchSeq) return;
      if (!Array.isArray(data) || !data[0]) { showToast("暂无开奖数据"); return; }
      const item = data[0];
      if (!item.expect || !item.openCode || typeof item.openCode !== "string") {
        throw new Error("Invalid lottery data structure: missing expect or openCode");
      }
      if (!item.openCode || typeof item.openCode !== "string") { showToast("数据字段不完整"); return; }
      try { safeSetItem(LS_CACHE_KEY, JSON.stringify({ data, time: Date.now() })); } catch (e) {}
      const isNewPeriod = lastLotteryPeriod !== item.expect;
      if (isNewPeriod) {
        lastLotteryPeriod = item.expect;
        isCurrentDrawComplete = false;
      }
      renderLottery(item);
      if (checkDrawComplete(item)) {
        if (!isCurrentDrawComplete) { isCurrentDrawComplete = true; showToast("当期开奖已完成"); }
        else if (isNewPeriod) { isCurrentDrawComplete = true; showToast("新期号已更新"); }
      }
      if (DOM.lastRefreshTime) DOM.lastRefreshTime.textContent = "上次刷新：" + new Date().toLocaleTimeString();
    } catch (e) {
      console.error("fetchLottery error:", e);
      try {
        const cacheRaw = localStorage.getItem(LS_CACHE_KEY);
        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw);
          if (cache.data && cache.data[0]) { renderLottery(cache.data[0]); showToast("离线模式：显示缓存数据"); return; }
        }
      } catch (cacheErr) {}
      showToast("获取开奖失败");
    } finally {
      isFetchingLottery = false;
      if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
    }
  }

  // 号码球数字滚动动画（摇奖机效果），防重入
  function rollBallNumbers(duration) {
    if (_rollTimer) return; // 防重入

    const ballItems = DOM.lotteryBalls.querySelectorAll('.result-ball');
    if (ballItems.length === 0) return;

    // 停掉入场动画，让球静止
    ballItems.forEach(function(ball) {
      ball.style.animation = 'none';
      ball.style.opacity = '1';
      ball.style.transform = 'scale(1) rotate(0deg)';
    });

    // 每60ms随机数字
    const rollInterval = setInterval(function() {
      ballItems.forEach(function(ball) {
        const randomNum = Math.floor(Math.random() * 49) + 1;
        const textNode = ball.childNodes[0];
        if (textNode && textNode.nodeType === 3 /* Node.TEXT_NODE */) {
          textNode.textContent = String(randomNum).padStart(2, '0');
        }
      });
    }, 60);

    _rollTimer = rollInterval;

    setTimeout(function() {
      clearInterval(rollInterval);
      _rollTimer = null;

      // 恢复最终数字
      ballItems.forEach(function(ball) {
        const finalNum = ball.dataset.finalNum;
        if (finalNum) {
          const textNode = ball.childNodes[0];
          if (textNode && textNode.nodeType === 3) {
            textNode.textContent = finalNum;
          }
        }
      });

      // 逐个触发入场动画
      ballItems.forEach(function(ball, idx) {
        setTimeout(function() {
          ball.style.animation = '';
          void ball.offsetHeight;
          ball.style.animation = 'ballAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        }, idx * 80);
      });
    }, duration);
  }

  function renderLottery(item) {
    const codesRaw = String(item.openCode || "").split(",").map(c => c.trim());
    const wavesRaw = String(item.wave || "").split(",").map(w => w.trim());
    const codes = codesRaw.filter(c => /^\d+$/.test(c) && Number(c) >= 1 && Number(c) <= 49);

    if (DOM.lotteryPeriod) DOM.lotteryPeriod.textContent = escapeHtml(item.expect || "--");
    if (DOM.lotteryTime) {
      const rawTime = item.openTime || "--";
      const timeStr = typeof rawTime === 'string' ? rawTime.replace(" ", "\n") : String(rawTime);
      DOM.lotteryTime.textContent = escapeHtml(timeStr);
    }

    const colors = codes.map((code, idx) => {
      const num = parseInt(code, 10);
      const waveVal = idx < wavesRaw.length ? wavesRaw[idx] : "";
      return normalizeWaveToColor(waveVal, num);
    });
    const zodiacs = codes.map(c => {
      const n = parseInt(c, 10);
      if (isNaN(n) || n < 1 || n > 49) return "";
      return (numProps[n] && numProps[n].shengXiao) || "";
    });
    const wxClassMap = { "金": "wx-gold", "木": "wx-wood", "水": "wx-water", "火": "wx-fire", "土": "wx-earth" };
    const lotteryYear = getBeijingDate().getFullYear();

    const existingBalls = DOM.lotteryBalls ? DOM.lotteryBalls.querySelectorAll('.result-ball').length : 0;
    if (lastLotteryPeriod === item.expect && existingBalls === codes.length && existingBalls > 0) {
      rollBallNumbers(900);
      return;
    }

    if (lastLotteryPeriod !== item.expect) {
      lastLotteryPeriod = item.expect;
      isCurrentDrawComplete = false;
    }

    const container = DOM.lotteryBalls;
    if (!container) return;
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
      ball.appendChild(document.createTextNode(codes[idx].padStart(2, "0")));
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
      const wx = (num >= 1 && num <= 49) ? (getFive(num, lotteryYear) || "?") : "?";
      container.appendChild(createBall(num, colorClass, zodiacs[i], wx, i));
    }
    if (codes.length >= 7) {
      const plus = document.createElement("div");
      plus.className = "result-plus-sign";
      plus.textContent = "+";
      container.appendChild(plus);
      const num = parseInt(codes[6], 10);
      const colorClass = { red: "result-ball-red", green: "result-ball-green", blue: "result-ball-blue" }[colors[6]] || "result-ball-blue";
      const wx = (num >= 1 && num <= 49) ? (getFive(num, lotteryYear) || "?") : "?";
      container.appendChild(createBall(num, colorClass, zodiacs[6], wx, 6));
    }
    void container.offsetHeight;
    rollBallNumbers(900);
  }

  // ========== 历史记录 ==========
  let currentHistoryData = [], currentHistorySorted = [], currentHistoryPage = 1;

  function renderBallsHTML(codes, waves, zodiacs, year) {
    year = Number(year) || CURRENT_YEAR;
    let html = "";
    codes.forEach((code, i) => {
      const num = parseInt(code, 10);
      const waveVal = i < waves.length ? waves[i] : "";
      const colorKey = normalizeWaveToColor(waveVal, num);
      const cc = colorKey === "red" ? "history-ball-red" : (colorKey === "green" ? "history-ball-green" : "history-ball-blue");
      const five = (num >= 1 && num <= 49) ? getFive(num, year) : "";
      html += `<div class="history-ball-card ${cc}"><div class="history-ball-number">${escapeHtml(code)}</div><div class="history-ball-tag">${escapeHtml(zodiacs[i] || "")}/${escapeHtml(five)}</div></div>`;
      if (i === 5) html += '<span class="history-plus-sign">+</span>';
    });
    return html;
  }

  function ensureHistorySorted() {
    if (currentHistorySorted.length > 0) return;
    const seen = new Set();
    const unique = [];
    for (const item of currentHistoryData) {
      if (item && item.expect && !seen.has(item.expect)) { seen.add(item.expect); unique.push(item); }
    }
    currentHistorySorted = unique.sort((a, b) => String(b.expect).localeCompare(String(a.expect), undefined, { numeric: true }));
  }

  function loadHistoryData(year) {
    if (!year) return;
    historyYearLoaded = Number(year);
    const loadDiv = document.getElementById("historyLoading");
    const cont = document.getElementById("historyContent");
    const sel = document.getElementById("historyYear");
    if (sel) sel.value = year;
    if (loadDiv) loadDiv.classList.remove("dhidden");
    (async () => {
      try {
        if (historyCache[year]) currentHistoryData = historyCache[year];
        else {
          const res = await safeFetch(API_CONFIG.historyBase + year);
          const json = await res.json();
          if (json.code === 200 && Array.isArray(json.data)) { currentHistoryData = json.data; historyCache[year] = json.data; saveHistoryCache(); }
          else currentHistoryData = [];
        }
        currentHistorySorted = []; currentHistoryPage = 1; renderHistoryPage(); saveHistoryCache();
      } catch (e) { currentHistoryData = []; if (cont) cont.innerHTML = '<div style="color:#f87171;">加载失败</div>'; }
      finally { if (loadDiv) loadDiv.classList.add("dhidden"); }
    })();
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
      for (const item of pageData) {
        const expect = escapeHtml(item.expect || "");
        let ballsHtml = "";
        if (item.openCode && item.openCode.trim()) {
          const codes = item.openCode.split(",").map(c => escapeHtml(c.trim()));
          const waves = (item.wave || "").split(",").map(w => w.trim());
          const zodiacs = (item.zodiac || "").split(",").map(z => z.trim());
          const recordYear = historyYearLoaded || CURRENT_YEAR;
          ballsHtml = renderBallsHTML(codes, waves, zodiacs, recordYear);
        } else {
          ballsHtml = '<div style="display:flex; justify-content:center; align-items:center; padding:24px 0; color:#fbbf24; font-size:14px; font-weight:500;">待开奖</div>';
        }
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `<div class="history-item-header">第${escapeHtml(expect.slice(4))}期 · ${escapeHtml(item.openTime && item.openTime.slice(5, 16) || "")}</div><div class="history-balls-row">${ballsHtml}</div>`;
        frag.appendChild(div);
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
    } catch (e) {
      console.error("renderHistoryPage error:", e);
      const cont = document.getElementById("historyContent");
      if (cont) cont.innerHTML = '<div style="color:#f87171;">历史加载失败</div>';
    }
  }

  // ======================== DrawerSystem ========================
  const DrawerSystem = {
    current: null,
    templates: {
      shama: () => `<textarea id="kill-input" rows="3" class="dinput">${state.killNums.join(" ")}</textarea>`,
      shengxiao: () => {
        const sxs = ["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"];
        const sel = state.selectedFilters.shengxiao;
        return '<div class="dgrid-6">' + sxs.map(sx => `<label><input type="checkbox" class="filter-checkbox hidden" value="生肖${sx}" data-drawer="shengxiao" ${sel.includes("生肖"+sx)?"checked":""}><span class="filter-label dbtn">${sx}</span></label>`).join("") + "</div>";
      },
      haomatou: () => {
        const heads = [["0头单","1头单","2头单","3头单","4头单"],["0头双","1头双","2头双","3头双","4头双"]];
        const sel = state.selectedFilters.haomatou;
        return heads.map(row => '<div class="dflex">' + row.map(h => `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${h}" data-drawer="haomatou" ${sel.includes(h)?"checked":""}><span class="filter-label dbtn dbtn-sm">${h}</span></label>`).join("") + "</div>").join("");
      },
      weishu: () => {
        const tails = [["0尾","1尾","2尾","3尾","4尾"],["5尾","6尾","7尾","8尾","9尾"]];
        const sel = state.selectedFilters.weishu;
        return tails.map(row => '<div class="dflex">' + row.map(t => `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${t}" data-drawer="weishu" ${sel.includes(t)?"checked":""}><span class="filter-label dbtn dbtn-sm">${t}</span></label>`).join("") + "</div>").join("");
      },
      shuduan: () => {
        const duans = ["1段","2段","3段","4段","5段","6段","7段"];
        const sel = state.selectedFilters.shuduan;
        return '<div class="dflex-wrap">' + duans.map(d => `<label><input type="checkbox" class="filter-checkbox hidden" value="${d}" data-drawer="shuduan" ${sel.includes(d)?"checked":""}><span class="filter-label dbtn dbtn-md">${d}</span></label>`).join("") + "</div>";
      },
      bose: () => {
        const items = [["红波单","蓝波单","绿波单"],["红波双","蓝波双","绿波双"]];
        const sel = state.selectedFilters.bose;
        return items.map(row => '<div class="dflex">' + row.map(item => `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${item}" data-drawer="bose" ${sel.includes(item)?"checked":""}><span class="filter-label dbtn dbtn-sm">${item.replace("波","")}</span></label>`).join("") + "</div>").join("");
      },
      wuxing: () => {
        const table = generateWuxing(CURRENT_YEAR);
        const wx = {};
        const entries = Object.entries(table);
        for (let ei = 0; ei < entries.length; ei++) { const ek = entries[ei][0], ev = entries[ei][1]; wx[ek] = ev.map(function(n) { return String(n).padStart(2,'0'); }).join(' '); }
        const sel = state.selectedFilters.wuxing;
        return '<div class="dspace-y">' + Object.entries(wx).map(([k,v]) => `<div class="wuxing-row"><label class="ditems-center" style="gap:8px;min-width:0;flex-shrink:0;"><input type="checkbox" class="filter-checkbox hidden" value="${k}" data-drawer="wuxing" ${sel.includes(k)?"checked":""}><span class="filter-label dbtn dbtn-fixed wuxing-btn-fixed">${k}</span></label><span class="wuxing-nums">${v}</span></div>`).join("") + "</div>";
      },
      bandanshuang: () => {
        const items = [["合数单","小单","大单"],["合数双","小双","大双"]];
        const sel = state.selectedFilters.bandanshuang;
        return items.map(row => '<div class="dflex">' + row.map(item => `<label class="dflex-1"><input type="checkbox" class="filter-checkbox hidden" value="${item}" data-drawer="bandanshuang" ${sel.includes(item)?"checked":""}><span class="filter-label dbtn dbtn-sm">${item}</span></label>`).join("") + "</div>").join("");
      },
      heshu: () => {
        const hes = Array.from({ length: 13 }, (_, i) => (i + 1) + "合");
        const sel = state.selectedFilters.heshu;
        return '<div class="dgrid-4">' + hes.map(h => `<label><input type="checkbox" class="filter-checkbox hidden" value="${h}" data-drawer="heshu" ${sel.includes(h)?"checked":""}><span class="filter-label dbtn dbtn-sm">${h}</span></label>`).join("") + "</div>";
      },
      history: () => {
        let opts = "";
        for (let y = getBeijingDate().getFullYear(); y >= 2020; y--) opts += `<option value="${y}">${y}年</option>`;
        return [
          '<div>',
            `<select id="historyYear" class="dselect"><option value="">选择年份</option>${opts}</select>`,
            '<div id="historyLoading" class="dhidden dtext-center dpy-4"><svg class="animate-spin" style="width:24px;height:24px;margin:0 auto;color:#00ffea;" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>',
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
      DOM.drawer_title.textContent = titles[type] || "筛选器";
      const contentDiv = DOM.drawer_content;
      if (!contentDiv) { showToast("抽屉初始化失败"); return; }
      contentDiv.innerHTML = this.templates[type] ? this.templates[type]() : "<p>暂无内容</p>";
      DOM.drawer_overlay.classList.remove("hidden");
      DOM.drawer_overlay.style.display = "block";
      setTimeout(() => { DOM.drawer_overlay.classList.remove("opacity-0"); DOM.drawer_overlay.style.opacity = "1"; }, 10);
      DOM.drawer_container.classList.add("open");
      this.updateNavState(type);
      if (type === "history") {
        const now = getBeijingDate();
        const currentYear = now.getFullYear();
        const today2135 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 35, 0).getTime();
        const nowTs = now.getTime();
        let shouldClearCache = true;
        if (window._lastHistoryOpenTime) {
          const lastTs = window._lastHistoryOpenTime;
          if (lastTs < today2135 && nowTs < today2135) {
            shouldClearCache = false;
          }
        }
        window._lastHistoryOpenTime = nowTs;
        if (shouldClearCache && historyCache[currentYear]) {
          delete historyCache[currentYear];
          saveHistoryCache();
        }
        loadHistoryData(String(currentYear));
      }
    },
    close() {
      DOM.drawer_container.classList.remove("open");
      DOM.drawer_overlay.classList.add("opacity-0");
      DOM.drawer_overlay.style.opacity = "0";
      setTimeout(() => { DOM.drawer_overlay.classList.add("hidden"); DOM.drawer_overlay.style.display = "none"; }, 300);
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
          setKillNums(parsed.nums.filter(n => n >= 1 && n <= 49));
        }
      });
      content.addEventListener("click", e => {
        if (e.target.closest("#history-prev")) { if (currentHistoryPage > 1) { currentHistoryPage--; renderHistoryPage(); } }
        else if (e.target.closest("#history-next")) { ensureHistorySorted(); if (currentHistoryPage < Math.ceil(currentHistorySorted.length / HISTORY_PAGE_SIZE)) { currentHistoryPage++; renderHistoryPage(); } }
      });
    },
    updateNavState(activeType) {
      const navItems = document.querySelectorAll(".nav-item");
      for (let ni = 0; ni < navItems.length; ni++) {
        const el = navItems[ni];
        const dr = el.dataset.drawer;
        if (dr === activeType) { el.classList.add("active"); el.classList.remove("bg-transparent", "text-gray-400"); }
        else { el.classList.remove("active"); if (dr !== "selectnone") el.classList.add("bg-transparent", "text-gray-400"); }
      }
    }
  };

  function copyResult() {
    if (!lastAnalysisResult) { showToast("暂无分析结果"); return; }
    let text = "";
    lastAnalysisResult.sortedFreqMap.forEach((nums, f) => { text += `${f}次：${nums.map(n => String(n).padStart(2, "0")).join(" ")}\n`; });
    if (!text.trim()) {
      showToast("暂无可复制内容");
      return;
    }
    fallbackCopy(text.trim());
  }
  function copyNumber(n) { fallbackCopy(String(n).padStart(2, "0")); }
  function fallbackCopy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast("已复制")).catch(() => execCopy(text));
    } else execCopy(text);
  }
  function execCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px"; document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, text.length);
    try { document.execCommand("copy"); showToast("已复制"); } catch (e) { showToast("复制失败"); }
    document.body.removeChild(ta);
  }
  window.copyResult = copyResult;

  // ======================== 健壮自动刷新系统 ========================
  function initAutoRefresh() {
    // 只有时间同步成功才启动倒计时定时器
    if (!timeSyncFailed) {
      countdownTimer = setInterval(updateCountdown, 1000);
    }
    // 但轮询和开奖窗口检测始终运行
    checkDrawWindow();
    autoRefreshTimer = setInterval(checkDrawWindow, 4000);
    const regularPollTimer = setInterval(regularPoll, 60000);

    const _onForeground = function() {
      setTimeout(function() { fetchLottery(); }, 300);
    };
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') _onForeground();
    });
    window.addEventListener('pageshow', function(e) {
      if (e.persisted || document.visibilityState === 'visible') _onForeground();
    });
    window._shenmaTimers = { countdownTimer, autoRefreshTimer, regularPollTimer };
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
      if (elapsed >= DRAW_POLL_MS) {
        lastDrawFetchTime = Date.now();
        fetchLottery();
      }
    }
  }

  function regularPoll() {
    if (inDrawWindowFlag) return;
    const elapsed = Date.now() - lastRegularFetchTime;
    if (elapsed >= DRAW_REGULAR_MS) {
      lastRegularFetchTime = Date.now();
      fetchLottery();
    }
  }

  // ======================== 启动画面 ========================
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
      setTimeout(function() {
        splash.style.display = 'none';
        try { window.dispatchEvent(new Event('resize')); } catch(e) {}
      }, 800);
    }
    const forceTimeout = setTimeout(function() {
      if (!switched) {
        console.warn('[启动画面] 强制超时进入主程序');
        switchToMain();
      }
    }, 5000);

    const finalText = "神码再现";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
    const textContainer = document.getElementById('text-scramble');
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');
    let isLoaded = false;

    function initText() {
      if (!textContainer) return;
      textContainer.innerHTML = '';
      finalText.split('').forEach((char) => {
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
      let animationFrame = 0;
      const totalFrames = 60;
      function step() {
        coreSpans.forEach((span, index) => {
          if (animationFrame > index * 5) {
            if (animationFrame < totalFrames) {
              span.textContent = chars[Math.floor(Math.random() * chars.length)];
            } else {
              span.textContent = finalText[index];
            }
          }
        });
        animationFrame++;
        if (animationFrame <= totalFrames + 10) {
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
      const xRel = e.clientX - rect.left;
      const yRel = e.clientY - rect.top;
      textContainer.style.setProperty('--x', xRel + 'px');
      textContainer.style.setProperty('--y', yRel + 'px');
    });

    function simulateLoading() {
      initText();
      animateText();
      let progress = 0;
      const duration = 3000;
      const interval = 50;
      const step = 100 / (duration / interval);
      const timer = setInterval(() => {
        progress += step + Math.random() * 2;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          finishLoading();
        }
        if (progressBar) progressBar.style.width = progress + '%';
        if (loadingText) loadingText.textContent = 'SYSTEM INITIALIZING... ' + Math.floor(progress) + '%';
      }, interval);
    }

    function finishLoading() {
      clearTimeout(forceTimeout);
      isLoaded = true;
      if (loadingText) {
        loadingText.textContent = 'ACCESS GRANTED';
        loadingText.style.color = '#00f3ff';
      }
      if (progressBar) progressBar.style.boxShadow = '0 0 20px #00f3ff';
      setTimeout(switchToMain, 800);
    }

    simulateLoading();
  }

  // ======================== 初始化 ========================
  async function init() {
    try {
      await Promise.race([syncTime(), new Promise(r => setTimeout(r, 3000))]);
      cacheDOM(); loadState(); loadHistoryCache(); subscribe(onStateChange); initResultDelegation(); DrawerSystem.bindGlobalDelegation();
      if (DOM.exampleBtn) DOM.exampleBtn.addEventListener("click", function() { DOM.numbers.value = "龍蛇馬 12 25 36 8 17 29 41 5 19 33 47"; runAnalysis(); saveInputCache(); });
      if (DOM.clearBtn) DOM.clearBtn.addEventListener("click", function() { DOM.numbers.value = ""; runAnalysis(); saveInputCache(); showToast("已清空输入"); });
      if (DOM.copyResultBtn) DOM.copyResultBtn.addEventListener("click", copyResult);
      if (DOM.numbers) DOM.numbers.addEventListener("input", function() { runAnalysis(); saveInputCache(); });
      if (DOM.refreshLotteryBtn) DOM.refreshLotteryBtn.addEventListener("click", function() { fetchLottery(); });
      const navBtns = document.querySelectorAll(".nav-item");
      for (let nb = 0; nb < navBtns.length; nb++) {
        const btn = navBtns[nb];
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          const drawer = btn.dataset.drawer;
          if (drawer === "selectnone") { clearAllFilters(); DrawerSystem.close(); showToast("已清空所有筛选"); }
          else DrawerSystem.open(drawer);
        });
      }
      if (DOM.drawer_close) DOM.drawer_close.addEventListener("click", () => DrawerSystem.close());
      if (DOM.drawer_overlay) DOM.drawer_overlay.addEventListener("click", () => DrawerSystem.close());
      loadInputCache();
      fetchLottery(); runAnalysis(); initAutoRefresh();
      window.addEventListener("beforeunload", () => {
        const t = window._shenmaTimers || {};
        if (t.countdownTimer) clearInterval(t.countdownTimer);
        if (t.autoRefreshTimer) clearInterval(t.autoRefreshTimer);
        if (t.regularPollTimer) clearInterval(t.regularPollTimer);
      });
      if (window.__DEBUG__) console.log("%c✅ 神码再现 v3.7.14 离线模式修复版已加载", "color:#00ffea;font-weight:bold");
    } catch (e) { console.error("初始化失败:", e); }
    initSplashScreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ======================== 设置菜单 ========================
  (function () {
    "use strict";
    // 全局 FREQ_ADJ_ENABLED 已在上面定义，这里只是绑定 UI

    function _safeSetItem(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch (e) { if (e.name === 'QuotaExceededError') console.warn('[localStorage] 设置存储已满'); return false; }
    }

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const freqAdjToggle = document.getElementById('freqAdjToggle');
    const settingsTheme = document.getElementById('settingsTheme');

    // 加载保存的状态
    try {
      const saved = localStorage.getItem('shenma_freq_adj');
      if (saved !== null) {
        const val = JSON.parse(saved);
        if (val && typeof val.enabled === 'boolean') {
          FREQ_ADJ_ENABLED = val.enabled;
          if (freqAdjToggle) freqAdjToggle.checked = val.enabled;
        }
      }
    } catch (e) {}

    function positionDropdown() {
      if (!settingsBtn || !settingsDropdown) return;
      const rect = settingsBtn.getBoundingClientRect();
      const dropdownWidth = 200;
      const dropdownHeight = settingsDropdown.offsetHeight || 120;
      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 6;
      if (left < 8) left = 8;
      if (top + dropdownHeight > window.innerHeight - 8) {
        top = rect.top - dropdownHeight - 6;
      }
      settingsDropdown.style.left = left + 'px';
      settingsDropdown.style.top = top + 'px';
    }

    function openDropdown() {
      if (!settingsDropdown || !settingsBtn) return;
      settingsBtn.classList.add('spin');
      setTimeout(function () { settingsBtn.classList.remove('spin'); }, 600);
      settingsDropdown.classList.add('open');
      positionDropdown();
    }

    function closeDropdown() {
      if (!settingsDropdown) return;
      settingsDropdown.classList.remove('open');
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (settingsDropdown.classList.contains('open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });
    }

    if (settingsDropdown) {
      settingsDropdown.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }

    document.addEventListener('click', function (e) {
      if (settingsDropdown && settingsDropdown.classList.contains('open')) {
        if (!settingsDropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
          closeDropdown();
        }
      }
    });

    window.addEventListener('scroll', function () {
      if (settingsDropdown && settingsDropdown.classList.contains('open')) {
        closeDropdown();
      }
    }, true);
    window.addEventListener('resize', function () {
      if (settingsDropdown && settingsDropdown.classList.contains('open')) {
        positionDropdown();
      }
    });

    if (freqAdjToggle) {
      freqAdjToggle.addEventListener('change', function () {
        FREQ_ADJ_ENABLED = freqAdjToggle.checked;
        try {
          _safeSetItem('shenma_freq_adj', JSON.stringify({ enabled: freqAdjToggle.checked, _t: Date.now() }));
        } catch (e) {}
        // 重新分析以应用新设置
        const numbersEl = document.getElementById('numbers');
        if (numbersEl) {
          const event = new Event('input', { bubbles: true });
          numbersEl.dispatchEvent(event);
        }
      });
    }

    if (settingsTheme) {
      settingsTheme.addEventListener('click', function () {
        // 待开发
      });
    }

    if (window.__DEBUG__) console.log("%c✅ 设置菜单已加载", "color:#00ffea;font-weight:bold");
  })();

})();