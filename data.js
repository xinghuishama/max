// ======================== data.js — 静态数据与号码属性预计算 v3.6 ========================
// 版本特性：
// 1. 自动生肖（澳门六合彩规则，跨年自动更新）
// 2. 与 worker.js 完全同步
// 3. 五行 / 波色 / 数段保持原版
// 4. numProps 预计算保持原版

(function () {
  "use strict";

  const MAX_NUMBERS = 5000;

  // ======================== 自动生肖（澳门六合彩规则） ========================
  // 生肖顺序固定：龙→蛇→马→羊→猴→鸡→狗→猪→鼠→牛→虎→兔
  // 2024 = 龙年（基准）
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

    // 以当年生肖为首，生成顺序
    const ordered = [];
    for (let i = 0; i < 12; i++) {
      ordered.push(seq[(startIndex + i + 12) % 12]);
    }

    // 生成号码表
    const map = {};
    let num = 1;
    for (let i = 0; i < 12; i++) {
      const name = ordered[i];
      map[name] = [];
      for (let j = 0; j < 4; j++) {
        map[name].push(num++);
      }
    }

    // 49 属于当年生肖
    map[getCurrentZodiac()].push(49);

    return map;
  }

  // 自动生成生肖号码表
  const SHENGXIAO = buildZodiacMap();

  // ======================== 五行与波色分类（保持原版） ========================
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

  // ======================== 数段定义（保持原版） ========================
  const DUAN = {
    "1段": [1, 2, 3, 4, 5, 6, 7],
    "2段": [8, 9, 10, 11, 12, 13, 14],
    "3段": [15, 16, 17, 18, 19, 20, 21],
    "4段": [22, 23, 24, 25, 26, 27, 28],
    "5段": [29, 30, 31, 32, 33, 34, 35],
    "6段": [36, 37, 38, 39, 40, 41, 42],
    "7段": [43, 44, 45, 46, 47, 48, 49]
  };

  // ======================== 预计算号码属性 ========================
  const numProps = new Array(50);
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

  // 暴露到全局
  window.APP_DATA = {
    MAX_NUMBERS,
    SHENGXIAO,
    CATEGORIES,
    DUAN,
    numProps
  };
})();