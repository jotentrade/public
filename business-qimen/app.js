const engineUrl = "https://xuanlong-azajyanf.manus.space/";

const eventPresets = [
  "央行利率訊號",
  "美元與黃金背離",
  "AI 科技股輪動",
  "能源價格異動",
  "地緣政治升溫",
  "台股權值股觀察",
];

const scoreLabels = [
  "市場攻擊力",
  "避險壓力",
  "資金流入",
  "波動風險",
  "科技題材熱度",
  "能源壓力",
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function updateClock() {
  $("#clock").textContent = new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function tone(id) {
  return Number($(`#${id}`).value);
}

function activeTheme() {
  return $("input[name='theme']:checked").value;
}

function calculateScores() {
  const equity = tone("equityTone");
  const dollar = tone("dollarTone");
  const gold = tone("goldTone");
  const tech = tone("techTone");
  const energy = tone("energyTone");
  const vol = tone("volTone");
  const theme = activeTheme();

  const themeBoost = {
    equity: [8, -3, 6, 1, 3, 0],
    fx: [0, 4, -2, 3, 0, 0],
    gold: [-3, 9, 1, 4, -2, 0],
    tech: [5, -1, 4, 2, 12, 0],
    energy: [-1, 3, 1, 5, 0, 12],
  }[theme];

  const raw = [
    58 + equity * 14 + tech * 5 - vol * 4,
    48 + gold * 13 + dollar * 8 + vol * 14 - equity * 7,
    52 + equity * 10 + tech * 7 - dollar * 4,
    46 + vol * 18 + energy * 8 + gold * 4,
    50 + tech * 18 + equity * 5,
    44 + energy * 20 + dollar * 4 + vol * 3,
  ];

  return raw.map((value, index) => Math.max(5, Math.min(95, Math.round(value + themeBoost[index]))));
}

function renderScores() {
  const scores = calculateScores();
  $("#scoreList").innerHTML = scoreLabels
    .map(
      (label, index) => `
        <div class="score-row">
          <div class="score-meta"><span>${label}</span><strong>${scores[index]}</strong></div>
          <div class="score-track"><div class="score-fill" style="width: ${scores[index]}%"></div></div>
        </div>
      `,
    )
    .join("");
  return scores;
}

function marketBias(scores) {
  const attack = scores[0];
  const hedge = scores[1];
  const volatility = scores[3];

  if (hedge >= 70 || volatility >= 75) return "防守優先";
  if (attack >= 70 && hedge < 62) return "順勢進攻";
  return "中性觀察";
}

function themeName(theme) {
  return {
    equity: "股市 / 指數",
    fx: "匯率 / 美元",
    gold: "黃金 / 避險",
    tech: "科技 / AI 題材",
    energy: "能源 / 商品",
  }[theme];
}

function generateBrief() {
  const scores = renderScores();
  const bias = marketBias(scores);
  const events = $("#eventInput").value.trim() || "尚未輸入重大事件，請先以市場數據與盤象做初步判讀。";
  const theme = activeTheme();
  const riskText = scores[3] >= 75 ? "波動風險偏高，倉位與停損要先設定。" : "波動尚可控，可等待盤象與價格同步。";
  const capitalText = scores[2] >= 60 ? "資金流入條件轉佳，可觀察強勢板塊延續。" : "資金流入不足，避免只憑題材追價。";
  const qimenText = "請在中央炫龍奇門排盤引擎起盤後，對照值符、值使、門星神組合，再決定是否提高策略權重。";

  $("#briefOutput").innerHTML = `
    <div class="brief-card"><strong>市場基調：</strong>${bias}</div>
    <div class="brief-card"><strong>用神主題：</strong>${themeName(theme)}</div>
    <div class="brief-card"><strong>事件焦點：</strong>${events}</div>
    <div class="brief-card"><strong>資本流判斷：</strong>${capitalText}</div>
    <div class="brief-card"><strong>風控提醒：</strong>${riskText}</div>
    <div class="brief-card"><strong>盤象接法：</strong>${qimenText}</div>
  `;
}

function addPresetChips() {
  $("#eventChips").innerHTML = eventPresets
    .map((item) => `<button class="chip" type="button" data-event="${item}">${item}</button>`)
    .join("");

  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const current = $("#eventInput").value.trim();
      $("#eventInput").value = current ? `${current}\n${chip.dataset.event}` : chip.dataset.event;
    });
  });
}

function saveReview() {
  const record = {
    time: new Date().toISOString(),
    direction: $("#actualDirection").value,
    hit: $("#hitLevel").value,
    note: $("#reviewNote").value.trim() || "未填寫補充說明",
    scores: calculateScores(),
  };
  const history = JSON.parse(localStorage.getItem("business-qimen-reviews") || "[]");
  history.unshift(record);
  localStorage.setItem("business-qimen-reviews", JSON.stringify(history.slice(0, 8)));
  $("#reviewNote").value = "";
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("business-qimen-reviews") || "[]");
  if (!history.length) {
    $("#reviewHistory").innerHTML = '<div class="history-item">尚無驗證紀錄。</div>';
    return;
  }
  $("#reviewHistory").innerHTML = history
    .map((item) => {
      const time = new Intl.DateTimeFormat("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(item.time));
      return `
        <div class="history-item">
          <strong>${time}</strong> · 方向：${item.direction} · 命中：${item.hit}<br />
          ${item.note}
        </div>
      `;
    })
    .join("");
}

function bindEvents() {
  $("#openEngine").addEventListener("click", () => window.open(engineUrl, "_blank", "noopener,noreferrer"));
  $("#generateBrief").addEventListener("click", generateBrief);
  $("#saveReview").addEventListener("click", saveReview);
  $$("select, input[name='theme']").forEach((control) => control.addEventListener("change", renderScores));
}

function init() {
  updateClock();
  setInterval(updateClock, 30000);
  addPresetChips();
  bindEvents();
  renderScores();
  renderHistory();
}

init();
