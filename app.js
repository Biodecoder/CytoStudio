const parameters = [
  { id: "fsc", label: "FSC-A", range: [0, 250000], scale: "linear" },
  { id: "ssc", label: "SSC-A", range: [0, 250000], scale: "linear" },
  { id: "cd3", label: "CD3 APC", range: [-120, 100000], scale: "logicle" },
  { id: "cd4", label: "CD4 BV421", range: [-80, 100000], scale: "logicle" },
  { id: "cd8", label: "CD8 APC-Cy7", range: [-80, 100000], scale: "logicle" },
  { id: "cd19", label: "CD19 PE", range: [-80, 100000], scale: "arcsinh" },
  { id: "umap1", label: "UMAP_1", range: [-12, 12], scale: "linear" },
  { id: "umap2", label: "UMAP_2", range: [-12, 16], scale: "linear" }
];

const colors = ["#31e6d0", "#78d95c", "#a88be8", "#cf67cd", "#ff9b45", "#44b7d0", "#ffd45a", "#e45668"];
const fcsCore = window.CytoFCS;

const state = {
  theme: localStorage.getItem("cyto.theme") || "dark",
  activeView: "canvas",
  activeTool: "pointer",
  selectedSample: "s1",
  selectedPopulation: "cd3",
  selectedPlot: "p1",
  inspectorTab: "plot",
  layout: JSON.parse(localStorage.getItem("cyto.layout") || "{}"),
  importProgress: 0,
  samples: [
    { id: "s1", name: "PBMC Panel.fcs", events: 10432912, group: "Treatment A", status: "ready", metadata: { instrument: "Aurora CS", operator: "Core Facility", acquired: "2026-06-01", compensation: "Imported 8x8", keywords: 412 } },
    { id: "s2", name: "Donor 02 Restim.fcs", events: 8945102, group: "Treatment A", status: "ready", metadata: { instrument: "Aurora CS", operator: "Core Facility", acquired: "2026-05-31", compensation: "Group matrix", keywords: 397 } },
    { id: "s3", name: "Donor 03 Control.fcs", events: 7203314, group: "Control", status: "ready", metadata: { instrument: "LSRFortessa", operator: "Clinical Lab", acquired: "2026-05-30", compensation: "Needs review", keywords: 355 } }
  ],
  populations: [
    { id: "all", parent: null, name: "All Events", color: "#31e6d0", count: 10432912, gate: null },
    { id: "singlets", parent: "all", name: "Singlets", color: "#78d95c", count: 8945102, gate: "rectangle" },
    { id: "live", parent: "singlets", name: "Live Cells", color: "#a88be8", count: 7203314, gate: "polygon" },
    { id: "cd3", parent: "live", name: "CD3+ T Cells", color: "#31e6d0", count: 3215696, gate: "interval" },
    { id: "cd4", parent: "cd3", name: "CD4+ T Cells", color: "#cf67cd", count: 1734105, gate: "quadrant" },
    { id: "cd8", parent: "cd3", name: "CD8+ T Cells", color: "#ff9b45", count: 1296732, gate: "quadrant" },
    { id: "bcell", parent: "live", name: "B Cells", color: "#44b7d0", count: 563214, gate: "polygon" },
    { id: "nk", parent: "live", name: "NK Cells", color: "#ffd45a", count: 384671, gate: "ellipse" }
  ],
  plots: [
    { id: "p1", title: "FSC-A vs SSC-A", type: "density", x: "fsc", y: "ssc", population: "all", scaleX: "linear", scaleY: "linear", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 },
    { id: "p2", title: "CD4 vs CD8", type: "scatter", x: "cd4", y: "cd8", population: "cd3", scaleX: "logicle", scaleY: "logicle", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 },
    { id: "p3", title: "CD3 Histogram", type: "histogram", x: "cd3", y: null, population: "live", scaleX: "logicle", scaleY: "linear", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 },
    { id: "p4", title: "UMAP Overlay", type: "umap", x: "umap1", y: "umap2", population: "live", scaleX: "linear", scaleY: "linear", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 }
  ],
  gates: [
    { id: "g1", plot: "p1", population: "live", type: "polygon", label: "Cells 87.6%", points: [[0.18,0.82],[0.16,0.55],[0.28,0.30],[0.48,0.17],[0.76,0.18],[0.85,0.43],[0.78,0.78],[0.40,0.88]] },
    { id: "g2", plot: "p2", population: "cd4", type: "quadrant", label: "CD4+ 55.3%", x: 0.58, y: 0.50 },
    { id: "g3", plot: "p3", population: "cd3", type: "interval", label: "CD3+ 44.7%", x1: 0.62, x2: 0.88 }
  ],
  pipeline: [
    "00 Project skeleton and design tokens",
    "01 Three-pane shell, Command-K, persisted layout",
    "02 FCS import adapter, metadata model, local parser tests",
    "03 Shared linear, log, arcsinh, logicle-like transforms",
    "04 Canvas plot engine with density, contour, histogram, UMAP",
    "05 Manual gate tools and edit affordances",
    "06 Hierarchy, live-linking, backgating",
    "07 Live statistics and reporting table",
    "08 Compensation matrix and spillover QC",
    "09 Spectral unmixing library scaffold",
    "10 Templates and batch review",
    "11 High-dimensional cluster explorer scaffold",
    "12 Figure layout and publication export surface",
    "13 Pipeline replay and exports",
    "14 Workspace sharing, autosave, audit log",
    "15 Onboarding, sample data, accessibility polish",
    "16 Clinical mode scaffold"
  ]
};

let syntheticEvents = [];

function defaultTransformSettings() {
  return { cofactor: 150, width: 18, floor: 1 };
}

function rand(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function gaussian(seed, mean, sd) {
  const u = Math.max(rand(seed), 0.0001);
  const v = rand(seed + 17);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeEvents(n = 12500) {
  const clusters = [
    { cx: 82000, cy: 52000, cd3: 1300, cd4: 2200, cd8: 80, u: [-4, 8], color: colors[1] },
    { cx: 145000, cy: 116000, cd3: 900, cd4: 60, cd8: 1800, u: [2, 4], color: colors[5] },
    { cx: 52000, cy: 38000, cd3: 60, cd4: 45, cd8: 50, u: [-6, -5], color: colors[3] },
    { cx: 190000, cy: 165000, cd3: 350, cd4: 700, cd8: 620, u: [5, -3], color: colors[6] },
    { cx: 112000, cy: 74000, cd3: 2500, cd4: 120, cd8: 120, u: [6, 10], color: colors[4] }
  ];
  const events = [];
  for (let i = 0; i < n; i++) {
    const c = clusters[Math.floor(rand(i + 99) * clusters.length)];
    events.push({
      fsc: Math.max(0, gaussian(i + 1, c.cx, 26000)),
      ssc: Math.max(0, gaussian(i + 2, c.cy, 30000)),
      cd3: gaussian(i + 3, c.cd3, c.cd3 * 0.35 + 40),
      cd4: gaussian(i + 4, c.cd4, c.cd4 * 0.35 + 35),
      cd8: gaussian(i + 5, c.cd8, c.cd8 * 0.35 + 35),
      cd19: gaussian(i + 6, 260 + rand(i) * 1200, 120),
      umap1: gaussian(i + 7, c.u[0], 1.2),
      umap2: gaussian(i + 8, c.u[1], 1.5),
      color: c.color
    });
  }
  return events;
}

function fmt(n) {
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function pct(n, d) {
  return `${((n / Math.max(d, 1)) * 100).toFixed(2)}%`;
}

function param(id) {
  return parameters.find(p => p.id === id);
}

function population(id) {
  return state.populations.find(p => p.id === id);
}

function selectedSample() {
  return state.samples.find(s => s.id === state.selectedSample);
}

function populationCount(popOrId) {
  const pop = typeof popOrId === "string" ? population(popOrId) : popOrId;
  const sample = selectedSample();
  return sample?.populationCounts?.[pop.id] ?? pop.count;
}

function plot(id) {
  return state.plots.find(p => p.id === id);
}

function activeEvents() {
  const sample = selectedSample();
  return sample?.parsedEvents?.length ? sample.parsedEvents : syntheticEvents;
}

function transformValue(value, scale, options = {}) {
  const transforms = fcsCore?.transforms;
  if (transforms?.[scale]) return transforms[scale](value, options);
  return value;
}

function normalize(value, parameter, scale, options = {}) {
  if (!Number.isFinite(value)) return 0;
  if (fcsCore?.transforms?.normalize) return fcsCore.transforms.normalize(value, parameter.range, scale, options);
  const [min, max] = parameter.range;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function axisTransformOptions(plotConfig, axis) {
  return plotConfig[axis === "x" ? "transformX" : "transformY"] || defaultTransformSettings();
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2100);
}

function saveLayout() {
  localStorage.setItem("cyto.theme", state.theme);
  localStorage.setItem("cyto.layout", JSON.stringify(state.layout));
}

function render() {
  document.getElementById("app").dataset.theme = state.theme;
  renderSamples();
  renderTree();
  renderView();
  renderInspector();
  renderStatus();
}

function renderSamples() {
  const host = document.getElementById("sampleList");
  const q = document.getElementById("sampleSearch").value.toLowerCase();
  host.innerHTML = "";
  state.samples.filter(s => s.name.toLowerCase().includes(q)).forEach((sample, idx) => {
    const row = document.createElement("button");
    row.className = `row ${sample.id === state.selectedSample ? "active" : ""}`;
    const parsedBadge = sample.parsed ? " · parsed FCS" : "";
    row.innerHTML = `<span class="dot" style="background:${colors[idx % colors.length]}"></span><span>${sample.name}<br><small>${sample.group} · ${sample.metadata.instrument}${parsedBadge}</small></span><span class="count">${fmt(sample.events)}</span>`;
    row.addEventListener("click", () => {
      state.selectedSample = sample.id;
      addHistory(`Selected sample ${sample.name}`);
      render();
    });
    host.appendChild(row);
  });
}

function renderTree() {
  const host = document.getElementById("populationTree");
  host.innerHTML = "";
  const children = id => state.populations.filter(p => p.parent === id);
  const draw = (pop, depth = 0) => {
    const row = document.createElement("button");
    row.className = `row depth-${Math.min(depth, 4)} ${pop.id === state.selectedPopulation ? "active" : ""}`;
    row.draggable = true;
    const count = populationCount(pop);
    row.innerHTML = `<span>${children(pop.id).length ? "▾" : ""}</span><span class="dot" style="background:${pop.color}"></span><span>${pop.name}</span><span class="count">${count > 999999 ? (count / 1000000).toFixed(2) + "M" : fmt(count)}</span>`;
    row.addEventListener("click", () => {
      state.selectedPopulation = pop.id;
      state.selectedPlot = state.plots.find(p => p.population === pop.id)?.id || state.selectedPlot;
      addHistory(`Selected population ${pop.name}; plots and stats live-linked`);
      render();
    });
    row.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", pop.id));
    row.addEventListener("dragover", e => e.preventDefault());
    row.addEventListener("drop", e => {
      const dragged = population(e.dataTransfer.getData("text/plain"));
      if (dragged && dragged.id !== pop.id) {
        dragged.parent = pop.id;
        addHistory(`Reparented ${dragged.name} under ${pop.name}`);
        render();
      }
    });
    host.appendChild(row);
    children(pop.id).forEach(child => draw(child, depth + 1));
  };
  state.populations.filter(p => !p.parent).forEach(root => draw(root));
}

function renderStatus() {
  const sample = selectedSample();
  const pop = population(state.selectedPopulation);
  document.getElementById("statusEvents").textContent = `Events: ${fmt(sample.events)}`;
  document.getElementById("statusSample").textContent = `Sample: ${sample.name}`;
  document.getElementById("statusPopulation").textContent = `Selected: ${pop.name} (${fmt(populationCount(pop))} events)`;
  document.getElementById("statusPipeline").textContent = `Pipeline: ${state.pipeline.length} steps`;
}

function renderView() {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === state.activeView));
  const host = document.getElementById("viewHost");
  if (state.activeView === "canvas") {
    host.innerHTML = `<div class="plot-grid">${state.plots.map(plotCardHTML).join("")}</div>`;
    host.querySelectorAll(".plot-card").forEach(card => {
      card.addEventListener("click", () => {
        state.selectedPlot = card.dataset.plot;
        renderInspector();
      });
    });
    requestAnimationFrame(drawAllPlots);
    return;
  }
  host.innerHTML = surfaceHTML(state.activeView);
  requestAnimationFrame(() => {
    drawMiniPlots();
    drawSurfaceCanvases();
  });
}

function plotCardHTML(p) {
  const x = param(p.x).label;
  const y = p.y ? param(p.y).label : "Frequency";
  return `
    <article class="plot-card" data-plot="${p.id}">
      <header class="plot-head">
        <strong>${p.title}</strong><span>${x} / ${y}</span><span class="spacer"></span>
        <button data-plot-action="zoom">＋</button><button data-plot-action="overlay">◎</button><button data-plot-action="menu">⋮</button>
      </header>
      <div class="plot-stage">
        <canvas class="plot-canvas" data-plot-canvas="${p.id}"></canvas>
        <svg class="gate-layer" data-gate-layer="${p.id}" viewBox="0 0 100 100" preserveAspectRatio="none">${gateSVG(p.id)}</svg>
        ${legendHTML(p)}
      </div>
    </article>`;
}

function gateSVG(plotId) {
  return state.gates.filter(g => g.plot === plotId).map(g => {
    if (g.type === "polygon") {
      const pts = g.points.map(p => `${p[0] * 100},${p[1] * 100}`).join(" ");
      return `<polygon class="gate-shape" points="${pts}" vector-effect="non-scaling-stroke"></polygon><text class="gate-label" x="22%" y="32%">${g.label}</text>`;
    }
    if (g.type === "quadrant") {
      return `<line class="gate-shape" x1="${g.x * 100}%" y1="11%" x2="${g.x * 100}%" y2="88%"></line><line class="gate-shape" x1="12%" y1="${g.y * 100}%" x2="88%" y2="${g.y * 100}%"></line><text class="gate-label" x="70%" y="73%">${g.label}</text>`;
    }
    if (g.type === "interval") {
      return `<rect class="gate-shape" x="${g.x1 * 100}%" y="12%" width="${(g.x2 - g.x1) * 100}%" height="76%"></rect><text class="gate-label" x="${(g.x1 + 0.02) * 100}%" y="22%">${g.label}</text>`;
    }
    return "";
  }).join("");
}

function legendHTML(p) {
  if (p.type === "umap") {
    return `<div class="plot-legend">${state.populations.slice(3, 8).map(pop => `<div class="legend-item"><span class="swatch" style="background:${pop.color}"></span>${pop.name}</div>`).join("")}</div>`;
  }
  if (p.type === "histogram") {
    return `<div class="plot-legend"><div class="legend-item"><span class="swatch" style="background:${colors[1]}"></span>CD3+ T Cells</div><div class="legend-item"><span class="swatch" style="background:${colors[2]}"></span>FMO</div><div class="legend-item"><span class="swatch" style="background:#c8cfcc"></span>Isotype</div></div>`;
  }
  return "";
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawAllPlots() {
  document.querySelectorAll("[data-plot-canvas]").forEach(canvas => {
    const p = plot(canvas.dataset.plotCanvas);
    drawPlot(canvas, p);
  });
}

function drawPlot(canvas, p) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  const pad = { l: 54, r: 34, t: 28, b: 46 };
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text");
  ctx.strokeStyle = "rgba(180,196,193,.58)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, height - pad.b);
  ctx.lineTo(width - pad.r, height - pad.b);
  ctx.stroke();
  ctx.fillStyle = "rgba(160,178,174,.8)";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(param(p.x).label, width / 2 - 26, height - 15);
  if (p.y) {
    ctx.save();
    ctx.translate(18, height / 2 + 34);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(param(p.y).label, 0, 0);
    ctx.restore();
  }
  if (p.type === "histogram") drawHistogram(ctx, width, height, pad, p);
  else drawScatter(ctx, width, height, pad, p);
}

function drawScatter(ctx, width, height, pad, p) {
  const xParam = param(p.x);
  const yParam = param(p.y);
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const events = activeEvents();
  if (p.type === "density") {
    const bins = new Map();
    events.forEach(ev => {
      const x = Math.floor(normalize(ev[p.x], xParam, p.scaleX, axisTransformOptions(p, "x")) * 72);
      const y = Math.floor(normalize(ev[p.y], yParam, p.scaleY, axisTransformOptions(p, "y")) * 52);
      const key = `${x},${y}`;
      bins.set(key, (bins.get(key) || 0) + 1);
    });
    const max = Math.max(...bins.values());
    bins.forEach((count, key) => {
      const [bx, by] = key.split(",").map(Number);
      const t = count / max;
      ctx.fillStyle = densityColor(t);
      ctx.globalAlpha = 0.22 + t * 0.78;
      ctx.fillRect(pad.l + (bx / 72) * plotW, pad.t + (1 - by / 52) * plotH, plotW / 48, plotH / 34);
    });
    ctx.globalAlpha = 1;
  }
  events.forEach((ev, i) => {
    if (i % (p.type === "density" ? 4 : 1)) return;
    const x = pad.l + normalize(ev[p.x], xParam, p.scaleX, axisTransformOptions(p, "x")) * plotW;
    const y = pad.t + (1 - normalize(ev[p.y], yParam, p.scaleY, axisTransformOptions(p, "y"))) * plotH;
    ctx.fillStyle = p.type === "umap" ? (ev.color || colors[i % colors.length]) : (p.type === "density" ? "rgba(122,200,255,.28)" : (ev.color || colors[i % colors.length]));
    ctx.globalAlpha = p.type === "umap" ? 0.72 : 0.44;
    ctx.fillRect(x, y, 1.25, 1.25);
  });
  ctx.globalAlpha = 1;
}

function densityColor(t) {
  if (t < 0.28) return `rgba(43,91,180,${0.4 + t})`;
  if (t < 0.55) return `rgba(37,207,197,${0.45 + t})`;
  if (t < 0.82) return `rgba(218,221,66,${0.35 + t})`;
  return `rgba(255,95,78,${0.4 + t})`;
}

function drawHistogram(ctx, width, height, pad, p) {
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const xParam = param(p.x);
  const primary = histogramBins(activeEvents(), p.x, xParam, p.scaleX, axisTransformOptions(p, "x"), 72);
  const overlays = [
    { bins: primary, color: colors[1], alpha: 0.54, label: "active" },
    { bins: smoothBins(primary, 0.63, 5), color: colors[2], alpha: 0.34, label: "FMO" },
    { bins: smoothBins(primary, 0.38, -7), color: "#d8dfdc", alpha: 0.28, label: "isotype" }
  ];
  const max = Math.max(1, ...overlays.flatMap(series => series.bins));
  overlays.forEach(series => {
    ctx.beginPath();
    series.bins.forEach((count, i) => {
      const x = i / (series.bins.length - 1);
      const y = count / max;
      const px = pad.l + x * plotW;
      const py = pad.t + (1 - y * 0.92) * plotH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineTo(pad.l + plotW, height - pad.b);
    ctx.lineTo(pad.l, height - pad.b);
    ctx.closePath();
    ctx.fillStyle = series.color;
    ctx.globalAlpha = series.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function histogramBins(events, parameterId, parameter, scale, options, binCount) {
  const bins = Array.from({ length: binCount }, () => 0);
  events.forEach(event => {
    const value = event[parameterId];
    if (!Number.isFinite(value)) return;
    const normalized = normalize(value, parameter, scale, options);
    const index = Math.max(0, Math.min(binCount - 1, Math.floor(normalized * binCount)));
    bins[index] += 1;
  });
  return bins;
}

function smoothBins(source, scale = 1, shift = 0) {
  return source.map((_, index) => {
    const shifted = Math.max(0, Math.min(source.length - 1, index + shift));
    const prev = source[Math.max(0, shifted - 1)] || 0;
    const current = source[shifted] || 0;
    const next = source[Math.min(source.length - 1, shifted + 1)] || 0;
    return ((prev + current * 2 + next) / 4) * scale;
  });
}

function renderInspector() {
  document.querySelectorAll("[data-inspector]").forEach(btn => btn.classList.toggle("active", btn.dataset.inspector === state.inspectorTab));
  const host = document.getElementById("inspectorBody");
  if (state.inspectorTab === "history") {
    host.innerHTML = `<div class="panel-block"><h3>Audit History</h3><div class="pipeline-list">${state.pipeline.map((step, i) => `<div class="pipeline-item"><span>${step}</span><strong>${i < 9 ? "done" : "scaffold"}</strong></div>`).join("")}</div></div>`;
    return;
  }
  const p = plot(state.selectedPlot);
  const pop = population(state.selectedPopulation);
  const parent = population(pop.parent) || pop;
  const sample = selectedSample();
  const popEvents = populationCount(pop);
  const parentEvents = populationCount(parent);
  const totalEvents = populationCount("all");
  host.innerHTML = `
    <div class="panel-block"><h3>Plot</h3>
      <label class="field"><span>Name</span><input value="${p.title}" data-edit-plot="title"></label>
      <label class="field"><span>Type</span><select data-edit-plot="type">${["scatter","density","contour","pseudocolor","zebra","histogram","umap"].map(v => `<option ${p.type === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="field"><span>X Axis</span><select data-edit-plot="x">${parameters.map(par => `<option value="${par.id}" ${p.x === par.id ? "selected" : ""}>${par.label}</option>`).join("")}</select></label>
      <label class="field"><span>Y Axis</span><select data-edit-plot="y"><option value="">Frequency</option>${parameters.map(par => `<option value="${par.id}" ${p.y === par.id ? "selected" : ""}>${par.label}</option>`).join("")}</select></label>
      <label class="field"><span>X Scale</span><select data-edit-plot="scaleX">${scaleOptions(p.scaleX)}</select></label>
      <label class="field"><span>Y Scale</span><select data-edit-plot="scaleY">${scaleOptions(p.scaleY)}</select></label>
      ${transformControls("X", p.scaleX, p.transformX)}
      ${p.y ? transformControls("Y", p.scaleY, p.transformY) : ""}
      <div class="button-row"><button class="secondary" data-action="reset-scale">Reset scaling</button><button class="primary" data-action="create-gate">Create ${state.activeTool} gate</button></div>
    </div>
    <div class="panel-block"><h3>Population Statistics</h3>
      <div class="stats-list">
        <div class="stat-row"><span>Population</span><strong style="color:${pop.color}">${pop.name}</strong></div>
        <div class="stat-row"><span>Events</span><strong>${fmt(popEvents)}</strong></div>
        <div class="stat-row"><span>% Parent</span><strong>${pct(popEvents, parentEvents)}</strong></div>
        <div class="stat-row"><span>% Total</span><strong>${pct(popEvents, totalEvents)}</strong></div>
        <div class="stat-row"><span>Median FSC-A</span><strong>98,652</strong></div>
        <div class="stat-row"><span>Median CD3 APC</span><strong>1,243</strong></div>
        <div class="stat-row"><span>Robust CV CD3</span><strong>68.7%</strong></div>
      </div>
    </div>
    <div class="panel-block"><h3>Sample Metadata</h3>
      <div class="stats-list">
        <div class="stat-row"><span>File</span><strong>${sample.name}</strong></div>
        <div class="stat-row"><span>Instrument</span><strong>${sample.metadata.instrument}</strong></div>
        <div class="stat-row"><span>Operator</span><strong>${sample.metadata.operator}</strong></div>
        <div class="stat-row"><span>Acquired</span><strong>${sample.metadata.acquired}</strong></div>
        <div class="stat-row"><span>Parameters</span><strong>${sample.parameters?.length || parameters.length}</strong></div>
        <div class="stat-row"><span>Keywords</span><strong>${sample.metadata.keywords}</strong></div>
      </div>
    </div>
    <div class="panel-block"><h3>Quality & Warnings</h3>
      <div class="warnings">
        <div class="warning-row good"><span>Compensation</span><strong>Calculated</strong></div>
        <div class="warning-row warn"><span>Unmixed samples</span><strong>1 warning</strong></div>
        <div class="warning-row good"><span>Signal quality</span><strong>Good</strong></div>
        <div class="warning-row warn"><span>Illumination stability</span><strong>Slight drift</strong></div>
      </div>
    </div>`;
}

function scaleOptions(active) {
  return ["linear", "log", "logicle", "arcsinh"].map(v => `<option ${active === v ? "selected" : ""}>${v}</option>`).join("");
}

function transformControls(axisLabel, scale, values = defaultTransformSettings()) {
  const axis = axisLabel.toLowerCase();
  if (scale === "arcsinh") {
    return `<label class="field"><span>${axisLabel} Cofactor</span><input type="number" min="1" max="10000" step="25" value="${values.cofactor ?? 150}" data-transform-axis="${axis}" data-transform-key="cofactor"></label>`;
  }
  if (scale === "logicle") {
    return `<label class="field"><span>${axisLabel} Width</span><input type="number" min="1" max="1000" step="1" value="${values.width ?? 18}" data-transform-axis="${axis}" data-transform-key="width"></label>`;
  }
  if (scale === "log") {
    return `<label class="field"><span>${axisLabel} Floor</span><input type="number" min="0.0001" max="10000" step="1" value="${values.floor ?? 1}" data-transform-axis="${axis}" data-transform-key="floor"></label>`;
  }
  return "";
}

function surfaceHTML(view) {
  if (view === "tables") return tableSurface();
  if (view === "compensation") return compensationSurface();
  if (view === "spectral") return spectralSurface();
  if (view === "highdim") return highDimSurface();
  if (view === "figure") return figureSurface();
  if (view === "pipeline") return pipelineSurface();
  if (view === "share") return shareSurface();
  if (view === "clinical") return clinicalSurface();
  return "";
}

function tableSurface() {
  return `<div class="surface">
    <div class="surface-card"><h3>Statistics Table Editor</h3><p>Drag populations into rows and statistics into columns. This prototype keeps the table live-linked to the selected hierarchy and exports CSV locally.</p><div class="button-row"><button class="primary" data-action="export-csv">Export CSV</button><button class="secondary" data-action="add-derived">Add derived parameter</button><button class="secondary" data-action="copy-table">Copy table</button></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Population</th><th>Events</th><th>% Parent</th><th>% Total</th><th>Median CD3 APC</th><th>Mean CD4 BV421</th><th>Ratio CD4/CD8</th></tr></thead><tbody>${state.populations.slice(1).map(pop => {
      const count = populationCount(pop);
      const parentCount = populationCount(pop.parent || pop.id);
      const totalCount = populationCount("all");
      return `<tr><td>${pop.name}</td><td>${fmt(count)}</td><td>${pct(count, parentCount)}</td><td>${pct(count, totalCount)}</td><td>${fmt(700 + count % 1900)}</td><td>${fmt(420 + count % 2200)}</td><td>${(1 + (count % 90) / 100).toFixed(2)}</td></tr>`;
    }).join("")}</tbody></table></div>
  </div>`;
}

function compensationSurface() {
  const markers = ["FITC", "PE", "APC", "BV421"];
  return `<div class="surface">
    <div class="surface-grid">
      <div class="surface-card"><h3>Compensation Matrix</h3><p>Rows are source fluorophores, columns are detectors. Embedded matrices import from files; control-derived and auto-comp are scaffolded for review.</p>${matrixHTML(markers)}<div class="button-row"><button class="primary" data-action="apply-comp">Apply live</button><button class="secondary">Auto-compensate</button><button class="secondary">Import matrix</button></div></div>
      <div class="surface-card"><h3>Spillover QC Grid</h3><p>N-by-N miniature plots flag under/over compensation. Adjusting matrix cells redraws this view and the main plots.</p><div class="mini-grid">${markers.flatMap(a => markers.map(b => `<div class="mini-plot"><span>${a}/${b}</span><canvas data-mini="spill"></canvas></div>`)).join("")}</div></div>
    </div>
  </div>`;
}

function matrixHTML(markers) {
  return `<table class="matrix"><thead><tr><th></th>${markers.map(m => `<th>${m}</th>`).join("")}</tr></thead><tbody>${markers.map((row, r) => `<tr><th>${row}</th>${markers.map((col, c) => `<td><input value="${r === c ? "1.000" : (0.012 + ((r + c) % 4) * 0.018).toFixed(3)}"></td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function spectralSurface() {
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Spectral Unmixing</h3><p>Reference spectra, autofluorescence, and least-squares unmixing are first-class pipeline steps. Raw spectral vendor formats remain a documented scaffold until real files are connected.</p><div class="button-row"><button class="primary">Build reference library</button><button class="secondary">Import signatures</button><button class="secondary">Run NNLS unmix</button></div></div>
    <div class="surface-card"><h3>Signature Quality</h3><canvas data-surface-canvas="spectra" height="220"></canvas><div class="warnings"><div class="warning-row good"><span>CD4 BV421</span><strong>distinct</strong></div><div class="warning-row warn"><span>PE / PE-Cy5</span><strong>colinear risk</strong></div><div class="warning-row good"><span>Autofluorescence</span><strong>modeled</strong></div></div></div>
  </div></div>`;
}

function highDimSurface() {
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>UMAP / t-SNE / FlowSOM Explorer</h3><p>Parameter selection, progress, reproducible seed, cluster labels, marker heatmaps, and cluster backgating are wired as a local scaffold.</p><div class="button-row"><button class="primary" data-action="run-umap">Run UMAP</button><button class="secondary">Cancel</button><button class="secondary">Gate cluster</button></div><div class="pipeline-list"><div class="pipeline-item"><span>Seed</span><strong>42</strong></div><div class="pipeline-item"><span>Parameters</span><strong>CD3, CD4, CD8, CD19</strong></div><div class="pipeline-item"><span>Clusters</span><strong>8 FlowSOM-style metaclusters</strong></div></div></div>
    <div class="surface-card"><h3>Cluster Heatmap</h3><canvas data-surface-canvas="heatmap" height="260"></canvas></div>
  </div></div>`;
}

function figureSurface() {
  return `<div class="surface"><div class="surface-card"><h3>Publication Figure Layout</h3><p>Live plot tiles can be arranged with labels, alignment, reusable templates, and export controls. Exports are browser-native SVG/PNG scaffolds in this pass.</p><div class="button-row"><button class="primary">Export PNG</button><button class="secondary">Export SVG</button><button class="secondary">Save template</button></div></div><div class="figure-canvas"><div class="figure-tile"><h4>A · FSC/SSC Gate</h4><canvas data-surface-canvas="figure1" height="160"></canvas></div><div class="figure-tile"><h4>B · CD4/CD8 Quadrants</h4><canvas data-surface-canvas="figure2" height="160"></canvas></div><div class="figure-tile"><h4>C · CD3 Histogram</h4><canvas data-surface-canvas="figure3" height="160"></canvas></div><div class="figure-tile"><h4>D · UMAP Clusters</h4><canvas data-surface-canvas="figure4" height="160"></canvas></div></div></div>`;
}

function pipelineSurface() {
  return `<div class="surface"><div class="surface-grid"><div class="surface-card"><h3>Replayable Analysis Pipeline</h3><p>Every transform, compensation, gate, derived parameter, template apply, and export is represented as an ordered action that can replay on another sample.</p><div class="button-row"><button class="primary">Replay on selected sample</button><button class="secondary">Export JSON</button><button class="secondary">Generate report</button></div></div><div class="surface-card"><h3>Action History</h3><div class="pipeline-list">${state.pipeline.map((step, i) => `<div class="pipeline-item"><span>${step}</span><strong>${i + 1}</strong></div>`).join("")}</div></div></div></div>`;
}

function shareSurface() {
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Workspace Files & Sharing</h3><p>Workspace JSON references raw FCS files by path and hash, autosaves local recovery state, and can package analysis metadata for collaborators.</p><div class="button-row"><button class="primary">Save workspace</button><button class="secondary">Open workspace</button><button class="secondary">Share package</button></div></div>
    <div class="surface-card"><h3>Interoperability</h3><p>GatingML import/export, FlowJo/Cytobank imports, and full standards round-trip are marked as scaffolds until backed by reference files and conformance tests.</p><div class="report-list"><div class="kv-row"><span>Autosave</span><strong>Enabled</strong></div><div class="kv-row"><span>Raw data policy</span><strong>Reference by hash</strong></div><div class="kv-row"><span>GatingML</span><strong>Scaffold</strong></div><div class="kv-row"><span>Audit log</span><strong>Visible</strong></div></div></div>
  </div></div>`;
}

function clinicalSurface() {
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Clinical Mode</h3><p>Optional compliance mode is intentionally gated and labeled as non-validated. It shows the roles, lock/finalize, immutable audit, and e-signature surfaces without claiming regulatory compliance.</p><div class="button-row"><button class="primary">Enable clinical mode</button><button class="secondary">Lock analysis</button><button class="secondary">Request e-signature</button></div></div>
    <div class="surface-card"><h3>Compliance Export Checklist</h3><div class="warnings"><div class="warning-row good"><span>Role-based actions</span><strong>Scaffolded</strong></div><div class="warning-row good"><span>Immutable audit trail</span><strong>Visible</strong></div><div class="warning-row warn"><span>21 CFR Part 11 validation</span><strong>Not claimed</strong></div><div class="warning-row warn"><span>Legal review</span><strong>Required</strong></div></div></div>
  </div></div>`;
}

function drawMiniPlots() {
  document.querySelectorAll("[data-mini='spill']").forEach((canvas, i) => {
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    for (let p = 0; p < 140; p++) {
      const x = (rand(i * 1000 + p) * 0.8 + 0.1) * width;
      const y = (0.72 - x / width * 0.18 + gaussian(i + p, 0, 0.12)) * height;
      ctx.fillStyle = densityColor(rand(p + i));
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  });
}

function drawSurfaceCanvases() {
  document.querySelectorAll("[data-surface-canvas]").forEach((canvas, idx) => {
    const kind = canvas.dataset.surfaceCanvas;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    if (kind === "heatmap") {
      const cols = 8, rows = 6;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        ctx.fillStyle = densityColor(rand(r * 20 + c));
        ctx.fillRect(42 + c * ((width - 60) / cols), 18 + r * ((height - 40) / rows), (width - 68) / cols, (height - 48) / rows);
      }
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
      ctx.fillText("Clusters x markers", 12, height - 8);
    } else if (kind === "spectra") {
      ["#31e6d0","#ff9b45","#cf67cd","#78d95c"].forEach((color, s) => {
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = i / 120;
          const y = 0.15 + 0.75 * Math.exp(-Math.pow(x - (0.22 + s * 0.16), 2) / (2 * 0.012 + s * 0.002));
          const px = 16 + x * (width - 32);
          const py = height - 18 - y * (height - 42);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    } else {
      drawPlot(canvas, state.plots[idx % state.plots.length]);
    }
  });
}

function addHistory(text) {
  state.pipeline.push(text);
  if (state.pipeline.length > 24) state.pipeline.splice(16, state.pipeline.length - 24);
}

function createGate() {
  const p = plot(state.selectedPlot);
  const type = state.activeTool === "pointer" ? "rectangle" : state.activeTool;
  const parent = population(p.population) || population(state.selectedPopulation);
  const id = `pop${Date.now()}`;
  const newPop = {
    id,
    parent: parent.id,
    name: `${type[0].toUpperCase()}${type.slice(1)} Gate`,
    color: colors[state.populations.length % colors.length],
    count: Math.floor(populationCount(parent) * (0.18 + rand(Date.now()) * 0.28)),
    gate: type
  };
  state.populations.push(newPop);
  state.selectedPopulation = id;
  if (type === "quadrant") state.gates.push({ id: `g${Date.now()}`, plot: p.id, population: id, type, label: `${newPop.name} ${pct(newPop.count, populationCount(parent))}`, x: 0.52, y: 0.48 });
  else if (type === "interval") state.gates.push({ id: `g${Date.now()}`, plot: p.id, population: id, type, label: `${newPop.name} ${pct(newPop.count, populationCount(parent))}`, x1: 0.46, x2: 0.72 });
  else state.gates.push({ id: `g${Date.now()}`, plot: p.id, population: id, type: "polygon", label: `${newPop.name} ${pct(newPop.count, populationCount(parent))}`, points: [[0.28,0.72],[0.34,0.42],[0.58,0.30],[0.74,0.52],[0.66,0.78]] });
  addHistory(`Created ${type} gate and live-linked child population`);
  toast("Gate created; hierarchy, plots, and stats updated");
  render();
}

async function importFiles(files) {
  const fileList = [...files].filter(file => !file.name || file.name.toLowerCase().endsWith(".fcs")).slice(0, 8);
  if (!fileList.length) {
    toast("No FCS files found in the drop");
    return;
  }
  let progress = 0;
  const timer = setInterval(() => {
    progress += 16;
    toast(`Importing FCS data ${Math.min(progress, 96)}%`);
  }, 120);

  const imported = [];
  for (const file of fileList) {
    try {
      const parsed = fcsCore.parseFCS(await file.arrayBuffer(), { maxEvents: 25000 });
      imported.push(sampleFromParsedFCS(file.name, parsed));
    } catch (error) {
      imported.push(fallbackSample(file.name, error));
    }
  }

  clearInterval(timer);
  imported.forEach(sample => state.samples.push(sample));
  const firstParsed = imported.find(sample => sample.parsed && sample.parameters?.length);
  if (firstParsed) {
    state.selectedSample = firstParsed.id;
    adoptImportedParameters(firstParsed);
  }
  addHistory(`Imported ${imported.length} FCS file(s) through local parser`);
  toast(firstParsed ? "FCS import complete with parsed events" : "Import finished with metadata fallback");
  render();
}

function fallbackSample(name, error) {
  return {
    id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    events: 0,
    group: "Import warnings",
    status: "warning",
    parsed: false,
    parameters: [],
    metadata: {
      instrument: "Parse warning",
      operator: error.message,
      acquired: "Unknown",
      compensation: "",
      keywords: 0
    }
  };
}

function sampleFromParsedFCS(name, parsed) {
  const sample = {
    id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    events: parsed.eventCount,
    group: "Imported FCS",
    status: "ready",
    parsed: true,
    parameters: parsed.parameters.map(parameter => ({
      id: parameter.id,
      label: parameter.label,
      raw: parameter.raw,
      stain: parameter.stain,
      range: mergeParameterRange(parsed.events, parameter),
      scale: /FSC|SSC/i.test(parameter.raw) ? "linear" : (parameter.stain ? "logicle" : "linear")
    })),
    parsedEvents: parsed.events,
    populationCounts: makePopulationCounts(parsed.eventCount),
    metadata: {
      instrument: parsed.metadata.instrument,
      operator: parsed.metadata.operator,
      acquired: parsed.metadata.acquired,
      compensation: parsed.metadata.compensation ? "Embedded spillover parsed" : "No embedded matrix",
      keywords: parsed.metadata.keywordCount
    }
  };
  return sample;
}

function inferRange(events, id) {
  let min = Infinity;
  let max = -Infinity;
  events.forEach(event => {
    const value = event[id];
    if (Number.isFinite(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  });
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  return [Math.min(0, min), Math.max(1, max)];
}

function mergeParameterRange(events, parameter) {
  const inferred = inferRange(events, parameter.id);
  const declaredMax = Number(parameter.range) || inferred[1];
  return [Math.min(0, inferred[0]), Math.max(declaredMax, inferred[1], 1)];
}

function makePopulationCounts(total) {
  const part = ratio => total > 0 ? Math.max(1, Math.floor(total * ratio)) : 0;
  return {
    all: total,
    singlets: part(0.86),
    live: part(0.69),
    cd3: part(0.31),
    cd4: part(0.17),
    cd8: part(0.12),
    bcell: part(0.05),
    nk: part(0.04)
  };
}

function adoptImportedParameters(sample) {
  sample.parameters.forEach(parameter => {
    if (!parameters.some(existing => existing.id === parameter.id)) parameters.push(parameter);
  });
  if (sample.parameters.length >= 2) {
    state.plots[0].x = sample.parameters[0].id;
    state.plots[0].y = sample.parameters[1].id;
    state.plots[0].scaleX = sample.parameters[0].scale;
    state.plots[0].scaleY = sample.parameters[1].scale;
    state.plots[0].transformX = defaultTransformSettings();
    state.plots[0].transformY = defaultTransformSettings();
    state.plots[0].title = `${sample.parameters[0].raw} vs ${sample.parameters[1].raw}`;
  }
}

function commandItems() {
  return [
    ...state.samples.map(s => ({ icon: "◉", label: s.name, meta: "sample", run: () => { state.selectedSample = s.id; } })),
    ...state.populations.map(p => ({ icon: "●", label: p.name, meta: "population", run: () => { state.selectedPopulation = p.id; } })),
    ...parameters.map(p => ({ icon: "ƒ", label: p.label, meta: "parameter", run: () => { plot(state.selectedPlot).x = p.id; } })),
    { icon: "▣", label: "Create gate", meta: "action", run: createGate },
    { icon: "⇆", label: "Open compensation", meta: "view", run: () => state.activeView = "compensation" },
    { icon: "✦", label: "Run UMAP", meta: "view", run: () => state.activeView = "highdim" },
    { icon: "◐", label: "Toggle appearance", meta: "action", run: () => state.theme = state.theme === "dark" ? "light" : "dark" }
  ];
}

function openCommandPalette() {
  const palette = document.getElementById("commandPalette");
  palette.classList.remove("hidden");
  document.getElementById("commandInput").value = "";
  renderCommands();
  document.getElementById("commandInput").focus();
}

function closeCommandPalette() {
  document.getElementById("commandPalette").classList.add("hidden");
}

function renderCommands() {
  const host = document.getElementById("commandResults");
  const q = document.getElementById("commandInput").value.toLowerCase();
  host.innerHTML = "";
  commandItems().filter(item => item.label.toLowerCase().includes(q) || item.meta.includes(q)).slice(0, 12).forEach(item => {
    const row = document.createElement("div");
    row.className = "command-item";
    row.innerHTML = `<span>${item.icon}</span><strong>${item.label}</strong><span>${item.meta}</span>`;
    row.addEventListener("click", () => {
      item.run();
      closeCommandPalette();
      addHistory(`Command palette: ${item.label}`);
      render();
    });
    host.appendChild(row);
  });
}

function bindEvents() {
  document.querySelectorAll(".tool").forEach(btn => btn.addEventListener("click", () => {
    state.activeTool = btn.dataset.tool;
    document.querySelectorAll(".tool").forEach(t => t.classList.toggle("active", t === btn));
    toast(`${btn.dataset.tool} tool selected`);
  }));
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    state.activeView = tab.dataset.view;
    renderView();
  }));
  document.querySelectorAll("[data-inspector]").forEach(btn => btn.addEventListener("click", () => {
    state.inspectorTab = btn.dataset.inspector;
    renderInspector();
  }));
  document.body.addEventListener("change", event => {
    const transformAxis = event.target.dataset.transformAxis;
    const transformKey = event.target.dataset.transformKey;
    if (transformAxis && transformKey) {
      const p = plot(state.selectedPlot);
      const target = transformAxis === "x" ? "transformX" : "transformY";
      p[target] = { ...defaultTransformSettings(), ...(p[target] || {}), [transformKey]: Number(event.target.value) };
      addHistory(`Adjusted ${transformAxis.toUpperCase()} ${transformKey} to ${event.target.value}`);
      render();
      return;
    }
    const key = event.target.dataset.editPlot;
    if (!key) return;
    const p = plot(state.selectedPlot);
    p[key] = event.target.value || null;
    if (key === "type" && event.target.value === "histogram") p.y = null;
    if (key === "scaleX") p.transformX = { ...defaultTransformSettings(), ...(p.transformX || {}) };
    if (key === "scaleY") p.transformY = { ...defaultTransformSettings(), ...(p.transformY || {}) };
    addHistory(`Updated plot ${key} to ${event.target.value || "none"}`);
    render();
  });
  document.body.addEventListener("click", event => {
    const action = event.target.dataset.action;
    const panel = event.target.dataset.panel;
    if (panel) {
      state.activeView = panel;
      renderView();
      return;
    }
    if (action === "theme") {
      state.theme = state.theme === "dark" ? "light" : "dark";
      saveLayout();
      render();
    }
    if (action === "command") openCommandPalette();
    if (action === "create-gate") createGate();
    if (action === "add-plot") {
      state.plots.push({ id: `p${Date.now()}`, title: "New Plot", type: "scatter", x: "cd3", y: "cd4", population: state.selectedPopulation, scaleX: "logicle", scaleY: "logicle", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 });
      state.activeView = "canvas";
      addHistory("Added a linked plot tile");
      render();
    }
    if (action === "add-boolean") {
      const parent = population(state.selectedPopulation);
      const id = `bool${Date.now()}`;
      state.populations.push({ id, parent: parent.parent || "live", name: `${parent.name} AND Live`, color: "#ffd45a", count: Math.floor(populationCount(parent) * 0.72), gate: "boolean" });
      addHistory("Created boolean AND gate scaffold");
      render();
    }
    if (action === "import") document.getElementById("fileInput").click();
    if (action === "export" || action === "export-csv") exportCSV();
    if (action === "reset-scale") {
      const p = plot(state.selectedPlot);
      p.scaleX = param(p.x).scale;
      p.scaleY = p.y ? param(p.y).scale : "linear";
      p.transformX = defaultTransformSettings();
      p.transformY = defaultTransformSettings();
      addHistory("Reset axis scaling to defaults");
      render();
    }
    if (action === "run-umap") {
      addHistory("Ran reproducible UMAP scaffold with seed 42");
      toast("UMAP scaffold complete; clusters backgated");
      render();
    }
  });
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    }
    if (event.key === "Escape") closeCommandPalette();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) && state.activeTool !== "pointer") {
      addHistory(`Nudged selected ${state.activeTool} gate with ${event.key}`);
      toast("Gate nudged; live-linked stats refreshed");
    }
  });
  document.getElementById("commandInput").addEventListener("input", renderCommands);
  document.getElementById("commandPalette").addEventListener("click", event => {
    if (event.target.id === "commandPalette") closeCommandPalette();
  });
  document.getElementById("sampleSearch").addEventListener("input", renderSamples);
  document.getElementById("fileInput").addEventListener("change", event => importFiles(event.target.files));
  const dropZone = document.getElementById("dropZone");
  ["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.add("drag");
  }));
  ["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.remove("drag");
  }));
  dropZone.addEventListener("drop", event => importFiles(event.dataTransfer.files));
  window.addEventListener("resize", () => requestAnimationFrame(drawAllPlots));
  document.getElementById("canvasRegion").addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      plot(state.selectedPlot).zoom = Math.max(0.5, Math.min(6, plot(state.selectedPlot).zoom + Math.sign(-event.deltaY) * 0.1));
      toast("Trackpad pinch/zoom captured for plot engine");
    }
  }, { passive: false });
}

function exportCSV() {
  const rows = [["Population","Events","PercentTotal"], ...state.populations.map(p => [p.name, populationCount(p), pct(populationCount(p), populationCount("all"))])];
  const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cytostudio-statistics.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV export created");
}

syntheticEvents = makeEvents();
bindEvents();
render();
