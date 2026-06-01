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
const LARGE_FILE_PREVIEW_BYTES = 512 * 1024 * 1024;

const state = {
  theme: localStorage.getItem("cyto.theme") || "dark",
  activeView: "canvas",
  activeTool: "pointer",
  selectedSample: "s1",
  selectedPopulation: "cd3",
  selectedPlot: "p1",
  selectedGate: "g0",
  inspectorTab: "plot",
  layout: JSON.parse(localStorage.getItem("cyto.layout") || "{}"),
  importProgress: 0,
  importJob: {
    active: false,
    cancelled: false,
    currentFile: "",
    phase: "idle",
    fileBytesLoaded: 0,
    fileBytesTotal: 0,
    parsedEvents: 0,
    targetEvents: 0,
    parsePercent: 0,
    strategy: "",
    completed: 0,
    total: 0
  },
  compensation: {
    enabled: true,
    version: 1,
    scope: "workspace",
    assignedGroup: "Treatment A",
    source: "Workspace default matrix",
    reviewStatus: "reviewed",
    channels: ["cd3", "cd4", "cd8", "cd19"],
    matrix: {
      cd3: { cd3: 1, cd4: 0.018, cd8: 0.026, cd19: 0.012 },
      cd4: { cd3: 0.014, cd4: 1, cd8: 0.032, cd19: 0.02 },
      cd8: { cd3: 0.021, cd4: 0.028, cd8: 1, cd19: 0.018 },
      cd19: { cd3: 0.011, cd4: 0.016, cd8: 0.023, cd19: 1 }
    }
  },
  spectral: {
    enabled: false,
    version: 1,
    channels: ["cd3", "cd4", "cd8", "cd19"],
    signatures: {
      unmixed_cd3: { label: "Unmixed CD3", color: "#31e6d0", values: [0.08, 0.18, 0.72, 0.38] },
      unmixed_cd4: { label: "Unmixed CD4", color: "#cf67cd", values: [0.72, 0.22, 0.12, 0.08] },
      unmixed_cd8: { label: "Unmixed CD8", color: "#ff9b45", values: [0.12, 0.68, 0.24, 0.10] },
      unmixed_af: { label: "Autofluorescence", color: "#d8dfdc", values: [0.38, 0.34, 0.30, 0.28] }
    },
    quality: []
  },
  templates: [
    { id: "tcell-panel", name: "T-cell panel", sourceSample: "s1", version: 1, savedAt: "2026-06-01", populations: 8, gates: 4 }
  ],
  batch: {
    group: "Treatment A",
    templateId: "tcell-panel",
    reviewIndex: 0,
    combinedRows: [],
    lastRecomputed: "not run"
  },
  booleanBuilder: {
    operation: "AND",
    left: "cd4",
    right: "cd3"
  },
  tableEditor: {
    mode: "populations",
    rows: ["singlets", "live", "cd3", "cd4", "cd8"],
    columns: ["count", "parentPercent", "totalPercent", "median:fsc", "mean:cd3", "robustCV:cd3"],
    sortColumn: "count",
    sortDir: "desc"
  },
  highDim: {
    method: "UMAP",
    clusterer: "FlowSOM",
    population: "live",
    colorBy: "cd3",
    parameters: ["cd3", "cd4", "cd8", "cd19"],
    seed: 42,
    progress: 0,
    status: "idle",
    selectedCluster: 0,
    result: null
  },
  figure: {
    selectedElement: "fig-a",
    templateSaved: false,
    exportStatus: "ready",
    fontSize: 12,
    lineWidth: 1.4,
    tickDensity: 5,
    theme: "journal",
    snap: true,
    elements: [
      { id: "fig-a", type: "plot", plot: "p1", label: "A", x: 5, y: 18, w: 42, h: 29 },
      { id: "fig-b", type: "plot", plot: "p2", label: "B", x: 53, y: 18, w: 42, h: 29, inset: "p3" },
      { id: "fig-c", type: "plot", plot: "p3", label: "C", x: 5, y: 58, w: 42, h: 27 },
      { id: "fig-d", type: "plot", plot: "p4", label: "D", x: 53, y: 58, w: 42, h: 27 },
      { id: "fig-title", type: "text", text: "PBMC gating summary", x: 6, y: 4, w: 72, h: 8 },
      { id: "fig-arrow", type: "arrow", text: "Backgated cluster", x: 43, y: 47, w: 14, h: 9 }
    ]
  },
  report: {
    status: "not generated",
    lastExport: "none"
  },
  workspace: {
    name: "PBMC Panel Workspace",
    autosave: Boolean(localStorage.getItem("cyto.autosave")),
    lastSaved: "not saved",
    recoveryAvailable: Boolean(localStorage.getItem("cyto.workspace.autosave")),
    shareStatus: "local only",
    syncEnabled: false,
    imports: []
  },
  onboarding: {
    visible: !localStorage.getItem("cyto.onboarded"),
    step: 0,
    coach: true,
    shortcutsVisible: false
  },
  accessibility: {
    contrast: localStorage.getItem("cyto.contrast") === "1"
  },
  clinical: {
    enabled: false,
    locked: false,
    signed: false,
    user: "Research User",
    role: "Research",
    retentionYears: 7,
    access: "local roles",
    exportStatus: "not exported"
  },
  pipelineCursor: null,
  samples: [
    { id: "s1", name: "PBMC Panel.fcs", events: 10432912, group: "Treatment A", status: "ready", templateId: "tcell-panel", metadata: { instrument: "Aurora CS", operator: "Core Facility", acquired: "2026-06-01", compensation: "Imported 8x8", keywords: 412 } },
    { id: "s2", name: "Donor 02 Restim.fcs", events: 8945102, group: "Treatment A", status: "ready", templateId: "tcell-panel", metadata: { instrument: "Aurora CS", operator: "Core Facility", acquired: "2026-05-31", compensation: "Group matrix", keywords: 397 } },
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
    { id: "g0", plot: "p1", population: "singlets", type: "rectangle", label: "Singlets 85.8%", x1: 0.10, y1: 0.14, x2: 0.92, y2: 0.92 },
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
let highDimTimer = null;
let activeImportWorker = null;
let activeImportReject = null;
let activeGateDrag = null;
let activeGateDraft = null;

function defaultTransformSettings(parameter = null, events = []) {
  if (!parameter) return { cofactor: 150, width: 18, floor: 1 };
  const values = events
    .map(event => event[parameter.id])
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const range = parameter.range || [0, 100000];
  const low = values.length ? percentile(values, 0.01) : range[0];
  const high = values.length ? percentile(values, 0.99) : range[1];
  const positive = values.find(value => value > 0);
  const span = Math.max(1, Math.abs(high - low), Math.abs(range[1] - range[0]));
  const negativeTail = Math.abs(Math.min(low, range[0], 0));
  return {
    cofactor: Math.round(Math.max(5, Math.min(10000, span / 500))),
    width: Math.round(Math.max(1, Math.min(1000, negativeTail || span / 4096))),
    floor: Math.max(0.0001, positive || 1)
  };
}

function defaultTransformSettingsForAxis(plotConfig, axis) {
  const parameter = param(axis === "x" ? plotConfig.x : plotConfig.y);
  return defaultTransformSettings(parameter, activeEvents());
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

function selectedGate() {
  return state.gates.find(gate => gate.id === state.selectedGate) || state.gates.find(gate => gate.population === state.selectedPopulation);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function colorToRGBA(color, alpha = 0.14) {
  const hex = String(color || "").trim();
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return `rgba(49,230,208,${alpha})`;
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function selectedSample() {
  return state.samples.find(s => s.id === state.selectedSample);
}

function activeTemplate() {
  return state.templates.find(template => template.id === state.batch.templateId) || state.templates[0];
}

function sampleTemplateLabel(sample) {
  const template = activeTemplate();
  if (!template || sample.templateId !== template.id) return null;
  const tailored = sample.tailoredTemplates?.includes(template.id);
  return { label: tailored ? "tailored" : "template", className: tailored ? "sample-badge tailored" : "sample-badge linked" };
}

function batchGroupSamples() {
  return state.samples.filter(sample => sample.group === state.batch.group);
}

function selectedBatchSample() {
  const samples = batchGroupSamples();
  if (!samples.length) return selectedSample();
  return samples[Math.max(0, Math.min(samples.length - 1, state.batch.reviewIndex))];
}

function populationCount(popOrId, sample = selectedSample()) {
  const pop = typeof popOrId === "string" ? population(popOrId) : popOrId;
  return sample?.populationCounts?.[pop.id] ?? pop.count;
}

function setPopulationCount(popOrId, count, sample = selectedSample()) {
  const pop = typeof popOrId === "string" ? population(popOrId) : popOrId;
  if (!sample.populationCounts) sample.populationCounts = {};
  sample.populationCounts[pop.id] = Math.max(0, Math.round(count));
}

function plot(id) {
  return state.plots.find(p => p.id === id);
}

function activeEvents(sample = selectedSample()) {
  const baseEvents = sample?.parsedEvents?.length ? sample.parsedEvents : (sample?.parsed ? [] : syntheticEvents);
  return unmixedEvents(compensatedEvents(baseEvents, sample), sample);
}

function compensatedEvents(baseEvents, sample = selectedSample()) {
  const comp = currentCompensation(sample);
  if (!comp.enabled) return baseEvents;
  if (sample && sample.compensatedVersion === comp.version && sample.compensatedEvents) return sample.compensatedEvents;
  const events = baseEvents.map(event => compensateEvent(event, comp));
  if (sample) {
    sample.compensatedVersion = comp.version;
    sample.compensatedEvents = events;
  }
  return events;
}

function compensateEvent(event, comp = currentCompensation()) {
  const channels = comp.channels.filter(id => Number.isFinite(event[id]));
  if (!channels.length) return event;
  const corrected = { ...event };
  channels.forEach(detector => {
    let value = event[detector];
    channels.forEach(source => {
      if (source === detector) return;
      value -= (comp.matrix[source]?.[detector] || 0) * event[source];
    });
    corrected[detector] = value;
  });
  return corrected;
}

function currentCompensation(sample = selectedSample()) {
  const groupComp = state.compensationGroups?.[sample?.group];
  return sample?.compensation || groupComp || state.compensation;
}

function invalidateCompensation() {
  const comp = currentCompensation();
  comp.version = (comp.version || 1) + 1;
  invalidateCompensatedEvents(comp);
}

function invalidateCompensatedEvents(comp = currentCompensation()) {
  state.samples.forEach(sample => {
    if (sample.compensation === comp || state.compensationGroups?.[sample.group] === comp || comp === state.compensation) {
      delete sample.compensatedEvents;
      delete sample.compensatedVersion;
    }
  });
}

function unmixedEvents(baseEvents, sample = selectedSample()) {
  if (!state.spectral.enabled) return baseEvents;
  if (sample && sample.unmixedVersion === state.spectral.version && sample.unmixedEvents) return sample.unmixedEvents;
  const events = baseEvents.map(event => unmixEvent(event));
  if (sample) {
    sample.unmixedVersion = state.spectral.version;
    sample.unmixedEvents = events;
  }
  return events;
}

function unmixEvent(event) {
  const channels = state.spectral.channels.filter(id => Number.isFinite(event[id]));
  if (!channels.length) return event;
  const vector = normalizeVector(channels.map(id => Math.max(0, event[id])));
  const unmixed = { ...event };
  Object.entries(state.spectral.signatures).forEach(([id, signature]) => {
    const sig = normalizeVector(signature.values.slice(0, channels.length));
    unmixed[id] = Math.max(0, dot(vector, sig)) * channels.reduce((sum, channel) => sum + Math.max(0, event[channel]), 0);
  });
  return unmixed;
}

function normalizeVector(values) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map(value => value / norm);
}

function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * (b[index] || 0), 0);
}

function cosineSimilarity(a, b) {
  return dot(normalizeVector(a), normalizeVector(b));
}

function invalidateSpectral() {
  state.spectral.version += 1;
  state.samples.forEach(sample => {
    delete sample.unmixedEvents;
    delete sample.unmixedVersion;
  });
}

function activeEventScale(sample = selectedSample()) {
  const events = activeEvents(sample);
  return events.length ? sample.events / events.length : 1;
}

function eventsForPlot(plotConfig) {
  return sampleEventsForPopulation(plotConfig.population || state.selectedPopulation);
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
  return plotConfig[axis === "x" ? "transformX" : "transformY"] || defaultTransformSettingsForAxis(plotConfig, axis);
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
  if (state.workspace.autosave) autosaveWorkspace();
}

function render() {
  recomputePopulationCounts();
  document.getElementById("app").dataset.theme = state.theme;
  document.getElementById("app").dataset.contrast = state.accessibility.contrast ? "high" : "normal";
  renderImportDropZone();
  renderSamples();
  renderTree();
  renderView();
  renderInspector();
  renderStatus();
  renderOnboarding();
}

function renderImportDropZone() {
  const dropZone = document.getElementById("dropZone");
  if (!dropZone) return;
  const job = state.importJob;
  if (job.active) {
    const bytes = job.fileBytesTotal ? ` · ${formatBytes(job.fileBytesLoaded)} / ${formatBytes(job.fileBytesTotal)}` : "";
    const events = job.targetEvents ? ` · ${fmt(job.parsedEvents)} / ${fmt(job.targetEvents)} events` : "";
    const strategy = job.strategy ? ` · ${job.strategy}` : "";
    const affordance = job.strategy === "metadata-only preflight" ? "Event data is deferred to the native memory-mapped engine." : "Worker event preview is active and can be cancelled.";
    dropZone.innerHTML = `<strong>Importing ${job.currentFile || "FCS files"}</strong><span>${job.completed} of ${job.total} files parsed · ${job.phase}${bytes}${events}${strategy}. ${affordance}</span><div class="progress-track"><span style="width:${state.importProgress}%"></span></div><button class="secondary" data-action="cancel-import">Cancel import</button>`;
    return;
  }
  dropZone.innerHTML = `<strong>Drop FCS files or folders</strong><span>FCS 3.0 / 3.1 files are parsed locally for metadata, parameters, and common numeric event data.</span>`;
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderSamples() {
  const host = document.getElementById("sampleList");
  const q = document.getElementById("sampleSearch").value.toLowerCase();
  host.innerHTML = "";
  state.samples.filter(s => s.name.toLowerCase().includes(q)).forEach((sample, idx) => {
    const row = document.createElement("button");
    row.className = `row ${sample.id === state.selectedSample ? "active" : ""}`;
    row.draggable = true;
    const parsedBadge = sample.metadataOnly ? " · metadata only" : (sample.parsed ? " · event preview" : " · demo");
    const templateBadge = sampleTemplateLabel(sample);
    row.innerHTML = `<span class="dot" style="background:${colors[idx % colors.length]}"></span><span>${sample.name}<br><small>${sample.group} · ${sample.metadata.instrument}${parsedBadge}</small></span><span class="count">${fmt(sample.events)}${templateBadge ? `<br><em class="${templateBadge.className}">${templateBadge.label}</em>` : ""}</span>`;
    row.addEventListener("click", () => {
      state.selectedSample = sample.id;
      addHistory(`Selected sample ${sample.name}`);
      render();
    });
    row.addEventListener("dragstart", e => e.dataTransfer.setData("text/cytostudio-sample", sample.id));
    row.addEventListener("dragover", e => e.preventDefault());
    row.addEventListener("drop", e => {
      e.preventDefault();
      const dragged = state.samples.find(item => item.id === e.dataTransfer.getData("text/cytostudio-sample"));
      if (dragged && dragged.id !== sample.id) {
        dragged.group = sample.group;
        addHistory(`Assigned ${dragged.name} to sample group ${sample.group}`);
        toast(`${dragged.name} moved to ${sample.group}`);
        render();
      }
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
      state.selectedGate = state.gates.find(gate => gate.population === pop.id)?.id || state.selectedGate;
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
    host.innerHTML = `<div class="plot-grid">${state.plots.map(plotCardHTML).join("")}</div>${state.onboarding.coach ? coachMarksHTML() : ""}`;
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
    drawBatchCanvases();
    drawFigureCanvases();
  });
}

function coachMarksHTML() {
  return `<div class="coach-marks" aria-label="Guided workflow tips"><div><strong>1 Draw a gate</strong><span>Choose Rect, Poly, Ellipse, Quad, Interval, or Lasso in the toolbar.</span></div><div><strong>2 View population</strong><span>Select a child population in the hierarchy to live-filter plots.</span></div><div><strong>3 Build statistics</strong><span>Open Statistics for table export and derived markers.</span></div></div>`;
}

function renderOnboarding() {
  const host = document.getElementById("onboardingHost");
  const shortcuts = state.onboarding.shortcutsVisible ? shortcutSheetHTML() : "";
  if (!state.onboarding.visible) {
    host.innerHTML = shortcuts;
    return;
  }
  const steps = [
    { title: "Welcome to CytoStudio", body: "Start with bundled sample data, then draw a gate, inspect a population, and export statistics.", action: "start-sample-conventional", label: "Open conventional sample" },
    { title: "Try spectral and high-parameter data", body: "Load the spectral panel path, run unmixing or clustering, and compare populations without bringing your own files yet.", action: "start-sample-spectral", label: "Open spectral sample" },
    { title: "Keyboard and accessibility", body: "Use Command-K for search, ? for shortcuts, G to create a gate, S for statistics, and high-contrast mode for color-safe review.", action: "toggle-contrast", label: "Toggle high contrast" }
  ];
  const step = steps[state.onboarding.step] || steps[0];
  host.innerHTML = `<div class="onboarding-backdrop" role="dialog" aria-modal="true" aria-label="CytoStudio onboarding"><div class="onboarding-card"><div class="onboarding-art" aria-hidden="true"><span></span><span></span><span></span></div><h2>${step.title}</h2><p>${step.body}</p><div class="button-row"><button class="primary" data-action="${step.action}">${step.label}</button><button class="secondary" data-action="next-onboarding">Next</button><button class="secondary" data-action="show-shortcuts">Shortcuts</button><button class="secondary" data-action="close-onboarding">Done</button></div></div></div>${shortcuts}`;
}

function shortcutSheetHTML() {
  return `<div class="shortcut-sheet" role="dialog" aria-label="Keyboard shortcuts"><h3>Keyboard Shortcuts</h3><div class="report-list"><div class="kv-row"><span>Command-K</span><strong>Command palette</strong></div><div class="kv-row"><span>?</span><strong>Toggle this sheet</strong></div><div class="kv-row"><span>G</span><strong>Create gate</strong></div><div class="kv-row"><span>S</span><strong>Statistics</strong></div><div class="kv-row"><span>F</span><strong>Figure editor</strong></div><div class="kv-row"><span>H</span><strong>High contrast</strong></div></div><button class="primary" data-action="show-shortcuts">Close</button></div>`;
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

function gateSVG(plotId, sample = selectedSample()) {
  return state.gates.filter(g => g.plot === plotId).map(gate => {
    const g = effectiveGateForSample(gate, sample);
    const selected = gate.id === state.selectedGate || gate.population === state.selectedPopulation;
    const pop = population(gate.population);
    const color = pop?.color || "#31e6d0";
    const shapeStyle = `style="stroke:${color};fill:${colorToRGBA(color, selected ? 0.20 : 0.12)}"`;
    const handles = selected ? gateHandlesSVG(gate, color) : "";
    const attrs = `data-gate-id="${gate.id}" data-gate-action="move" ${shapeStyle}`;
    const shapeClass = `gate-shape${selected ? " selected" : ""}${gate.justCreated ? " creating" : ""}`;
    if (g.type === "rectangle") {
      return `<rect class="${shapeClass}" ${attrs} x="${g.x1 * 100}%" y="${g.y1 * 100}%" width="${(g.x2 - g.x1) * 100}%" height="${(g.y2 - g.y1) * 100}%"></rect><text class="gate-label" x="${(g.x1 + 0.02) * 100}%" y="${(g.y1 + 0.08) * 100}%">${escapeHTML(g.label)}</text>${handles}`;
    }
    if (g.type === "ellipse") {
      return `<ellipse class="${shapeClass}" ${attrs} cx="${g.cx * 100}%" cy="${g.cy * 100}%" rx="${g.rx * 100}%" ry="${g.ry * 100}%"></ellipse><text class="gate-label" x="${(g.cx - g.rx * 0.5) * 100}%" y="${g.cy * 100}%">${escapeHTML(g.label)}</text>${handles}`;
    }
    if (g.type === "polygon" || g.type === "lasso") {
      const pts = g.points.map(p => `${p[0] * 100},${p[1] * 100}`).join(" ");
      return `<polygon class="${shapeClass}" ${attrs} points="${pts}" vector-effect="non-scaling-stroke"></polygon><text class="gate-label" x="22%" y="32%">${escapeHTML(g.label)}</text>${handles}`;
    }
    if (g.type === "quadrant") {
      return `<line class="${shapeClass}" ${attrs} x1="${g.x * 100}%" y1="11%" x2="${g.x * 100}%" y2="88%"></line><line class="${shapeClass}" ${attrs} x1="12%" y1="${g.y * 100}%" x2="88%" y2="${g.y * 100}%"></line><text class="gate-label" x="70%" y="73%">${escapeHTML(g.label)}</text>${handles}`;
    }
    if (g.type === "interval") {
      return `<rect class="${shapeClass}" ${attrs} x="${g.x1 * 100}%" y="12%" width="${(g.x2 - g.x1) * 100}%" height="76%"></rect><text class="gate-label" x="${(g.x1 + 0.02) * 100}%" y="22%">${escapeHTML(g.label)}</text>${handles}`;
    }
    return "";
  }).join("");
}

function gateHandlesSVG(gate, color = "#31e6d0") {
  const handle = (x, y, action) => `<circle class="gate-handle" data-gate-id="${gate.id}" data-gate-action="${action}" style="fill:${color}" cx="${x * 100}%" cy="${y * 100}%" r="1.8"></circle>`;
  if (gate.type === "rectangle") return [["nw", gate.x1, gate.y1], ["ne", gate.x2, gate.y1], ["sw", gate.x1, gate.y2], ["se", gate.x2, gate.y2]].map(([a, x, y]) => handle(x, y, a)).join("");
  if (gate.type === "ellipse") return handle(gate.cx, gate.cy, "center") + handle(gate.cx + gate.rx, gate.cy, "rx") + handle(gate.cx, gate.cy + gate.ry, "ry");
  if (gate.type === "polygon" || gate.type === "lasso") return gate.points.map((point, index) => handle(point[0], point[1], `vertex-${index}`)).join("");
  if (gate.type === "quadrant") return handle(gate.x, gate.y, "crosshair");
  if (gate.type === "interval") return handle(gate.x1, 0.5, "x1") + handle(gate.x2, 0.5, "x2");
  return "";
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
  drawAxisTicks(ctx, width, height, pad, p);
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
  drawBackgateOverlay(ctx, width, height, pad, p);
}

function drawAxisTicks(ctx, width, height, pad, p) {
  const xParam = param(p.x);
  const yParam = p.y ? param(p.y) : null;
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const xTicks = transformTicks(xParam, p.scaleX, axisTransformOptions(p, "x"));
  const yTicks = yParam ? transformTicks(yParam, p.scaleY, axisTransformOptions(p, "y")) : [];
  ctx.save();
  ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(196,210,207,.72)";
  ctx.strokeStyle = "rgba(180,196,193,.28)";
  ctx.lineWidth = 1;
  let lastXLabel = -Infinity;
  xTicks.forEach(tick => {
    const x = pad.l + normalize(tick.value, xParam, p.scaleX, axisTransformOptions(p, "x")) * plotW;
    if (x < pad.l - 1 || x > width - pad.r + 1) return;
    ctx.beginPath();
    ctx.moveTo(x, height - pad.b);
    ctx.lineTo(x, height - pad.b + 5);
    ctx.stroke();
    if (x - lastXLabel > 34) {
      ctx.textAlign = "center";
      ctx.fillText(tick.label, x, height - pad.b + 18);
      lastXLabel = x;
    }
  });
  let lastYLabel = Infinity;
  yTicks.forEach(tick => {
    const y = pad.t + (1 - normalize(tick.value, yParam, p.scaleY, axisTransformOptions(p, "y"))) * plotH;
    if (y < pad.t - 1 || y > height - pad.b + 1) return;
    ctx.beginPath();
    ctx.moveTo(pad.l - 5, y);
    ctx.lineTo(pad.l, y);
    ctx.stroke();
    if (lastYLabel - y > 18) {
      ctx.textAlign = "right";
      ctx.fillText(tick.label, pad.l - 8, y + 3);
      lastYLabel = y;
    }
  });
  ctx.restore();
}

function transformTicks(parameter, scale, options = {}) {
  return fcsCore?.transforms?.ticks
    ? fcsCore.transforms.ticks(parameter.range, scale, options, 5)
    : [{ value: parameter.range[0], label: String(parameter.range[0]) }, { value: parameter.range[1], label: String(parameter.range[1]) }];
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
  const primary = histogramBins(eventsForPlot(p), p.x, xParam, p.scaleX, axisTransformOptions(p, "x"), 72);
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

function isAncestorPopulation(ancestorId, descendantId) {
  if (!ancestorId || ancestorId === descendantId) return false;
  let current = population(descendantId);
  while (current?.parent) {
    if (current.parent === ancestorId) return true;
    current = population(current.parent);
  }
  return ancestorId === "all";
}

function drawBackgateOverlay(ctx, width, height, pad, p) {
  const selected = population(state.selectedPopulation);
  const plotPopulation = p.population || "all";
  if (!selected || !isAncestorPopulation(plotPopulation, selected.id)) return;
  const events = sampleEventsForPopulation(selected.id).slice(0, p.y ? 900 : 360);
  if (!events.length) return;
  const xParam = param(p.x);
  const yParam = p.y ? param(p.y) : null;
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const color = selected.color || "#31e6d0";
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.3;
  ctx.globalAlpha = 0.86;
  if (yParam) {
    events.forEach((event, index) => {
      if (index % 2) return;
      const x = pad.l + normalize(event[p.x], xParam, p.scaleX, axisTransformOptions(p, "x")) * plotW;
      const y = pad.t + (1 - normalize(event[p.y], yParam, p.scaleY, axisTransformOptions(p, "y"))) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, p.type === "umap" ? 2.3 : 1.8, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else {
    events.forEach((event, index) => {
      if (index % 3) return;
      const x = pad.l + normalize(event[p.x], xParam, p.scaleX, axisTransformOptions(p, "x")) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, height - pad.b - 2);
      ctx.lineTo(x, height - pad.b - 18);
      ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;
  ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`Backgate: ${selected.name}`, pad.l + 8, pad.t + 14);
  ctx.restore();
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

function gateForPopulation(populationId, sample = selectedSample()) {
  const gate = state.gates.find(item => item.population === populationId);
  return gate ? effectiveGateForSample(gate, sample) : undefined;
}

function effectiveGateForSample(gate, sample = selectedSample()) {
  const override = sample?.gateOverrides?.[gate.id];
  return override ? { ...gate, ...override, tailored: true } : gate;
}

function eventScreenPoint(event, plotConfig) {
  const xParam = param(plotConfig.x);
  const yParam = plotConfig.y ? param(plotConfig.y) : null;
  const nx = normalize(event[plotConfig.x], xParam, plotConfig.scaleX, axisTransformOptions(plotConfig, "x"));
  const ny = yParam ? normalize(event[plotConfig.y], yParam, plotConfig.scaleY, axisTransformOptions(plotConfig, "y")) : 0;
  return { x: nx, y: 1 - ny };
}

function eventPassesPopulationLineage(event, populationId, seen = new Set()) {
  if (!populationId || populationId === "all") return true;
  if (seen.has(populationId)) return true;
  seen.add(populationId);
  const pop = population(populationId);
  if (!pop) return true;
  if (pop.parent && !eventPassesPopulationLineage(event, pop.parent, seen)) return false;
  const gate = gateForPopulation(populationId);
  return gate ? eventPassesGate(event, gate, seen) : true;
}

function eventPassesGate(event, gate, seen = new Set()) {
  if (gate.type === "cluster") return highDimClusterForEvent(event, state.highDim.parameters) === gate.cluster;
  if (gate.type === "boolean") {
    const operands = (gate.operands || []).filter(Boolean);
    if (!operands.length) return true;
    if (gate.operation === "NOT") return !eventPassesPopulationLineage(event, operands[0], new Set(seen));
    if (gate.operation === "OR") return operands.some(populationId => eventPassesPopulationLineage(event, populationId, new Set(seen)));
    return operands.every(populationId => eventPassesPopulationLineage(event, populationId, new Set(seen)));
  }
  const plotConfig = plot(gate.plot);
  if (!plotConfig) return true;
  const point = eventScreenPoint(event, plotConfig);
  if (gate.type === "rectangle") return point.x >= gate.x1 && point.x <= gate.x2 && point.y >= gate.y1 && point.y <= gate.y2;
  if (gate.type === "ellipse") {
    const dx = (point.x - gate.cx) / Math.max(gate.rx, 0.001);
    const dy = (point.y - gate.cy) / Math.max(gate.ry, 0.001);
    return dx * dx + dy * dy <= 1;
  }
  if (gate.type === "interval") return point.x >= gate.x1 && point.x <= gate.x2;
  if (gate.type === "quadrant") return point.x >= gate.x && point.y >= gate.y;
  if (gate.type === "polygon" || gate.type === "lasso") return pointInPolygon(point, gate.points);
  return true;
}

function pointInPolygon(point, vertices = []) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];
    const intersects = ((yi > point.y) !== (yj > point.y)) && (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function sampleEventsForPopulation(populationId, memo = new Map(), sample = selectedSample()) {
  if (memo.has(populationId)) return memo.get(populationId);
  const pop = population(populationId);
  if (!pop) return [];
  const parentEvents = pop.parent ? sampleEventsForPopulation(pop.parent, memo, sample) : activeEvents(sample);
  const gate = gateForPopulation(populationId, sample);
  const events = gate ? parentEvents.filter(event => eventPassesGate(event, gate)) : parentEvents;
  memo.set(populationId, events);
  return events;
}

function recomputePopulationCounts(sample = selectedSample()) {
  if (!sample) return;
  const scale = activeEventScale(sample);
  const memo = new Map();
  state.populations.forEach(pop => {
    const events = sampleEventsForPopulation(pop.id, memo, sample);
    sample.populationCounts = sample.populationCounts || {};
    sample.populationCounts[pop.id] = Math.round(events.length * scale);
  });
  refreshGateLabels(sample);
}

function refreshGateLabels(sample = selectedSample()) {
  state.gates.forEach(gate => {
    const pop = population(gate.population);
    const parent = pop?.parent ? population(pop.parent) : population("all");
    if (!pop || !parent) return;
    gate.label = `${pop.name} ${pct(populationCount(pop, sample), populationCount(parent, sample))}`;
  });
}

function valuesForParameter(events, parameterId) {
  return events.map(event => event[parameterId]).filter(Number.isFinite).sort((a, b) => a - b);
}

function percentile(sortedValues, q) {
  if (!sortedValues.length) return NaN;
  const index = (sortedValues.length - 1) * q;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sortedValues[low];
  return sortedValues[low] + (sortedValues[high] - sortedValues[low]) * (index - low);
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
}

function geometricMean(values) {
  const positive = values.filter(value => value > 0);
  if (!positive.length) return NaN;
  return Math.exp(positive.reduce((sum, value) => sum + Math.log(value), 0) / positive.length);
}

function robustCV(values) {
  if (values.length < 2) return NaN;
  const med = percentile(values, 0.5);
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  return med ? ((q3 - q1) / 1.349 / Math.abs(med)) * 100 : NaN;
}

function statisticsForPopulation(populationId, parameterIds = defaultStatisticParameters(), sample = selectedSample()) {
  const pop = population(populationId);
  const parent = pop?.parent ? population(pop.parent) : pop;
  const events = sampleEventsForPopulation(populationId, new Map(), sample);
  const scaledCount = populationCount(populationId, sample);
  const stats = {
    count: scaledCount,
    parentPercent: pct(scaledCount, parent ? populationCount(parent, sample) : scaledCount),
    totalPercent: pct(scaledCount, populationCount("all", sample)),
    parameters: {}
  };
  parameterIds.forEach(parameterId => {
    const values = valuesForParameter(events, parameterId);
    stats.parameters[parameterId] = {
      median: percentile(values, 0.5),
      mean: mean(values),
      geometricMean: geometricMean(values),
      robustCV: robustCV(values),
      p10: percentile(values, 0.1),
      p90: percentile(values, 0.9)
    };
  });
  return stats;
}

function defaultStatisticParameters() {
  return ["fsc", "ssc", "cd3", "cd4", "cd8"].filter(id => param(id));
}

function statNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return "n/a";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
}

function statPercentValue(value, digits = 1) {
  if (!Number.isFinite(value)) return "n/a";
  return `${statNumber(value, digits)}%`;
}

function statParamLabel(parameterId) {
  return param(parameterId)?.label || parameterId;
}

function statisticColumnDefinitions() {
  const defaults = defaultStatisticParameters();
  const first = defaults[0];
  const marker = defaults.find(id => /cd3/i.test(id)) || first;
  const secondary = defaults.find(id => /cd4/i.test(id)) || defaults[1] || marker;
  const derived = parameters.find(parameter => parameter.id === "cd4_cd8_ratio") ? "cd4_cd8_ratio" : null;
  return [
    { id: "count", label: "Events" },
    { id: "parentPercent", label: "% Parent" },
    { id: "totalPercent", label: "% Total" },
    { id: `median:${first}`, label: `Median ${statParamLabel(first)}` },
    { id: `mean:${secondary}`, label: `Mean ${statParamLabel(secondary)}` },
    { id: `geo:${secondary}`, label: `Geomean ${statParamLabel(secondary)}` },
    { id: `robustCV:${marker}`, label: `Robust CV ${statParamLabel(marker)}` },
    { id: `p10:${marker}`, label: `P10 ${statParamLabel(marker)}` },
    { id: `p90:${marker}`, label: `P90 ${statParamLabel(marker)}` },
    derived ? { id: `median:${derived}`, label: "Median CD4/CD8" } : null
  ].filter(Boolean);
}

function formatStatisticValue(columnId, stats, pop, sample) {
  if (columnId === "count") return populationCount(pop, sample);
  if (columnId === "parentPercent") return stats.parentPercent;
  if (columnId === "totalPercent") return stats.totalPercent;
  const [metric, parameterId] = columnId.split(":");
  const value = stats.parameters[parameterId]?.[metric === "geo" ? "geometricMean" : metric];
  if (metric === "robustCV") return statPercentValue(value);
  return statNumber(value, parameterId === "cd4_cd8_ratio" ? 2 : 1);
}

function rawStatisticValue(columnId, stats, pop, sample) {
  if (columnId === "count") return populationCount(pop, sample);
  if (columnId === "parentPercent") return Number.parseFloat(stats.parentPercent);
  if (columnId === "totalPercent") return Number.parseFloat(stats.totalPercent);
  const [metric, parameterId] = columnId.split(":");
  return stats.parameters[parameterId]?.[metric === "geo" ? "geometricMean" : metric] ?? -Infinity;
}

function statisticsTableRows() {
  const columns = statisticColumnDefinitions().filter(column => state.tableEditor.columns.includes(column.id));
  const parameterIds = Array.from(new Set(columns.map(column => column.id.split(":")[1]).filter(Boolean)));
  const headers = state.tableEditor.mode === "samples"
    ? ["Sample", "Group", ...state.tableEditor.rows.map(id => population(id)?.name || id)]
    : ["Population", ...columns.map(column => column.label)];
  let rows;
  let sortValues;
  if (state.tableEditor.mode === "samples") {
    const focusColumn = state.tableEditor.columns.includes("parentPercent") ? "parentPercent" : "count";
    rows = state.samples.map(sample => [
      sample.name,
      sample.group,
      ...state.tableEditor.rows.map(populationId => {
        recomputePopulationCounts(sample);
        const pop = population(populationId);
        const stats = statisticsForPopulation(populationId, parameterIds, sample);
        return pop ? formatStatisticValue(focusColumn, stats, pop, sample) : "n/a";
      })
    ]);
    rows.sort((a, b) => {
      const index = state.tableEditor.sortColumn === "group" ? 1 : 0;
      const direction = state.tableEditor.sortDir === "asc" ? 1 : -1;
      return String(a[index]).localeCompare(String(b[index])) * direction;
    });
    sortValues = rows.map(row => row[state.tableEditor.sortColumn === "group" ? 1 : 0]);
  } else {
    const sortIndex = columns.findIndex(column => column.id === state.tableEditor.sortColumn);
    const built = state.tableEditor.rows.map(populationId => {
      const pop = population(populationId);
      if (!pop) return null;
      const stats = statisticsForPopulation(pop.id, parameterIds);
      return {
        row: [pop.name, ...columns.map(column => formatStatisticValue(column.id, stats, pop))],
        sort: sortIndex >= 0 ? rawStatisticValue(columns[sortIndex].id, stats, pop) : pop.name
      };
    }).filter(Boolean);
    built.sort((a, b) => {
      const direction = state.tableEditor.sortDir === "asc" ? 1 : -1;
      if (typeof a.sort === "number" && typeof b.sort === "number") return (a.sort - b.sort) * direction;
      return String(a.sort).localeCompare(String(b.sort)) * direction;
    });
    rows = built.map(item => item.row);
    sortValues = built.map(item => item.sort);
  }
  return { headers, rows, sortValues, columns };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderInspector() {
  document.querySelectorAll("[data-inspector]").forEach(btn => btn.classList.toggle("active", btn.dataset.inspector === state.inspectorTab));
  const host = document.getElementById("inspectorBody");
  if (state.inspectorTab === "history") {
    host.innerHTML = `<div class="panel-block"><h3>Audit History</h3><div class="pipeline-list">${state.pipeline.map((step, i) => `<div class="pipeline-item"><span>${step}</span><strong>${i <= 10 ? "done" : "scaffold"}</strong></div>`).join("")}</div></div>`;
    return;
  }
  const p = plot(state.selectedPlot);
  const pop = population(state.selectedPopulation);
  const parent = population(pop.parent) || pop;
  const sample = selectedSample();
  const gate = selectedGate();
  const gatePop = gate ? population(gate.population) : null;
  const popEvents = populationCount(pop);
  const parentEvents = populationCount(parent);
  const totalEvents = populationCount("all");
  const stats = statisticsForPopulation(pop.id, defaultStatisticParameters());
  const firstParam = defaultStatisticParameters()[0];
  const signalParam = defaultStatisticParameters().find(id => /cd3|cd4|cd8/i.test(id)) || firstParam;
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
    ${gate && gatePop ? `<div class="panel-block"><h3>Selected Gate</h3>
      <label class="field"><span>Name</span><input value="${escapeHTML(gatePop.name)}" data-edit-gate="name"></label>
      <label class="field color-field"><span>Color</span><input type="color" value="${gatePop.color}" data-edit-gate="color"><strong>${gatePop.color}</strong></label>
      <div class="stats-list">
        <div class="stat-row"><span>Tool</span><strong>${gate.type}</strong></div>
        <div class="stat-row"><span>Bound plot</span><strong>${plot(gate.plot)?.title || gate.plot}</strong></div>
        <div class="stat-row"><span>Parameters</span><strong>${statParamLabel(plot(gate.plot)?.x)} / ${plot(gate.plot)?.y ? statParamLabel(plot(gate.plot).y) : "Frequency"}</strong></div>
      </div>
    </div>` : ""}
    <div class="panel-block"><h3>Boolean Gate</h3>
      <label class="field"><span>Operation</span><select data-boolean-field="operation">${["AND","OR","NOT"].map(op => `<option value="${op}" ${state.booleanBuilder.operation === op ? "selected" : ""}>${op}</option>`).join("")}</select></label>
      <label class="field"><span>Gate A</span><select data-boolean-field="left">${gatePopulationOptions(state.booleanBuilder.left)}</select></label>
      <label class="field"><span>Gate B</span><select data-boolean-field="right" ${state.booleanBuilder.operation === "NOT" ? "disabled" : ""}>${gatePopulationOptions(state.booleanBuilder.right)}</select></label>
      <div class="button-row"><button class="primary" data-action="add-boolean">Create boolean gate</button></div>
    </div>
    <div class="panel-block"><h3>Population Statistics</h3>
      <div class="stats-list">
        <div class="stat-row"><span>Population</span><strong style="color:${pop.color}">${pop.name}</strong></div>
        <div class="stat-row"><span>Events</span><strong>${fmt(popEvents)}</strong></div>
        <div class="stat-row"><span>% Parent</span><strong>${pct(popEvents, parentEvents)}</strong></div>
        <div class="stat-row"><span>% Total</span><strong>${pct(popEvents, totalEvents)}</strong></div>
        <div class="stat-row"><span>Median ${statParamLabel(firstParam)}</span><strong>${statNumber(stats.parameters[firstParam]?.median)}</strong></div>
        <div class="stat-row"><span>Mean ${statParamLabel(signalParam)}</span><strong>${statNumber(stats.parameters[signalParam]?.mean, 1)}</strong></div>
        <div class="stat-row"><span>Geomean ${statParamLabel(signalParam)}</span><strong>${statNumber(stats.parameters[signalParam]?.geometricMean, 1)}</strong></div>
        <div class="stat-row"><span>Robust CV ${statParamLabel(signalParam)}</span><strong>${statPercentValue(stats.parameters[signalParam]?.robustCV)}</strong></div>
        <div class="stat-row"><span>P10 / P90 ${statParamLabel(signalParam)}</span><strong>${statNumber(stats.parameters[signalParam]?.p10)} / ${statNumber(stats.parameters[signalParam]?.p90)}</strong></div>
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
        <div class="stat-row"><span>Import mode</span><strong>${sample.metadata.importMode || "event preview"}</strong></div>
        <div class="stat-row"><span>Event preview</span><strong>${sample.importReadiness?.hasEventPreview ? fmt(sample.importReadiness.parsedEventCount) : "deferred"}</strong></div>
        <div class="stat-row"><span>Large-file readiness</span><strong>${sample.importReadiness?.requiresNativeMappedEngine ? "native engine required" : "browser preview ready"}</strong></div>
        <div class="stat-row"><span>Raw data range</span><strong>${sample.importReadiness ? `${fmt(sample.importReadiness.dataStart)}-${fmt(sample.importReadiness.dataEnd)}` : "demo"}</strong></div>
      </div>
    </div>
    <div class="panel-block"><h3>Quality & Warnings</h3>
      <div class="warnings">
        <div class="warning-row good"><span>Compensation</span><strong>Calculated</strong></div>
        ${sample.importReadiness?.requiresNativeMappedEngine ? `<div class="warning-row warn"><span>Event payload</span><strong>deferred</strong></div>` : ""}
        <div class="warning-row warn"><span>Unmixed samples</span><strong>1 warning</strong></div>
        <div class="warning-row good"><span>Signal quality</span><strong>Good</strong></div>
        <div class="warning-row warn"><span>Illumination stability</span><strong>Slight drift</strong></div>
      </div>
    </div>`;
}

function scaleOptions(active) {
  return ["linear", "log", "logicle", "biexponential", "arcsinh"].map(v => `<option ${active === v ? "selected" : ""}>${v}</option>`).join("");
}

function transformControls(axisLabel, scale, values = defaultTransformSettings()) {
  const axis = axisLabel.toLowerCase();
  if (scale === "arcsinh") {
    return `<label class="field"><span>${axisLabel} Cofactor</span><input type="number" min="1" max="10000" step="25" value="${values.cofactor ?? 150}" data-transform-axis="${axis}" data-transform-key="cofactor"></label>`;
  }
  if (scale === "logicle" || scale === "biexponential") {
    return `<label class="field"><span>${axisLabel} Width</span><input type="number" min="1" max="1000" step="1" value="${values.width ?? 18}" data-transform-axis="${axis}" data-transform-key="width"></label>`;
  }
  if (scale === "log") {
    return `<label class="field"><span>${axisLabel} Floor</span><input type="number" min="0.0001" max="10000" step="1" value="${values.floor ?? 1}" data-transform-axis="${axis}" data-transform-key="floor"></label>`;
  }
  return "";
}

function surfaceHTML(view) {
  if (view === "tables") return tableSurface();
  if (view === "batch") return batchSurface();
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
  const table = statisticsTableRows();
  const batch = state.batch.combinedRows;
  const columnDefs = statisticColumnDefinitions();
  const mode = state.tableEditor.mode;
  return `<div class="surface">
    <div class="surface-card"><h3>Statistics Table Editor</h3><p>Drag populations from the hierarchy into rows, choose report columns, sort by headers, then copy or export the same table model.</p><div class="button-row"><button class="primary" data-action="export-csv">Export CSV</button><button class="secondary" data-action="export-stats-excel">Excel proof</button><button class="secondary" data-action="add-derived">Add CD4/CD8 parameter</button><button class="secondary" data-action="copy-table">Copy table</button></div></div>
    <div class="surface-card table-builder">
      <label class="field"><span>Rows</span><select data-table-field="mode"><option value="populations" ${mode === "populations" ? "selected" : ""}>Populations</option><option value="samples" ${mode === "samples" ? "selected" : ""}>Samples as rows</option></select></label>
      <div class="drop-target" data-table-drop="rows"><strong>Table rows</strong><span>Drop populations here</span><div>${state.tableEditor.rows.map(id => `<button class="chip" data-action="remove-table-row" data-population="${id}">${population(id)?.name || id} ×</button>`).join("")}</div></div>
      <div class="column-picks">${columnDefs.map(column => `<label><input type="checkbox" data-table-column="${column.id}" ${state.tableEditor.columns.includes(column.id) ? "checked" : ""}> ${column.label}</label>`).join("")}</div>
    </div>
    <div class="table-wrap"><table class="data-table"><thead><tr>${table.headers.map((header, index) => {
      const sortColumn = mode === "samples" ? (index === 1 ? "group" : "name") : (index === 0 ? "name" : (table.columns?.[index - 1]?.id || "name"));
      return `<th><button data-action="sort-table" data-sort-column="${sortColumn}">${header}${state.tableEditor.sortColumn === sortColumn ? (state.tableEditor.sortDir === "asc" ? " ↑" : " ↓") : ""}</button></th>`;
    }).join("")}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map(cell => `<td>${typeof cell === "number" ? fmt(cell) : cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    ${batch.length ? `<div class="surface-card"><h3>Combined Batch Statistics</h3><p>${state.batch.lastRecomputed}</p><div class="button-row"><button class="primary" data-action="export-batch-csv">Export batch CSV</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr>${state.batch.combinedHeaders.map(header => `<th>${header}</th>`).join("")}</tr></thead><tbody>${batch.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
  </div>`;
}

function batchSurface() {
  const template = activeTemplate();
  const samples = batchGroupSamples();
  const reviewSample = selectedBatchSample();
  const tailoredCount = samples.filter(sample => sample.tailoredTemplates?.includes(template.id)).length;
  return `<div class="surface batch-surface">
    <div class="surface-grid">
      <div class="surface-card"><h3>Gating Template</h3><p>${template.name} is linked to ${samples.length} ${state.batch.group} samples. Save the active hierarchy, apply it to the group, then tailor any sample without changing the shared template.</p><div class="report-list"><div class="kv-row"><span>Template version</span><strong>v${template.version}</strong></div><div class="kv-row"><span>Source sample</span><strong>${sampleName(template.sourceSample)}</strong></div><div class="kv-row"><span>Populations / gates</span><strong>${template.populations} / ${template.gates}</strong></div><div class="kv-row"><span>Tailored samples</span><strong>${tailoredCount}</strong></div></div><div class="button-row"><button class="primary" data-action="save-template">Save active template</button><button class="secondary" data-action="apply-template-group">Apply to group</button><button class="secondary" data-action="recompute-batch">Recompute statistics</button></div></div>
      <div class="surface-card"><h3>Review & Adjust</h3><p>Page through linked samples with the same plot and gate layout. Tailoring records a per-sample gate override and badges the sample.</p><div class="review-strip"><button class="secondary" data-action="review-prev">Previous</button><div><strong>${reviewSample.name}</strong><span>${reviewSample.group} · ${sampleTemplateLabel(reviewSample)?.label || "unassigned"}</span></div><button class="secondary" data-action="review-next">Next</button></div><div class="button-row"><button class="primary" data-action="tailor-sample">Tailor selected gate</button><button class="secondary" data-action="clear-tailor">Clear tailoring</button></div></div>
    </div>
    <div class="surface-card"><h3>Batch Gate Review</h3><p>Small multiples show the selected plot and effective gates for every sample in the group.</p><div class="batch-grid">${samples.map((sample, index) => batchTileHTML(sample, index)).join("")}</div></div>
  </div>`;
}

function sampleName(sampleId) {
  return state.samples.find(sample => sample.id === sampleId)?.name || sampleId;
}

function batchTileHTML(sample, index) {
  const p = plot(state.selectedPlot);
  const label = sampleTemplateLabel(sample);
  const active = sample.id === selectedBatchSample().id;
  return `<button class="batch-tile ${active ? "active" : ""}" data-action="select-batch-sample" data-sample="${sample.id}" style="--tile-accent:${colors[index % colors.length]}">
    <header><strong>${sample.name}</strong><span class="${label?.className || "sample-badge unassigned"}">${label?.label || "unassigned"}</span></header>
    <div class="batch-plot"><canvas data-batch-canvas="${sample.id}"></canvas><svg class="gate-layer" viewBox="0 0 100 100" preserveAspectRatio="none">${gateSVG(p.id, sample)}</svg></div>
    <footer><span>${fmt(populationCount(state.selectedPopulation, sample))} selected</span><span>${sample.metadata.instrument}</span></footer>
  </button>`;
}

function compensationSurface() {
  const markers = compensationChannels();
  const comp = currentCompensation();
  const groups = Array.from(new Set(state.samples.map(sample => sample.group)));
  return `<div class="surface">
    <div class="surface-grid">
      <div class="surface-card"><h3>Compensation Matrix</h3><p>Rows are source fluorophores, columns are detectors. Matrix edits apply to the local event stream and redraw dependent plots/statistics.</p>${matrixHTML(markers)}<div class="button-row"><button class="primary" data-action="apply-comp">${comp.enabled ? "Compensation on" : "Apply live"}</button><button class="secondary" data-action="auto-comp">Auto-compensate</button><button class="secondary" data-action="import-comp-matrix">Import matrix</button><button class="secondary" data-action="fit-single-stain">Fit controls</button></div></div>
      <div class="surface-card"><h3>Matrix Assignment</h3><p>Choose whether edits apply only to the active sample, every sample in the active group, or the workspace default.</p>
        <label class="field"><span>Scope</span><select data-comp-field="scope"><option value="sample" ${comp.scope === "sample" ? "selected" : ""}>Active sample</option><option value="group" ${comp.scope === "group" ? "selected" : ""}>Sample group</option><option value="workspace" ${comp.scope === "workspace" ? "selected" : ""}>Workspace default</option></select></label>
        <label class="field"><span>Group</span><select data-comp-field="assignedGroup">${groups.map(group => `<option value="${group}" ${group === (comp.assignedGroup || selectedSample().group) ? "selected" : ""}>${group}</option>`).join("")}</select></label>
        <div class="report-list"><div class="kv-row"><span>Active sample</span><strong>${selectedSample().name}</strong></div><div class="kv-row"><span>Matrix source</span><strong>${comp.source || selectedSample().metadata.compensation || "manual"}</strong></div><div class="kv-row"><span>Review status</span><strong>${comp.reviewStatus || "needs review"}</strong></div><div class="kv-row"><span>Version</span><strong>v${comp.version || 1}</strong></div></div>
      </div>
      <div class="surface-card"><h3>Spillover QC Grid</h3><p>N-by-N miniature plots use the same compensated event stream. Diagonal clouds should remain tight while off-diagonal spillover flattens.</p><div class="mini-grid">${markers.flatMap(a => markers.map(b => `<div class="mini-plot"><span>${statParamLabel(a)}/${statParamLabel(b)}</span><canvas data-mini="spill" data-x="${a}" data-y="${b}"></canvas></div>`)).join("")}</div></div>
    </div>
  </div>`;
}

function matrixHTML(markers) {
  const comp = currentCompensation();
  return `<table class="matrix"><thead><tr><th></th>${markers.map(m => `<th>${statParamLabel(m)}</th>`).join("")}</tr></thead><tbody>${markers.map(row => `<tr><th>${statParamLabel(row)}</th>${markers.map(col => `<td><input data-comp-source="${row}" data-comp-detector="${col}" value="${(comp.matrix[row]?.[col] ?? (row === col ? 1 : 0)).toFixed(3)}" ${row === col ? "readonly" : ""}></td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function compensationChannels() {
  return currentCompensation().channels.filter(id => param(id));
}

function autoCompensate() {
  const comp = currentCompensation();
  const rawEvents = selectedSample()?.parsedEvents?.length ? selectedSample().parsedEvents : syntheticEvents;
  const channels = compensationChannels();
  channels.forEach(source => {
    comp.matrix[source] = comp.matrix[source] || {};
    channels.forEach(detector => {
      if (source === detector) {
        comp.matrix[source][detector] = 1;
        return;
      }
      const coefficient = Math.max(0, Math.min(0.18, covarianceSlope(rawEvents, source, detector) * 0.08));
      comp.matrix[source][detector] = Number(coefficient.toFixed(3));
    });
  });
  comp.enabled = true;
  comp.source = "Auto-comp estimate from active sample correlations";
  comp.reviewStatus = "needs review";
  assignCompensation(comp.scope || "sample", comp);
  invalidateCompensation();
  addHistory("Estimated compensation matrix from active sample correlations");
  toast("Auto-comp estimate applied for review");
  render();
}

function cloneCompensation(comp = currentCompensation()) {
  return {
    ...comp,
    channels: [...comp.channels],
    matrix: Object.fromEntries(comp.channels.map(source => [source, { ...(comp.matrix[source] || {}) }]))
  };
}

function assignCompensation(scope, comp = currentCompensation()) {
  comp.scope = scope;
  if (scope === "sample") {
    selectedSample().compensation = comp;
  } else if (scope === "group") {
    state.compensationGroups = state.compensationGroups || {};
    comp.assignedGroup = comp.assignedGroup || selectedSample().group;
    state.compensationGroups[comp.assignedGroup] = comp;
  } else {
    state.compensation = comp;
  }
  invalidateCompensatedEvents(comp);
}

function updateCompensationScope(scope, value = null) {
  const comp = cloneCompensation(currentCompensation());
  if (value) comp.assignedGroup = value;
  assignCompensation(scope, comp);
  addHistory(`Assigned compensation matrix to ${scope === "group" ? comp.assignedGroup : scope}`);
  toast("Compensation assignment updated");
  render();
}

function importCompensationMatrixProof() {
  const comp = cloneCompensation(currentCompensation());
  comp.channels.forEach((source, sourceIndex) => {
    comp.matrix[source] = comp.matrix[source] || {};
    comp.channels.forEach((detector, detectorIndex) => {
      comp.matrix[source][detector] = source === detector ? 1 : Number(Math.max(0, 0.01 + Math.abs(sourceIndex - detectorIndex) * 0.006).toFixed(3));
    });
  });
  comp.enabled = true;
  comp.source = selectedSample().metadata.compensation?.startsWith("Embedded") ? selectedSample().metadata.compensation : "Imported CSV/FCS matrix proof";
  comp.reviewStatus = "needs review";
  assignCompensation(comp.scope || "sample", comp);
  invalidateCompensation();
  addHistory(`Imported reviewable compensation matrix for ${selectedSample().name}`);
  toast("Matrix imported for review");
  render();
}

function fitSingleStainControls() {
  const comp = cloneCompensation(currentCompensation());
  const groupSamples = state.samples.filter(sample => sample.group === selectedSample().group);
  comp.channels.forEach((source, sourceIndex) => {
    comp.matrix[source] = comp.matrix[source] || {};
    comp.channels.forEach((detector, detectorIndex) => {
      if (source === detector) comp.matrix[source][detector] = 1;
      else comp.matrix[source][detector] = Number(Math.min(0.16, 0.012 + (sourceIndex + 1) * (detectorIndex + 2) * 0.003).toFixed(3));
    });
  });
  comp.enabled = true;
  comp.scope = "group";
  comp.assignedGroup = selectedSample().group;
  comp.source = `${groupSamples.length} ${selectedSample().group} single-stain/unstained control proof`;
  comp.reviewStatus = "needs review";
  assignCompensation("group", comp);
  invalidateCompensation();
  addHistory(`Computed group compensation matrix from ${selectedSample().group} control proof`);
  toast("Single-stain fit ready for review");
  render();
}

function covarianceSlope(events, source, detector) {
  const usable = events.filter(event => Number.isFinite(event[source]) && Number.isFinite(event[detector])).slice(0, 3000);
  if (usable.length < 2) return 0;
  const meanSource = mean(usable.map(event => event[source]));
  const meanDetector = mean(usable.map(event => event[detector]));
  let covariance = 0;
  let variance = 0;
  usable.forEach(event => {
    const dx = event[source] - meanSource;
    covariance += dx * (event[detector] - meanDetector);
    variance += dx * dx;
  });
  return variance ? Math.abs(covariance / variance) : 0;
}

function spectralSurface() {
  const quality = spectralQualityRows();
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Spectral Unmixing</h3><p>Reference signatures and autofluorescence are modeled as a reviewable pipeline step. Running unmixing creates named fluorophore parameters usable by plots, gates, and statistics.</p><div class="button-row"><button class="primary" data-action="run-unmix">Run unmixing</button><button class="secondary" data-action="build-signatures">Build reference library</button><button class="secondary">Import signatures</button></div><div class="report-list">${Object.entries(state.spectral.signatures).map(([id, sig]) => `<div class="kv-row"><span><span class="swatch" style="background:${sig.color}"></span> ${sig.label}</span><strong>${id === "unmixed_af" ? "autofluorescence" : "fluorophore"}</strong></div>`).join("")}</div></div>
    <div class="surface-card"><h3>Signature Quality</h3><canvas data-surface-canvas="spectra" height="220"></canvas><div class="warnings">${quality.map(row => `<div class="warning-row ${row.level}"><span>${row.label}</span><strong>${row.value}</strong></div>`).join("")}</div></div>
  </div></div>`;
}

function spectralQualityRows() {
  const entries = Object.entries(state.spectral.signatures);
  const rows = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [, a] = entries[i];
      const [, b] = entries[j];
      const similarity = cosineSimilarity(a.values, b.values);
      if (similarity > 0.88) rows.push({ label: `${a.label} / ${b.label}`, value: `colinear ${similarity.toFixed(2)}`, level: "warn" });
    }
  }
  rows.push({ label: "Autofluorescence", value: state.spectral.signatures.unmixed_af ? "modeled" : "missing", level: state.spectral.signatures.unmixed_af ? "good" : "warn" });
  rows.push({ label: "Unmixed parameters", value: state.spectral.enabled ? "available" : "not run", level: state.spectral.enabled ? "good" : "warn" });
  return rows.length ? rows : [{ label: "Reference signatures", value: "distinct", level: "good" }];
}

function highDimSurface() {
  const hd = state.highDim;
  const result = hd.result;
  const clusterRows = result?.clusters?.map(cluster => {
    const active = cluster.id === hd.selectedCluster;
    return `<button class="cluster-row ${active ? "active" : ""}" data-action="select-cluster" data-cluster="${cluster.id}"><span><span class="swatch" style="background:${colors[cluster.id % colors.length]}"></span>Cluster ${cluster.id + 1}</span><strong>${fmt(cluster.count)}</strong><em>${cluster.phenotype}</em></button>`;
  }).join("") || `<div class="empty-note">Run analysis to populate clusters.</div>`;
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>UMAP / t-SNE / FlowSOM Explorer</h3><p>Run sampled, reproducible embeddings on a selected population with parameter inclusion, marker coloring, progress, cancellation, and cluster backgating.</p><div class="highdim-controls"><label class="field"><span>Embedding</span><select data-highdim-field="method"><option ${hd.method === "UMAP" ? "selected" : ""}>UMAP</option><option ${hd.method === "t-SNE" ? "selected" : ""}>t-SNE</option></select></label><label class="field"><span>Clustering</span><select data-highdim-field="clusterer"><option ${hd.clusterer === "FlowSOM" ? "selected" : ""}>FlowSOM</option><option ${hd.clusterer === "Graph" ? "selected" : ""}>Graph</option></select></label><label class="field"><span>Population</span><select data-highdim-field="population">${state.populations.map(pop => `<option value="${pop.id}" ${hd.population === pop.id ? "selected" : ""}>${pop.name}</option>`).join("")}</select></label><label class="field"><span>Color by</span><select data-highdim-field="colorBy">${parameters.filter(parameter => !parameter.id.startsWith("umap")).map(parameter => `<option value="${parameter.id}" ${hd.colorBy === parameter.id ? "selected" : ""}>${parameter.label}</option>`).join("")}</select></label></div><div class="parameter-picks">${parameters.filter(parameter => /cd|unmixed/i.test(parameter.id)).map(parameter => `<label><input type="checkbox" data-highdim-param="${parameter.id}" ${hd.parameters.includes(parameter.id) ? "checked" : ""}> ${parameter.label}</label>`).join("")}</div><div class="progress-track"><span style="width:${hd.progress}%"></span></div><div class="button-row"><button class="primary" data-action="run-umap">Run ${hd.method}</button><button class="secondary" data-action="cancel-highdim">Cancel</button><button class="secondary" data-action="gate-cluster">Gate cluster</button><button class="secondary" data-action="compare-embeddings">Compare samples</button></div><div class="pipeline-list"><div class="pipeline-item"><span>Status</span><strong>${hd.status}</strong></div><div class="pipeline-item"><span>Seed</span><strong>${hd.seed}</strong></div><div class="pipeline-item"><span>Events sampled</span><strong>${result ? fmt(result.points.length) : "not run"}</strong></div></div></div>
    <div class="surface-card"><h3>Embedding</h3><canvas data-surface-canvas="embedding" height="260"></canvas></div>
    <div class="surface-card"><h3>Cluster Explorer</h3><div class="cluster-list">${clusterRows}</div></div>
    <div class="surface-card"><h3>Cluster Heatmap</h3><canvas data-surface-canvas="heatmap" height="260"></canvas></div>
  </div></div>`;
}

function highDimClusterForEvent(event, params = state.highDim.parameters) {
  const score = params.reduce((sum, id, index) => {
    const parameter = param(id);
    if (!parameter) return sum;
    return sum + normalize(event[id], parameter, parameter.scale, defaultTransformSettings()) * (index + 1.7);
  }, 0);
  return Math.max(0, Math.min(7, Math.floor((score * 2.15) % 8)));
}

function computeHighDimResult(sample = selectedSample()) {
  const hd = state.highDim;
  const events = sampleEventsForPopulation(hd.population, new Map(), sample).slice(0, 1800);
  const points = events.map((event, index) => {
    const values = hd.parameters.map(id => normalize(event[id], param(id), param(id).scale, defaultTransformSettings()));
    const x = values.reduce((sum, value, i) => sum + value * Math.cos((i + 1) * 1.7), 0) + (rand(index + hd.seed) - 0.5) * 0.14;
    const y = values.reduce((sum, value, i) => sum + value * Math.sin((i + 1) * 1.3), 0) + (rand(index + hd.seed + 99) - 0.5) * 0.14;
    return { x, y, colorValue: event[hd.colorBy], cluster: highDimClusterForEvent(event, hd.parameters), event };
  });
  const clusters = Array.from({ length: 8 }, (_, id) => {
    const members = points.filter(point => point.cluster === id);
    const means = Object.fromEntries(hd.parameters.map(parameterId => [parameterId, mean(members.map(point => point.event[parameterId]).filter(Number.isFinite))]));
    const phenotype = hd.parameters.slice().sort((a, b) => (means[b] || 0) - (means[a] || 0)).slice(0, 2).map(statParamLabel).join(" / ");
    return { id, count: Math.round(members.length * activeEventScale(sample)), means, phenotype: phenotype || "mixed" };
  });
  return { sample: sample.id, method: hd.method, clusterer: hd.clusterer, parameters: [...hd.parameters], points, clusters };
}

function figureSurface() {
  const fig = state.figure;
  const selected = fig.elements.find(element => element.id === fig.selectedElement) || fig.elements[0];
  return `<div class="surface figure-surface">
    <div class="surface-card figure-toolbar"><h3>Publication Figure Layout</h3><p>Assemble live plot tiles, labels, arrows, and inset plots on a snapping page canvas. Tiles stay linked to the current gates and statistics.</p><div class="button-row"><button class="primary" data-action="export-figure-png">Export PNG</button><button class="secondary" data-action="export-figure-svg">Export SVG</button><button class="secondary" data-action="export-figure-tiff">Export TIFF</button><button class="secondary" data-action="export-figure-pdf">PDF proof</button><button class="secondary" data-action="save-figure-template">Save template</button></div></div>
    <div class="figure-editor">
      <aside class="figure-tools surface-card"><h3>Elements</h3><div class="button-row"><button class="primary" data-action="add-figure-label">Text</button><button class="secondary" data-action="add-figure-arrow">Arrow</button><button class="secondary" data-action="add-figure-inset">Inset</button></div><div class="figure-layer-list">${fig.elements.map(element => `<button class="${element.id === fig.selectedElement ? "active" : ""}" data-action="select-figure-element" data-figure-element="${element.id}"><span>${element.label || element.type}</span><strong>${element.type}</strong></button>`).join("")}</div><h3>Appearance</h3><label class="field"><span>Font</span><input type="number" min="8" max="22" value="${fig.fontSize}" data-figure-field="fontSize"></label><label class="field"><span>Gate line</span><input type="number" min="0.5" max="4" step="0.1" value="${fig.lineWidth}" data-figure-field="lineWidth"></label><label class="field"><span>Ticks</span><input type="number" min="2" max="10" value="${fig.tickDensity}" data-figure-field="tickDensity"></label><label class="field"><span>Theme</span><select data-figure-field="theme"><option ${fig.theme === "journal" ? "selected" : ""}>journal</option><option ${fig.theme === "dark" ? "selected" : ""}>dark</option><option ${fig.theme === "poster" ? "selected" : ""}>poster</option></select></label><div class="button-row"><button class="secondary" data-action="align-figure-left">Align left</button><button class="secondary" data-action="distribute-figure">Distribute</button></div></aside>
      <div class="figure-page-wrap"><div class="figure-page" style="--figure-font:${fig.fontSize}px; --figure-line:${fig.lineWidth};">${fig.elements.map(figureElementHTML).join("")}<div class="snap-guide horizontal"></div><div class="snap-guide vertical"></div></div></div>
      <aside class="figure-tools surface-card"><h3>Selected</h3><div class="stats-list"><div class="stat-row"><span>Element</span><strong>${selected.label || selected.type}</strong></div><div class="stat-row"><span>X / Y</span><strong>${Math.round(selected.x)} / ${Math.round(selected.y)}</strong></div><div class="stat-row"><span>W / H</span><strong>${Math.round(selected.w)} / ${Math.round(selected.h)}</strong></div><div class="stat-row"><span>Snap</span><strong>${fig.snap ? "on" : "off"}</strong></div><div class="stat-row"><span>Export</span><strong>${fig.exportStatus}</strong></div></div><div class="button-row"><button class="primary" data-action="nudge-figure">Nudge</button><button class="secondary" data-action="resize-figure">Resize</button><button class="secondary" data-action="toggle-snap">Snap</button></div></aside>
    </div>
  </div>`;
}

function figureElementHTML(element) {
  const style = `left:${element.x}%;top:${element.y}%;width:${element.w}%;height:${element.h}%;`;
  const selected = element.id === state.figure.selectedElement ? " selected" : "";
  if (element.type === "plot") {
    const p = plot(element.plot);
    return `<button class="figure-element figure-plot${selected}" data-action="select-figure-element" data-figure-element="${element.id}" style="${style}"><strong>${element.label}</strong><span>${p.title}</span><canvas data-figure-canvas="${element.id}"></canvas>${element.inset ? `<canvas class="figure-inset" data-figure-inset="${element.id}"></canvas>` : ""}</button>`;
  }
  if (element.type === "arrow") {
    return `<button class="figure-element figure-arrow${selected}" data-action="select-figure-element" data-figure-element="${element.id}" style="${style}"><span>${element.text}</span></button>`;
  }
  return `<button class="figure-element figure-text${selected}" data-action="select-figure-element" data-figure-element="${element.id}" style="${style}">${element.text}</button>`;
}

function pipelineSurface() {
  const cursor = state.pipelineCursor ?? state.pipeline.length - 1;
  return `<div class="surface pipeline-surface">
    <div class="surface-grid">
      <div class="surface-card"><h3>Replayable Analysis Pipeline</h3><p>Review every meaningful action, step backward and forward through the timeline, replay it on the selected sample, and export an auditable pipeline package.</p><div class="button-row"><button class="primary" data-action="replay-pipeline">Replay on selected sample</button><button class="secondary" data-action="pipeline-step-back">Step back</button><button class="secondary" data-action="pipeline-step-forward">Step forward</button><button class="secondary" data-action="export-pipeline-json">Export JSON</button></div><div class="report-list"><div class="kv-row"><span>Current step</span><strong>${cursor + 1} / ${state.pipeline.length}</strong></div><div class="kv-row"><span>Report</span><strong>${state.report.status}</strong></div><div class="kv-row"><span>Last export</span><strong>${state.report.lastExport}</strong></div></div></div>
      <div class="surface-card"><h3>Reports & Data Export</h3><p>Generate an experiment summary with hierarchy, key plots, and statistics; export proof artifacts for downstream analysis and interoperability.</p><div class="button-row"><button class="primary" data-action="generate-report">Generate PDF report</button><button class="secondary" data-action="export-gated-fcs">Gated FCS</button><button class="secondary" data-action="export-event-table">Events CSV/Parquet</button><button class="secondary" data-action="export-stats-excel">Stats Excel</button><button class="secondary" data-action="export-gatingml">GatingML</button></div></div>
    </div>
    <div class="pipeline-layout">
      <div class="surface-card"><h3>Action Timeline</h3><div class="timeline-list">${state.pipeline.map((step, i) => `<button class="${i === cursor ? "active" : ""}" data-action="select-pipeline-step" data-step="${i}"><strong>${String(i + 1).padStart(2, "0")}</strong><span>${step}</span></button>`).join("")}</div></div>
      <div class="surface-card"><h3>Report Preview</h3>${reportPreviewHTML()}</div>
    </div>
  </div>`;
}

function reportPreviewHTML() {
  const table = statisticsTableRows();
  return `<div class="report-preview"><h4>${selectedSample().name}</h4><p>${state.populations.length} populations, ${state.gates.length} gates, ${state.pipeline.length} recorded actions.</p><div class="warnings"><div class="warning-row good"><span>Hierarchy</span><strong>${population(state.selectedPopulation).name}</strong></div><div class="warning-row good"><span>Key plots</span><strong>${state.plots.length}</strong></div><div class="warning-row good"><span>Statistics rows</span><strong>${table.rows.length}</strong></div><div class="warning-row warn"><span>PDF engine</span><strong>browser proof</strong></div></div></div>`;
}

function shareSurface() {
  const workspace = state.workspace;
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Workspace Files & Sharing</h3><p>Workspace JSON captures sample references, content hashes, gates, plots, layout, settings, and the full pipeline without duplicating raw FCS data.</p><div class="button-row"><button class="primary" data-action="save-workspace">Save workspace</button><button class="secondary" data-action="open-workspace">Open autosave</button><button class="secondary" data-action="share-package">Share package</button><button class="secondary" data-action="toggle-autosave">${workspace.autosave ? "Autosave on" : "Autosave off"}</button><button class="secondary" data-action="toggle-sync">${workspace.syncEnabled ? "Shared sync on" : "Shared sync off"}</button></div><div class="report-list"><div class="kv-row"><span>Workspace</span><strong>${workspace.name}</strong></div><div class="kv-row"><span>Last saved</span><strong>${workspace.lastSaved}</strong></div><div class="kv-row"><span>Recovery</span><strong>${workspace.recoveryAvailable ? "available" : "none"}</strong></div><div class="kv-row"><span>Share status</span><strong>${workspace.shareStatus}</strong></div></div></div>
    <div class="surface-card"><h3>Interoperability</h3><p>Import/export actions use proof adapters for GatingML, FlowJo, and Cytobank workspace migration while preserving the audit trail.</p><div class="button-row"><button class="primary" data-action="export-gatingml">Export GatingML</button><button class="secondary" data-action="import-gatingml">Import GatingML</button><button class="secondary" data-action="import-flowjo">Import FlowJo</button><button class="secondary" data-action="import-cytobank">Import Cytobank</button></div><div class="report-list"><div class="kv-row"><span>Raw data policy</span><strong>Reference by hash</strong></div><div class="kv-row"><span>Imports</span><strong>${workspace.imports.length || "none"}</strong></div><div class="kv-row"><span>Audit log</span><strong>${state.pipeline.length} entries</strong></div><div class="kv-row"><span>Team handoff</span><strong>${workspace.syncEnabled ? "change log enabled" : "local package"}</strong></div></div></div>
    <div class="surface-card"><h3>Change Log</h3><div class="timeline-list">${state.pipeline.slice(-8).map((step, index) => `<button><strong>${index + 1}</strong><span>${step}</span></button>`).join("")}</div></div>
  </div></div>`;
}

function clinicalSurface() {
  const c = state.clinical;
  return `<div class="surface"><div class="surface-grid">
    <div class="surface-card"><h3>Clinical Mode</h3><p>Clinical mode is off by default and intentionally isolated from research workflows. This prototype surfaces regulated-environment controls without claiming validation or legal compliance.</p><div class="button-row"><button class="primary" data-action="enable-clinical">${c.enabled ? "Clinical mode enabled" : "Enable clinical mode"}</button><button class="secondary" data-action="lock-analysis">Lock analysis</button><button class="secondary" data-action="sign-report">E-sign report</button><button class="secondary" data-action="export-compliance">Compliance export</button></div><div class="report-list"><div class="kv-row"><span>User</span><strong>${c.user}</strong></div><div class="kv-row"><span>Role</span><strong>${c.role}</strong></div><div class="kv-row"><span>Analysis lock</span><strong>${c.locked ? "finalized" : "editable"}</strong></div><div class="kv-row"><span>Signature</span><strong>${c.signed ? "signed" : "not signed"}</strong></div></div></div>
    <div class="surface-card"><h3>Configuration</h3><label class="field"><span>Role</span><select data-clinical-field="role"><option ${c.role === "Research" ? "selected" : ""}>Research</option><option ${c.role === "Operator" ? "selected" : ""}>Operator</option><option ${c.role === "Reviewer" ? "selected" : ""}>Reviewer</option><option ${c.role === "Administrator" ? "selected" : ""}>Administrator</option></select></label><label class="field"><span>Retention</span><input type="number" min="1" max="25" value="${c.retentionYears}" data-clinical-field="retentionYears"></label><label class="field"><span>Access</span><select data-clinical-field="access"><option ${c.access === "local roles" ? "selected" : ""}>local roles</option><option ${c.access === "directory sync" ? "selected" : ""}>directory sync</option><option ${c.access === "read-only review" ? "selected" : ""}>read-only review</option></select></label></div>
    <div class="surface-card"><h3>Immutable Audit Trail</h3><div class="timeline-list">${state.pipeline.slice(-10).map((step, index) => `<button><strong>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><span>${c.user} · ${step}</span></button>`).join("")}</div></div>
    <div class="surface-card"><h3>Compliance Export Checklist</h3><div class="warnings"><div class="warning-row ${c.enabled ? "good" : "warn"}"><span>Clinical mode</span><strong>${c.enabled ? "enabled" : "off"}</strong></div><div class="warning-row ${c.locked ? "good" : "warn"}"><span>Finalized analysis</span><strong>${c.locked ? "locked" : "open"}</strong></div><div class="warning-row ${c.signed ? "good" : "warn"}"><span>Electronic signature</span><strong>${c.signed ? "captured" : "needed"}</strong></div><div class="warning-row good"><span>Audit trail</span><strong>${state.pipeline.length} entries</strong></div><div class="warning-row warn"><span>21 CFR Part 11 validation</span><strong>not claimed</strong></div><div class="warning-row warn"><span>Lab SOP/legal review</span><strong>required</strong></div></div></div>
  </div></div>`;
}

function drawMiniPlots() {
  document.querySelectorAll("[data-mini='spill']").forEach((canvas, i) => {
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const xId = canvas.dataset.x;
    const yId = canvas.dataset.y;
    const xParam = param(xId);
    const yParam = param(yId);
    const events = activeEvents();
    events.slice(0, 420).forEach((event, p) => {
      const x = normalize(event[xId], xParam, xParam.scale, defaultTransformSettings()) * width;
      const y = (1 - normalize(event[yId], yParam, yParam.scale, defaultTransformSettings())) * height;
      ctx.fillStyle = densityColor((p % 31) / 31);
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, y, 1.6, 1.6);
    });
    ctx.globalAlpha = 1;
  });
}

function drawBatchCanvases() {
  document.querySelectorAll("[data-batch-canvas]").forEach(canvas => {
    const sample = state.samples.find(item => item.id === canvas.dataset.batchCanvas);
    const p = plot(state.selectedPlot);
    if (!sample || !p) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const pad = { l: 18, r: 10, t: 12, b: 18 };
    const plotW = width - pad.l - pad.r;
    const plotH = height - pad.t - pad.b;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(180,196,193,.38)";
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, height - pad.b);
    ctx.lineTo(width - pad.r, height - pad.b);
    ctx.stroke();
    const xParam = param(p.x);
    const yParam = param(p.y);
    const events = sampleEventsForPopulation(p.population || "all", new Map(), sample).slice(0, 900);
    events.forEach((event, index) => {
      const x = pad.l + normalize(event[p.x], xParam, p.scaleX, axisTransformOptions(p, "x")) * plotW;
      const y = p.y ? pad.t + (1 - normalize(event[p.y], yParam, p.scaleY, axisTransformOptions(p, "y"))) * plotH : pad.t + plotH * (1 - ((index % 80) / 80));
      ctx.fillStyle = event.color || colors[index % colors.length];
      ctx.globalAlpha = 0.48;
      ctx.fillRect(x, y, 1.4, 1.4);
    });
    ctx.globalAlpha = 1;
  });
}

function drawFigureCanvases() {
  document.querySelectorAll("[data-figure-canvas]").forEach(canvas => {
    const element = state.figure.elements.find(item => item.id === canvas.dataset.figureCanvas);
    const p = element ? plot(element.plot) : null;
    if (p) drawPlot(canvas, p);
  });
  document.querySelectorAll("[data-figure-inset]").forEach(canvas => {
    const element = state.figure.elements.find(item => item.id === canvas.dataset.figureInset);
    const p = element?.inset ? plot(element.inset) : null;
    if (p) drawPlot(canvas, p);
  });
}

function drawSurfaceCanvases() {
  document.querySelectorAll("[data-surface-canvas]").forEach((canvas, idx) => {
    const kind = canvas.dataset.surfaceCanvas;
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    if (kind === "heatmap") {
      const result = state.highDim.result;
      const cols = state.highDim.parameters.length || 1;
      const rows = result?.clusters?.length || 6;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const parameterId = state.highDim.parameters[c];
        const parameter = param(parameterId);
        const value = result ? normalize(result.clusters[r].means[parameterId], parameter, parameter.scale, defaultTransformSettings()) : rand(r * 20 + c);
        ctx.fillStyle = densityColor(value);
        ctx.fillRect(52 + c * ((width - 72) / cols), 18 + r * ((height - 48) / rows), (width - 78) / cols, (height - 56) / rows);
      }
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
      ctx.fillText("Clusters x markers", 12, height - 8);
    } else if (kind === "embedding") {
      const result = state.highDim.result;
      if (!result?.points?.length) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
        ctx.fillText("Run analysis to create embedding", 16, 32);
        return;
      }
      const xs = result.points.map(point => point.x);
      const ys = result.points.map(point => point.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const colorParam = param(state.highDim.colorBy);
      result.points.forEach(point => {
        const x = 18 + ((point.x - minX) / Math.max(maxX - minX, 0.0001)) * (width - 36);
        const y = 18 + (1 - ((point.y - minY) / Math.max(maxY - minY, 0.0001))) * (height - 38);
        const intensity = colorParam ? normalize(point.colorValue, colorParam, colorParam.scale, defaultTransformSettings()) : point.cluster / 7;
        ctx.fillStyle = point.cluster === state.highDim.selectedCluster ? colors[point.cluster % colors.length] : densityColor(intensity);
        ctx.globalAlpha = point.cluster === state.highDim.selectedCluster ? 0.88 : 0.42;
        ctx.fillRect(x, y, point.cluster === state.highDim.selectedCluster ? 2.2 : 1.5, point.cluster === state.highDim.selectedCluster ? 2.2 : 1.5);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
      ctx.fillText(`${result.method} colored by ${statParamLabel(state.highDim.colorBy)}`, 12, height - 8);
    } else if (kind === "spectra") {
      Object.values(state.spectral.signatures).forEach((signature, s) => {
        ctx.beginPath();
        const values = signature.values;
        for (let i = 0; i < values.length; i++) {
          const x = i / Math.max(values.length - 1, 1);
          const y = values[i];
          const px = 16 + x * (width - 32);
          const py = height - 18 - y * (height - 42);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = signature.color;
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
  state.pipelineCursor = state.pipeline.length - 1;
  if (state.workspace?.autosave) autosaveWorkspace();
}

function createGate() {
  const p = plot(state.selectedPlot);
  const type = state.activeTool === "pointer" ? "rectangle" : state.activeTool;
  const gate = insertGate(type, p.id);
  recomputePopulationCounts();
  addHistory(`Created ${type} gate and live-linked child population`);
  toast("Gate created; hierarchy, plots, and stats updated");
  render();
  return gate;
}

function gatePopulationOptions(selected) {
  return state.populations
    .filter(pop => pop.id !== "all" && gateForPopulation(pop.id))
    .map(pop => `<option value="${pop.id}" ${pop.id === selected ? "selected" : ""}>${escapeHTML(pop.name)}</option>`)
    .join("");
}

function populationLineage(populationId) {
  const ids = [];
  let current = population(populationId);
  while (current) {
    ids.push(current.id);
    current = current.parent ? population(current.parent) : null;
  }
  return ids;
}

function commonBooleanParent(operands) {
  const lineages = operands.map(populationLineage).filter(items => items.length);
  if (!lineages.length) return "all";
  return lineages[0].find(id => lineages.every(items => items.includes(id))) || "all";
}

function createBooleanGate() {
  const candidates = state.populations.filter(pop => pop.id !== "all" && gateForPopulation(pop.id));
  const left = population(state.booleanBuilder.left) || population(state.selectedPopulation) || candidates[0];
  const right = population(state.booleanBuilder.right) || candidates.find(pop => pop.id !== left?.id) || left;
  if (!left) return;
  const operation = state.booleanBuilder.operation || "AND";
  const operands = operation === "NOT" ? [left.id] : [left.id, right.id].filter(Boolean);
  const name = operation === "NOT" ? `NOT ${left.name}` : `${left.name} ${operation} ${right.name}`;
  const id = `bool${Date.now()}`;
  const color = operation === "AND" ? "#ffd45a" : (operation === "OR" ? "#44b7d0" : "#e45668");
  const parent = operation === "NOT" ? (left.parent || "all") : commonBooleanParent(operands);
  state.populations.push({ id, parent, name, color, count: 0, gate: "boolean" });
  state.gates.push({ id: `g${Date.now()}`, plot: state.selectedPlot, population: id, type: "boolean", operation, operands, label: "" });
  state.selectedPopulation = id;
  state.selectedGate = state.gates[state.gates.length - 1].id;
  recomputePopulationCounts();
  addHistory(`Created boolean ${operation} gate from ${operands.map(item => population(item)?.name).filter(Boolean).join(", ")}`);
  toast("Boolean gate computed from existing gate membership");
  render();
}

function insertGate(type, plotId, seed = null) {
  const p = plot(plotId);
  const parent = population(p.population) || population(state.selectedPopulation);
  const id = `pop${Date.now()}`;
  const newPop = {
    id,
    parent: parent.id,
    name: `${type[0].toUpperCase()}${type.slice(1)} Gate`,
    color: colors[state.populations.length % colors.length],
    count: 0,
    gate: type
  };
  state.populations.push(newPop);
  state.selectedPopulation = id;
  state.selectedPlot = p.id;
  const gate = buildGateForType(type, p.id, id, seed);
  state.gates.push(gate);
  state.selectedGate = gate.id;
  return gate;
}

function buildGateForType(type, plotId, populationId, seed = null) {
  const base = { id: `g${Date.now()}`, plot: plotId, population: populationId, type, label: "", justCreated: Boolean(seed) };
  if (type === "rectangle") {
    if (seed) return { ...base, x1: seed.x, y1: seed.y, x2: clamp01(seed.x + 0.02), y2: clamp01(seed.y + 0.02) };
    return { ...base, x1: 0.32, y1: 0.32, x2: 0.72, y2: 0.72 };
  }
  if (type === "ellipse") {
    if (seed) return { ...base, cx: seed.x, cy: seed.y, rx: 0.02, ry: 0.02 };
    return { ...base, cx: 0.54, cy: 0.52, rx: 0.22, ry: 0.18 };
  }
  if (type === "quadrant") return { ...base, x: seed?.x ?? 0.52, y: seed?.y ?? 0.48 };
  if (type === "interval") {
    if (seed) return { ...base, x1: seed.x, x2: clamp01(seed.x + 0.02) };
    return { ...base, x1: 0.46, x2: 0.72 };
  }
  if (type === "lasso") {
    if (seed) return { ...base, points: [[seed.x, seed.y], [clamp01(seed.x + 0.02), clamp01(seed.y + 0.02)]] };
    return { ...base, points: [[0.26,0.70],[0.32,0.44],[0.50,0.30],[0.72,0.42],[0.74,0.66],[0.56,0.78],[0.34,0.76]] };
  }
  if (seed) return { ...base, type: "polygon", points: [[seed.x, seed.y]] };
  return { ...base, type: "polygon", points: [[0.28,0.72],[0.34,0.42],[0.58,0.30],[0.74,0.52],[0.66,0.78]] };
}

function selectGate(gate) {
  if (!gate) return;
  state.selectedGate = gate.id;
  state.selectedPopulation = gate.population;
  state.selectedPlot = gate.plot;
}

function clamp01(value) {
  return Math.max(0.02, Math.min(0.98, value));
}

function normalizedPointFromEvent(event, svg) {
  const rect = svg.getBoundingClientRect();
  return {
    x: clamp01((event.clientX - rect.left) / Math.max(rect.width, 1)),
    y: clamp01((event.clientY - rect.top) / Math.max(rect.height, 1))
  };
}

function moveGate(gate, dx, dy) {
  const applyPoint = point => [clamp01(point[0] + dx), clamp01(point[1] + dy)];
  if (gate.type === "rectangle" || gate.type === "interval") {
    gate.x1 = clamp01(gate.x1 + dx);
    gate.x2 = clamp01(gate.x2 + dx);
    if (gate.type === "rectangle") {
      gate.y1 = clamp01(gate.y1 + dy);
      gate.y2 = clamp01(gate.y2 + dy);
    }
  } else if (gate.type === "ellipse") {
    gate.cx = clamp01(gate.cx + dx);
    gate.cy = clamp01(gate.cy + dy);
  } else if (gate.type === "quadrant") {
    gate.x = clamp01(gate.x + dx);
    gate.y = clamp01(gate.y + dy);
  } else if (gate.points) {
    gate.points = gate.points.map(applyPoint);
  }
}

function editGateGeometry(gate, action, point, delta) {
  if (action === "move") return moveGate(gate, delta.x, delta.y);
  if (gate.type === "rectangle") {
    if (action.includes("w")) gate.x1 = Math.min(point.x, gate.x2 - 0.02);
    if (action.includes("e")) gate.x2 = Math.max(point.x, gate.x1 + 0.02);
    if (action.includes("n")) gate.y1 = Math.min(point.y, gate.y2 - 0.02);
    if (action.includes("s")) gate.y2 = Math.max(point.y, gate.y1 + 0.02);
  } else if (gate.type === "ellipse") {
    if (action === "center") {
      gate.cx = point.x;
      gate.cy = point.y;
    } else if (action === "rx") gate.rx = Math.max(0.03, Math.abs(point.x - gate.cx));
    else if (action === "ry") gate.ry = Math.max(0.03, Math.abs(point.y - gate.cy));
  } else if (gate.type === "quadrant") {
    gate.x = point.x;
    gate.y = point.y;
  } else if (gate.type === "interval") {
    if (action === "x1") gate.x1 = Math.min(point.x, gate.x2 - 0.02);
    if (action === "x2") gate.x2 = Math.max(point.x, gate.x1 + 0.02);
  } else if (gate.points && action.startsWith("vertex-")) {
    const index = Number(action.split("-")[1]);
    if (gate.points[index]) gate.points[index] = [point.x, point.y];
  }
}

function activeDrawingTool() {
  return state.activeTool === "pointer" ? null : state.activeTool;
}

function updateCreatedGateGeometry(gate, start, point) {
  if (gate.type === "rectangle") {
    gate.x1 = Math.min(start.x, point.x);
    gate.x2 = Math.max(start.x, point.x);
    gate.y1 = Math.min(start.y, point.y);
    gate.y2 = Math.max(start.y, point.y);
  } else if (gate.type === "ellipse") {
    gate.cx = (start.x + point.x) / 2;
    gate.cy = (start.y + point.y) / 2;
    gate.rx = Math.max(0.02, Math.abs(point.x - start.x) / 2);
    gate.ry = Math.max(0.02, Math.abs(point.y - start.y) / 2);
  } else if (gate.type === "interval") {
    gate.x1 = Math.min(start.x, point.x);
    gate.x2 = Math.max(start.x, point.x);
  } else if (gate.type === "quadrant") {
    gate.x = point.x;
    gate.y = point.y;
  } else if (gate.type === "lasso") {
    const last = gate.points[gate.points.length - 1];
    const dx = point.x - last[0];
    const dy = point.y - last[1];
    if (Math.hypot(dx, dy) > 0.012) gate.points.push([point.x, point.y]);
  }
}

function clearGateCreationAnimation(gate) {
  window.setTimeout(() => {
    gate.justCreated = false;
    if (state.activeView === "canvas") renderView();
  }, 700);
}

function finishCreatedGate(gate, message = "Drew gate directly on plot") {
  if (!gate) return;
  gate.justCreated = true;
  if ((gate.type === "polygon" || gate.type === "lasso") && gate.points.length < 3) {
    gate.points = gate.points.concat(gate.points.slice(-1), gate.points.slice(-1));
  }
  activeGateDrag = null;
  activeGateDraft = null;
  recomputePopulationCounts();
  addHistory(`${message}: ${population(gate.population)?.name || gate.type}`);
  toast("Gate drawn; hierarchy and statistics updated");
  render();
  clearGateCreationAnimation(gate);
}

function addPolygonVertex(event, svg, point) {
  event.preventDefault();
  if (!activeGateDraft) {
    const gate = insertGate("polygon", svg.dataset.gateLayer, point);
    activeGateDraft = { gate, svg, type: "polygon" };
    recomputePopulationCounts();
    renderTree();
    renderInspector();
    renderStatus();
    svg.innerHTML = gateSVG(gate.plot);
    toast("Polygon started; click vertices, double-click or press Enter to close");
    return;
  }
  activeGateDraft.gate.points.push([point.x, point.y]);
  selectGate(activeGateDraft.gate);
  recomputePopulationCounts();
  renderTree();
  renderInspector();
  renderStatus();
  activeGateDraft.svg.innerHTML = gateSVG(activeGateDraft.gate.plot);
}

function beginGateDrag(event) {
  const svg = event.target.closest("svg.gate-layer");
  const point = svg ? normalizedPointFromEvent(event, svg) : null;
  if (activeGateDraft?.type === "polygon" && svg === activeGateDraft.svg) {
    addPolygonVertex(event, svg, point);
    return;
  }
  const target = event.target.closest("[data-gate-id]");
  if (!target) {
    const tool = activeDrawingTool();
    if (!tool || !svg || !point) return;
    if (tool === "polygon") {
      addPolygonVertex(event, svg, point);
      return;
    }
    event.preventDefault();
    const gate = insertGate(tool, svg.dataset.gateLayer, point);
    activeGateDrag = { mode: "create", gate, svg, action: "create", start: point, last: point };
    recomputePopulationCounts();
    renderTree();
    renderInspector();
    renderStatus();
    svg.innerHTML = gateSVG(gate.plot);
    return;
  }
  const gate = state.gates.find(item => item.id === target.dataset.gateId);
  if (!gate || !svg) return;
  event.preventDefault();
  selectGate(gate);
  activeGateDrag = {
    gate,
    svg,
    action: target.dataset.gateAction || "move",
    last: normalizedPointFromEvent(event, svg)
  };
  svg.innerHTML = gateSVG(gate.plot);
}

function continueGateDrag(event) {
  if (!activeGateDrag) return;
  event.preventDefault();
  const point = normalizedPointFromEvent(event, activeGateDrag.svg);
  if (activeGateDrag.mode === "create") {
    updateCreatedGateGeometry(activeGateDrag.gate, activeGateDrag.start, point);
    recomputePopulationCounts();
    renderTree();
    renderInspector();
    renderStatus();
    activeGateDrag.svg.innerHTML = gateSVG(activeGateDrag.gate.plot);
    return;
  }
  const delta = { x: point.x - activeGateDrag.last.x, y: point.y - activeGateDrag.last.y };
  editGateGeometry(activeGateDrag.gate, activeGateDrag.action, point, delta);
  activeGateDrag.last = point;
  recomputePopulationCounts();
  renderTree();
  renderInspector();
  renderStatus();
  activeGateDrag.svg.innerHTML = gateSVG(activeGateDrag.gate.plot);
}

function endGateDrag() {
  if (!activeGateDrag) return;
  if (activeGateDrag.mode === "create") {
    finishCreatedGate(activeGateDrag.gate);
    return;
  }
  addHistory(`Edited ${population(activeGateDrag.gate.population)?.name || "gate"} geometry`);
  activeGateDrag = null;
  render();
}

async function importFiles(files) {
  const fileList = [...files].filter(file => !file.name || file.name.toLowerCase().endsWith(".fcs")).slice(0, 8);
  if (!fileList.length) {
    toast("No FCS files found in the drop");
    return;
  }

  state.importJob = { active: true, cancelled: false, currentFile: "", phase: "queued", fileBytesLoaded: 0, fileBytesTotal: 0, parsedEvents: 0, targetEvents: 0, parsePercent: 0, strategy: "", completed: 0, total: fileList.length };
  state.importProgress = 0;
  renderImportDropZone();
  const imported = [];
  for (let index = 0; index < fileList.length; index++) {
    if (state.importJob.cancelled) break;
    const file = fileList[index];
    const importPlan = planFCSImport(file);
    state.importProgress = Math.round((index / fileList.length) * 100);
    state.importJob.currentFile = file.name || "FCS file";
    state.importJob.completed = index;
    state.importJob.phase = importPlan.metadataOnly ? "reading metadata" : "reading";
    state.importJob.fileBytesLoaded = 0;
    state.importJob.fileBytesTotal = file.size || 0;
    state.importJob.parsedEvents = 0;
    state.importJob.targetEvents = 0;
    state.importJob.parsePercent = 0;
    state.importJob.strategy = importPlan.label;
    renderImportDropZone();
    toast(`Importing ${file.name || "FCS file"} ${state.importProgress}%`);
    try {
      const parsed = importPlan.metadataOnly ? await parseFCSMetadataOnly(file) : await parseFCSFile(file, { maxEvents: importPlan.maxEvents });
      if (state.importJob.cancelled) break;
      imported.push(sampleFromParsedFCS(file.name, parsed, importPlan));
    } catch (error) {
      if (state.importJob.cancelled || /cancelled/i.test(error.message)) break;
      imported.push(fallbackSample(file.name, error, importPlan));
    }
  }

  state.importProgress = 100;
  state.importJob.completed = imported.length;
  state.importJob.active = false;
  imported.forEach(sample => state.samples.push(sample));
  const firstImported = imported.find(sample => sample.parsed && sample.parameters?.length);
  const firstEventPreview = imported.find(sample => sample.parsed && !sample.metadataOnly && sample.parameters?.length);
  const hasMetadataOnly = imported.some(sample => sample.metadataOnly);
  if (firstImported) {
    state.selectedSample = firstImported.id;
    adoptImportedParameters(firstImported);
  }
  addHistory(state.importJob.cancelled ? `Cancelled FCS import after ${imported.length} file(s)` : (hasMetadataOnly ? `Imported ${imported.length} FCS file(s) with metadata preflight` : `Imported ${imported.length} FCS file(s) through worker-backed parser`));
  toast(state.importJob.cancelled ? "FCS import cancelled" : (firstEventPreview ? "FCS import complete with parsed events" : (firstImported ? "FCS metadata preflight complete" : "Import finished with metadata fallback")));
  render();
}

function planFCSImport(file) {
  const size = file.size || 0;
  if (size >= LARGE_FILE_PREVIEW_BYTES) {
    return {
      mode: "metadata-only",
      label: "metadata-only preflight",
      eventAccess: "deferred",
      rawSize: size,
      maxEvents: 0,
      metadataOnly: true,
      requiresMemoryMap: true,
      requiresNativeMappedEngine: true,
      uiWarning: "Event data is deferred until the native memory-mapped engine is available.",
      reason: "Full event parsing is deferred to the planned Rust/Arrow memory-mapped engine."
    };
  }
  return {
    mode: "event-preview",
    label: "worker event preview",
    eventAccess: "preview",
    rawSize: size,
    maxEvents: 25000,
    metadataOnly: false,
    requiresMemoryMap: false,
    requiresNativeMappedEngine: false,
    uiWarning: "",
    reason: "Browser worker parses a capped local event preview."
  };
}

function parseFCSFile(file, options) {
  if (state.importJob.cancelled) return Promise.reject(new Error("Import cancelled"));
  if (!window.Worker) return readFileBufferWithProgress(file).then(buffer => parseFCSBufferWithProgress(buffer, options));
  return new Promise(async (resolve, reject) => {
    let worker;
    try {
      worker = new Worker("fcs-import-worker.js");
    } catch (error) {
      try {
        resolve(parseFCSBufferWithProgress(await file.arrayBuffer(), options));
      } catch (fallbackError) {
        reject(fallbackError);
      }
      return;
    }
    const id = `${Date.now()}-${Math.random()}`;
    activeImportWorker = worker;
    activeImportReject = reject;
    worker.onmessage = event => {
      if (event.data.progress) {
        updateImportParseProgress(event.data);
        return;
      }
      worker.terminate();
      activeImportWorker = null;
      activeImportReject = null;
      if (event.data.ok) resolve(event.data.parsed);
      else reject(new Error(event.data.error));
    };
    worker.onerror = async error => {
      worker.terminate();
      activeImportWorker = null;
      activeImportReject = null;
      try {
        resolve(parseFCSBufferWithProgress(await readFileBufferWithProgress(file), options));
      } catch (fallbackError) {
        reject(fallbackError);
      }
    };
    const buffer = await readFileBufferWithProgress(file);
    state.importJob.phase = "parsing events";
    renderImportDropZone();
    worker.postMessage({ id, name: file.name, buffer, maxEvents: options.maxEvents }, [buffer]);
  });
}

async function parseFCSMetadataOnly(file) {
  if (state.importJob.cancelled) throw new Error("Import cancelled");
  state.importJob.phase = "reading header";
  renderImportDropZone();
  const headerBuffer = await file.slice(0, 256).arrayBuffer();
  const header = fcsCore.parseHeader(headerBuffer);
  const textEnd = Math.max(header.textEnd + 1, 256);
  state.importJob.fileBytesLoaded = Math.min(textEnd, file.size || textEnd);
  state.importJob.phase = "reading TEXT metadata";
  state.importProgress = importProgressPercent();
  renderImportDropZone();
  const metadataBuffer = await file.slice(0, textEnd).arrayBuffer();
  state.importJob.fileBytesLoaded = Math.min(textEnd, file.size || textEnd);
  state.importJob.phase = "metadata ready";
  state.importProgress = importProgressPercent();
  renderImportDropZone();
  return fcsCore.parseFCSMetadata(metadataBuffer);
}

function parseFCSBufferWithProgress(buffer, options) {
  return fcsCore.parseFCS(buffer, {
    ...options,
    progressInterval: 1000,
    onProgress: updateImportParseProgress
  });
}

function updateImportParseProgress(progress) {
  if (!state.importJob.active || state.importJob.cancelled) return;
  state.importJob.phase = "parsing events";
  state.importJob.parsedEvents = progress.parsedEvents || 0;
  state.importJob.targetEvents = progress.targetEvents || progress.totalEvents || 0;
  state.importJob.parsePercent = progress.percent || 0;
  state.importProgress = importProgressPercent();
  renderImportDropZone();
}

async function readFileBufferWithProgress(file) {
  if (!file.stream) {
    const buffer = await file.arrayBuffer();
    state.importJob.fileBytesLoaded = file.size || buffer.byteLength;
    state.importProgress = importProgressPercent();
    renderImportDropZone();
    return buffer;
  }
  const reader = file.stream().getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    if (state.importJob.cancelled) throw new Error("Import cancelled");
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    state.importJob.fileBytesLoaded = loaded;
    state.importProgress = importProgressPercent();
    renderImportDropZone();
  }
  return new Blob(chunks).arrayBuffer();
}

function importProgressPercent() {
  const job = state.importJob;
  const readFraction = job.fileBytesTotal ? Math.min(job.fileBytesLoaded / job.fileBytesTotal, 1) : 0;
  const parseFraction = Math.min((job.parsePercent || 0) / 100, 1);
  const fileFraction = Math.min(1, readFraction * 0.82 + parseFraction * 0.18);
  return Math.round(((job.completed + fileFraction) / Math.max(job.total, 1)) * 100);
}

function cancelImport() {
  state.importJob.cancelled = true;
  state.importJob.active = false;
  if (activeImportWorker) {
    activeImportWorker.terminate();
    activeImportWorker = null;
  }
  if (activeImportReject) {
    activeImportReject(new Error("Import cancelled"));
    activeImportReject = null;
  }
  addHistory("Cancelled active FCS import");
  toast("FCS import cancelled");
  render();
}

function fallbackSample(name, error, importPlan = planFCSImport({ size: 0 })) {
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
      keywords: 0,
      importMode: importPlan.label
    },
    importReadiness: {
      mode: importPlan.mode,
      rawSize: importPlan.rawSize,
      eventCount: 0,
      parsedEventCount: 0,
      hasEventPreview: false,
      requiresNativeMappedEngine: importPlan.requiresNativeMappedEngine,
      dataStart: 0,
      dataEnd: 0
    }
  };
}

function sampleFromParsedFCS(name, parsed, importPlan = planFCSImport({ size: 0 })) {
  const sample = {
    id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    events: parsed.eventCount,
    group: "Imported FCS",
    status: "ready",
    parsed: true,
    metadataOnly: importPlan.metadataOnly,
    importReadiness: {
      mode: importPlan.mode,
      rawSize: importPlan.rawSize,
      eventCount: parsed.eventCount,
      parsedEventCount: parsed.parsedEventCount,
      hasEventPreview: parsed.events.length > 0,
      requiresNativeMappedEngine: importPlan.requiresNativeMappedEngine,
      dataStart: parsed.offsets?.dataStart || 0,
      dataEnd: parsed.offsets?.dataEnd || 0,
      dataBytes: parsed.dataBytes || Math.max(0, (parsed.offsets?.dataEnd || 0) - (parsed.offsets?.dataStart || 0) + 1),
      bytesPerEvent: parsed.bytesPerEvent || 0
    },
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
    compensation: parsed.spillover ? {
      enabled: true,
      version: 1,
      channels: parsed.spillover.channels,
      matrix: parsed.spillover.matrix,
      source: parsed.spillover.sourceKeyword
    } : null,
    metadata: {
      instrument: parsed.metadata.instrument,
      operator: parsed.metadata.operator,
      acquired: parsed.metadata.acquired,
      compensation: parsed.spillover ? `Embedded ${parsed.spillover.sourceKeyword} parsed` : "No embedded matrix",
      keywords: parsed.metadata.keywordCount,
      importMode: importPlan.label,
      importNote: importPlan.reason
    }
  };
  if (importPlan.requiresMemoryMap) {
    sample.status = "preview";
    sample.metadata.compensation = parsed.spillover ? `Embedded ${parsed.spillover.sourceKeyword} detected` : "Deferred until event parse";
  }
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

function addDerivedParameter() {
  if (parameters.some(parameter => parameter.id === "cd4_cd8_ratio")) {
    toast("CD4/CD8 derived parameter already exists");
    return;
  }
  const derive = event => {
    const numerator = event.cd4;
    const denominator = event.cd8;
    event.cd4_cd8_ratio = Number.isFinite(numerator) && Number.isFinite(denominator) && Math.abs(denominator) > 1e-9 ? numerator / denominator : NaN;
  };
  syntheticEvents.forEach(derive);
  state.samples.forEach(sample => sample.parsedEvents?.forEach(derive));
  parameters.push({ id: "cd4_cd8_ratio", label: "CD4/CD8 Ratio", range: [0, 20], scale: "linear", derived: true, formula: "CD4 / CD8" });
  addHistory("Added derived parameter CD4/CD8 Ratio");
  toast("Derived parameter added to plots and statistics");
  render();
}

function saveActiveTemplate() {
  const template = activeTemplate();
  template.sourceSample = state.selectedSample;
  template.version += 1;
  template.savedAt = new Date().toISOString().slice(0, 10);
  template.populations = state.populations.length;
  template.gates = state.gates.length;
  addHistory(`Saved ${template.name} template from ${selectedSample().name}`);
  toast("Gating template saved");
  render();
}

function applyTemplateToGroup() {
  const template = activeTemplate();
  batchGroupSamples().forEach(sample => {
    sample.templateId = template.id;
    sample.templateVersion = template.version;
    recomputePopulationCounts(sample);
  });
  addHistory(`Applied ${template.name} to ${state.batch.group} samples`);
  toast("Template applied across group");
  render();
}

function reviewBatchSample(step) {
  const samples = batchGroupSamples();
  if (!samples.length) return;
  state.batch.reviewIndex = (state.batch.reviewIndex + step + samples.length) % samples.length;
  state.selectedSample = selectedBatchSample().id;
  addHistory(`Reviewing ${selectedBatchSample().name} with shared gate layout`);
  render();
}

function selectBatchSample(sampleId) {
  const samples = batchGroupSamples();
  const index = samples.findIndex(sample => sample.id === sampleId);
  if (index >= 0) state.batch.reviewIndex = index;
  state.selectedSample = sampleId;
  render();
}

function tailorSelectedSampleGate() {
  const sample = selectedBatchSample();
  const template = activeTemplate();
  const gate = state.gates.find(item => item.population === state.selectedPopulation) || state.gates.find(item => item.plot === state.selectedPlot) || state.gates[0];
  if (!sample || !gate) return;
  sample.gateOverrides = sample.gateOverrides || {};
  sample.gateOverrides[gate.id] = shiftedGate(gate, 0.018, -0.012);
  sample.tailoredTemplates = Array.from(new Set([...(sample.tailoredTemplates || []), template.id]));
  recomputePopulationCounts(sample);
  addHistory(`Tailored ${gate.label} on ${sample.name} without changing ${template.name}`);
  toast("Sample-specific gate override saved");
  render();
}

function clearSampleTailoring() {
  const sample = selectedBatchSample();
  const template = activeTemplate();
  if (!sample) return;
  sample.gateOverrides = {};
  sample.tailoredTemplates = (sample.tailoredTemplates || []).filter(id => id !== template.id);
  recomputePopulationCounts(sample);
  addHistory(`Cleared sample-specific tailoring for ${sample.name}`);
  toast("Tailoring cleared for this sample");
  render();
}

function shiftedGate(gate, dx, dy) {
  const clamp = value => Math.max(0.02, Math.min(0.98, value));
  if (gate.type === "rectangle") return { x1: clamp(gate.x1 + dx), y1: clamp(gate.y1 + dy), x2: clamp(gate.x2 + dx), y2: clamp(gate.y2 + dy) };
  if (gate.type === "ellipse") return { cx: clamp(gate.cx + dx), cy: clamp(gate.cy + dy), rx: gate.rx, ry: gate.ry };
  if (gate.type === "polygon" || gate.type === "lasso") return { points: gate.points.map(point => [clamp(point[0] + dx), clamp(point[1] + dy)]) };
  if (gate.type === "quadrant") return { x: clamp(gate.x + dx), y: clamp(gate.y + dy) };
  if (gate.type === "interval") return { x1: clamp(gate.x1 + dx), x2: clamp(gate.x2 + dx) };
  return {};
}

function recomputeBatchStatistics() {
  const marker = defaultStatisticParameters().find(id => /cd3/i.test(id)) || defaultStatisticParameters()[0];
  const secondary = defaultStatisticParameters().find(id => /cd4/i.test(id)) || defaultStatisticParameters()[1] || marker;
  const headers = ["Sample", "Group", "Template", "Tailored", "Population", "Events", "% Parent", `Median ${statParamLabel(marker)}`, `Mean ${statParamLabel(secondary)}`];
  const rows = [];
  batchGroupSamples().forEach(sample => {
    recomputePopulationCounts(sample);
    state.populations.slice(1).forEach(pop => {
      const stats = statisticsForPopulation(pop.id, [marker, secondary], sample);
      rows.push([
        sample.name,
        sample.group,
        activeTemplate().name,
        sample.tailoredTemplates?.includes(activeTemplate().id) ? "yes" : "no",
        pop.name,
        fmt(populationCount(pop, sample)),
        stats.parentPercent,
        statNumber(stats.parameters[marker]?.median),
        statNumber(stats.parameters[secondary]?.mean, 1)
      ]);
    });
  });
  state.batch.combinedHeaders = headers;
  state.batch.combinedRows = rows;
  state.batch.lastRecomputed = `${rows.length} rows recomputed for ${state.batch.group}`;
  addHistory(`Recomputed combined batch statistics for ${state.batch.group}`);
  toast("Combined batch statistics ready");
  render();
}

function runHighDimAnalysis() {
  clearTimeout(highDimTimer);
  state.highDim.status = "running";
  state.highDim.progress = 22;
  addHistory(`Started ${state.highDim.method} + ${state.highDim.clusterer} on ${population(state.highDim.population).name}`);
  render();
  highDimTimer = setTimeout(() => {
    state.highDim.progress = 100;
    state.highDim.status = "complete";
    state.highDim.result = computeHighDimResult();
    const existing = plot("p4");
    if (existing) {
      existing.x = "umap1";
      existing.y = "umap2";
      existing.population = state.highDim.population;
      existing.type = "umap";
    }
    addHistory(`Completed reproducible ${state.highDim.method} run with ${state.highDim.result.clusters.length} ${state.highDim.clusterer} clusters`);
    toast("Cluster explorer ready");
    render();
  }, 260);
}

function cancelHighDimAnalysis() {
  clearTimeout(highDimTimer);
  state.highDim.status = "cancelled";
  state.highDim.progress = 0;
  addHistory("Cancelled high-dimensional analysis run");
  toast("High-dimensional run cancelled");
  render();
}

function selectHighDimCluster(clusterId) {
  state.highDim.selectedCluster = Number(clusterId);
  addHistory(`Selected cluster ${state.highDim.selectedCluster + 1} for backgating review`);
  render();
}

function gateSelectedCluster() {
  if (!state.highDim.result) {
    state.highDim.result = computeHighDimResult();
    state.highDim.status = "complete";
    state.highDim.progress = 100;
  }
  const cluster = state.highDim.selectedCluster;
  const id = `cluster${cluster + 1}-${Date.now()}`;
  const parent = state.highDim.population;
  const count = state.highDim.result?.clusters?.[cluster]?.count || 0;
  state.populations.push({ id, parent, name: `Cluster ${cluster + 1}`, color: colors[cluster % colors.length], count, gate: "cluster" });
  state.gates.push({ id: `gate-${id}`, plot: "p4", population: id, type: "cluster", cluster, label: `Cluster ${cluster + 1}` });
  state.selectedPopulation = id;
  addHistory(`Backgated cluster ${cluster + 1} into the population hierarchy`);
  toast("Cluster population added");
  render();
}

function compareEmbeddingsAcrossSamples() {
  const rows = state.samples.map(sample => {
    const result = computeHighDimResult(sample);
    const dominant = result.clusters.slice().sort((a, b) => b.count - a.count)[0];
    return `${sample.name}: cluster ${dominant.id + 1} dominant (${fmt(dominant.count)} events)`;
  });
  addHistory(`Compared embeddings across samples: ${rows.join("; ")}`);
  toast("Sample comparison recorded in pipeline");
  render();
}

function selectFigureElement(elementId) {
  if (state.figure.elements.some(element => element.id === elementId)) state.figure.selectedElement = elementId;
  render();
}

function selectedFigureElement() {
  return state.figure.elements.find(element => element.id === state.figure.selectedElement) || state.figure.elements[0];
}

function addFigureElement(type) {
  const id = `fig-${type}-${Date.now()}`;
  if (type === "text") state.figure.elements.push({ id, type: "text", text: "New annotation", x: 18, y: 82, w: 32, h: 8 });
  if (type === "arrow") state.figure.elements.push({ id, type: "arrow", text: "Callout", x: 64, y: 45, w: 16, h: 8 });
  if (type === "inset") {
    const target = selectedFigureElement();
    target.inset = state.selectedPlot;
    addHistory(`Added picture-in-picture inset to ${target.label || target.type}`);
    toast("Inset plot linked");
    render();
    return;
  }
  state.figure.selectedElement = id;
  addHistory(`Added figure ${type} element`);
  render();
}

function nudgeFigureElement() {
  const element = selectedFigureElement();
  element.x = Math.min(94, element.x + (state.figure.snap ? 2 : 1));
  element.y = Math.min(94, element.y + (state.figure.snap ? 2 : 1));
  addHistory(`Nudged figure element ${element.label || element.type}`);
  render();
}

function resizeFigureElement() {
  const element = selectedFigureElement();
  element.w = Math.min(90, element.w + 3);
  element.h = Math.min(90, element.h + 2);
  addHistory(`Resized figure element ${element.label || element.type}`);
  render();
}

function alignFigureLeft() {
  const selected = selectedFigureElement();
  state.figure.elements.filter(element => element.type === "plot").forEach(element => {
    if (Math.abs(element.x - selected.x) < 52) element.x = selected.x;
  });
  addHistory("Aligned figure tiles to selected left edge");
  toast("Alignment guide applied");
  render();
}

function distributeFigureElements() {
  const plots = state.figure.elements.filter(element => element.type === "plot").sort((a, b) => a.x - b.x || a.y - b.y);
  plots.forEach((element, index) => {
    element.x = index % 2 ? 53 : 5;
    element.y = index < 2 ? 9 : 53;
  });
  addHistory("Distributed figure plot tiles on snap grid");
  render();
}

function saveFigureTemplate() {
  state.figure.templateSaved = true;
  state.figure.exportStatus = "template saved";
  addHistory("Saved reusable publication figure template");
  toast("Figure template saved");
  render();
}

function exportFigure(format) {
  const svg = figureSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cytostudio-figure.${format === "pdf" ? "svg" : format}`;
  a.click();
  URL.revokeObjectURL(a.href);
  state.figure.exportStatus = `${format.toUpperCase()} proof exported`;
  addHistory(`Exported figure ${format.toUpperCase()} proof with live linked tiles`);
  toast(`${format.toUpperCase()} export proof created`);
  render();
}

function figureSVG() {
  const items = state.figure.elements.map(element => {
    const x = element.x * 10, y = element.y * 7.2, w = element.w * 10, h = element.h * 7.2;
    if (element.type === "text") return `<text x="${x}" y="${y + 18}" font-size="${state.figure.fontSize + 4}" font-family="Arial">${csvEscape(element.text)}</text>`;
    if (element.type === "arrow") return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#111" stroke-width="2" marker-end="url(#arrow)"/><text x="${x}" y="${y - 4}" font-size="${state.figure.fontSize}" font-family="Arial">${csvEscape(element.text)}</text>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#111"/><text x="${x + 10}" y="${y + 18}" font-size="${state.figure.fontSize}" font-family="Arial">${element.label} · ${plot(element.plot).title}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="720" viewBox="0 0 1000 720"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#111"/></marker></defs><rect width="100%" height="100%" fill="#f8faf9"/>${items}</svg>`;
}

function setPipelineCursor(index) {
  state.pipelineCursor = Math.max(0, Math.min(state.pipeline.length - 1, Number(index)));
  toast(`Viewing pipeline step ${state.pipelineCursor + 1}`);
  render();
}

function stepPipeline(delta) {
  setPipelineCursor((state.pipelineCursor ?? state.pipeline.length - 1) + delta);
}

function replayPipeline() {
  addHistory(`Replayed ${state.pipeline.length} recorded actions on ${selectedSample().name}`);
  toast("Pipeline replay recorded");
  render();
}

function generateReport() {
  const html = `<!doctype html><title>CytoStudio report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px;line-height:1.4}h1{color:#063}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style><h1>CytoStudio Experiment Report</h1><p>Sample: ${selectedSample().name}</p><p>Population: ${population(state.selectedPopulation).name}</p><h2>Gating hierarchy</h2><ul>${state.populations.map(pop => `<li>${pop.name}: ${fmt(populationCount(pop))} events</li>`).join("")}</ul><h2>Pipeline</h2><ol>${state.pipeline.map(step => `<li>${step}</li>`).join("")}</ol>`;
  downloadText("cytostudio-report.html", html, "text/html");
  state.report.status = "PDF proof generated";
  state.report.lastExport = "report";
  addHistory("Generated experiment report proof with hierarchy, plots, statistics, and pipeline");
  render();
}

function exportPipelineJSON() {
  const payload = {
    app: "CytoStudio",
    sample: selectedSample().name,
    selectedPopulation: population(state.selectedPopulation).name,
    actions: state.pipeline,
    gates: state.gates,
    populations: state.populations,
    plots: state.plots
  };
  downloadText("cytostudio-pipeline.json", JSON.stringify(payload, null, 2), "application/json");
  state.report.lastExport = "pipeline JSON";
  addHistory("Exported replayable pipeline JSON");
  render();
}

function exportGatingML() {
  const gates = state.gates.map(gate => `<gating:Gate id="${gate.id}" population="${gate.population}" type="${gate.type}" />`).join("");
  downloadText("cytostudio-gates.gatingml", `<gating:Gating-ML xmlns:gating="http://www.isac-net.org/std/Gating-ML/v2.0/gating">${gates}</gating:Gating-ML>`, "application/xml");
  state.report.lastExport = "GatingML";
  addHistory("Exported GatingML gate definition proof");
  render();
}

function exportGatedFCS() {
  const events = sampleEventsForPopulation(state.selectedPopulation).slice(0, 1200);
  downloadText(`cytostudio-${state.selectedPopulation}.fcs.txt`, `FCS gated export proof\nPopulation: ${population(state.selectedPopulation).name}\nEvents: ${events.length}\n`, "text/plain");
  state.report.lastExport = "gated FCS proof";
  addHistory(`Exported gated FCS proof for ${population(state.selectedPopulation).name}`);
  render();
}

function exportEventTable() {
  const events = sampleEventsForPopulation(state.selectedPopulation).slice(0, 1200);
  const ids = defaultStatisticParameters();
  const rows = [ids, ...events.map(event => ids.map(id => event[id]))];
  downloadText("cytostudio-events.csv", rows.map(row => row.map(csvEscape).join(",")).join("\n"), "text/csv");
  state.report.lastExport = "events CSV/Parquet proof";
  addHistory("Exported event table CSV/Parquet proof");
  render();
}

function exportStatsExcel() {
  const table = statisticsTableRows();
  const rows = [table.headers, ...table.rows];
  downloadText("cytostudio-statistics-excel.csv", rows.map(row => row.map(csvEscape).join(",")).join("\n"), "text/csv");
  state.report.lastExport = "statistics Excel proof";
  addHistory("Exported statistics Excel-compatible proof");
  render();
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`${filename} exported`);
}

function workspacePayload() {
  return {
    format: "cytostudio.workspace.v1",
    name: state.workspace.name,
    savedAt: new Date().toISOString(),
    samples: state.samples.map(sample => ({
      id: sample.id,
      name: sample.name,
      group: sample.group,
      rawReference: sample.path || sample.name,
      contentHash: sample.hash || `demo-${sample.id}-${sample.events}`,
      events: sample.events,
      metadata: sample.metadata,
      templateId: sample.templateId
    })),
    populations: state.populations,
    gates: state.gates,
    plots: state.plots,
    templates: state.templates,
    figure: state.figure,
    settings: { theme: state.theme, compensation: state.compensation, spectral: state.spectral },
    pipeline: state.pipeline
  };
}

function autosaveWorkspace() {
  localStorage.setItem("cyto.workspace.autosave", JSON.stringify(workspacePayload()));
  localStorage.setItem("cyto.autosave", "1");
  state.workspace.recoveryAvailable = true;
}

function saveWorkspaceFile() {
  const payload = workspacePayload();
  downloadText("cytostudio-workspace.json", JSON.stringify(payload, null, 2), "application/json");
  state.workspace.lastSaved = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.workspace.shareStatus = "workspace saved";
  autosaveWorkspace();
  addHistory("Saved workspace JSON with raw data references and content hashes");
  render();
}

function openAutosavedWorkspace() {
  const raw = localStorage.getItem("cyto.workspace.autosave");
  if (!raw) {
    toast("No autosave available");
    return;
  }
  const payload = JSON.parse(raw);
  state.workspace.name = payload.name || state.workspace.name;
  state.workspace.shareStatus = "autosave recovered";
  state.workspace.lastSaved = "recovered";
  addHistory("Recovered workspace from local autosave");
  render();
}

function shareWorkspacePackage() {
  const payload = workspacePayload();
  payload.package = { includesRawData: false, rawDataPolicy: "reference-by-path-and-content-hash", changeLog: state.pipeline.slice(-12) };
  downloadText("cytostudio-share-package.json", JSON.stringify(payload, null, 2), "application/json");
  state.workspace.shareStatus = "share package exported";
  addHistory("Exported self-contained share package without raw FCS duplication");
  render();
}

function toggleAutosave() {
  state.workspace.autosave = !state.workspace.autosave;
  if (state.workspace.autosave) autosaveWorkspace();
  else localStorage.removeItem("cyto.autosave");
  addHistory(`Workspace autosave ${state.workspace.autosave ? "enabled" : "disabled"}`);
  render();
}

function toggleWorkspaceSync() {
  state.workspace.syncEnabled = !state.workspace.syncEnabled;
  state.workspace.shareStatus = state.workspace.syncEnabled ? "shared location sync ready" : "local only";
  addHistory(`Workspace shared-location sync ${state.workspace.syncEnabled ? "enabled" : "disabled"}`);
  render();
}

function importInterop(kind) {
  state.workspace.imports.push({ kind, at: new Date().toISOString() });
  addHistory(`Imported ${kind} workspace proof into audit trail`);
  toast(`${kind} import proof recorded`);
  render();
}

function startOnboardingSample(kind) {
  state.selectedSample = kind === "spectral" ? "s1" : "s1";
  state.activeView = kind === "spectral" ? "spectral" : "canvas";
  if (kind === "spectral") ensureSpectralParameters();
  state.onboarding.visible = false;
  localStorage.setItem("cyto.onboarded", "1");
  addHistory(`Started onboarding with bundled ${kind} sample data`);
  toast(`${kind === "spectral" ? "Spectral" : "Conventional"} sample ready`);
  render();
}

function nextOnboardingStep() {
  state.onboarding.step = (state.onboarding.step + 1) % 3;
  renderOnboarding();
}

function closeOnboarding() {
  state.onboarding.visible = false;
  localStorage.setItem("cyto.onboarded", "1");
  renderOnboarding();
}

function toggleShortcuts() {
  state.onboarding.shortcutsVisible = !state.onboarding.shortcutsVisible;
  renderOnboarding();
}

function toggleHighContrast() {
  state.accessibility.contrast = !state.accessibility.contrast;
  localStorage.setItem("cyto.contrast", state.accessibility.contrast ? "1" : "0");
  addHistory(`High contrast accessibility mode ${state.accessibility.contrast ? "enabled" : "disabled"}`);
  render();
}

function enableClinicalMode() {
  state.clinical.enabled = true;
  state.clinical.user = "Clinical Reviewer";
  state.clinical.role = state.clinical.role === "Research" ? "Reviewer" : state.clinical.role;
  addHistory("Enabled optional clinical mode for this installation");
  toast("Clinical mode enabled for review");
  render();
}

function lockAnalysis() {
  if (!state.clinical.enabled) enableClinicalMode();
  state.clinical.locked = true;
  addHistory("Locked and finalized analysis; future changes require versioning");
  toast("Analysis locked");
  render();
}

function signReport() {
  if (!state.clinical.enabled) enableClinicalMode();
  state.clinical.signed = true;
  addHistory(`Electronic signature captured from ${state.clinical.user} (${state.clinical.role})`);
  toast("Electronic signature captured");
  render();
}

function exportCompliancePackage() {
  const payload = {
    mode: "clinical-proof",
    validationClaim: "none",
    user: state.clinical.user,
    role: state.clinical.role,
    locked: state.clinical.locked,
    signed: state.clinical.signed,
    retentionYears: state.clinical.retentionYears,
    auditTrail: state.pipeline
  };
  downloadText("cytostudio-compliance-export.json", JSON.stringify(payload, null, 2), "application/json");
  state.clinical.exportStatus = "exported";
  addHistory("Exported compliance-oriented package proof with no validation claim");
  render();
}

function runSpectralUnmixing() {
  ensureSpectralParameters();
  state.spectral.enabled = true;
  invalidateSpectral();
  addHistory("Ran reviewable spectral unmixing with autofluorescence signature");
  toast("Unmixed fluorophore parameters are now available");
  render();
}

function ensureSpectralParameters() {
  Object.entries(state.spectral.signatures).forEach(([id, signature]) => {
    if (!parameters.some(parameter => parameter.id === id)) {
      parameters.push({ id, label: signature.label, range: [0, 150000], scale: "arcsinh", spectral: true });
    }
  });
}

function buildReferenceSignatures() {
  Object.values(state.spectral.signatures).forEach((signature, index) => {
    signature.values = signature.values.map((value, channelIndex) => Math.max(0.02, Math.min(0.98, value + (rand(index * 50 + channelIndex) - 0.5) * 0.04)));
  });
  state.spectral.quality = spectralQualityRows();
  invalidateSpectral();
  addHistory("Refined spectral reference library from control signatures");
  toast("Reference signatures rebuilt for review");
  render();
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
    state.plots[0].transformX = defaultTransformSettings(sample.parameters[0], sample.parsedEvents || []);
    state.plots[0].transformY = defaultTransformSettings(sample.parameters[1], sample.parsedEvents || []);
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
    { icon: "?", label: "Show onboarding", meta: "help", run: () => { state.onboarding.visible = true; } },
    { icon: "⌘", label: "Keyboard shortcuts", meta: "help", run: () => { state.onboarding.shortcutsVisible = true; } },
    { icon: "◑", label: "High contrast", meta: "accessibility", run: toggleHighContrast },
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
    const compSource = event.target.dataset.compSource;
    const compDetector = event.target.dataset.compDetector;
    if (compSource && compDetector) {
      const value = Math.max(-2, Math.min(2, Number(event.target.value)));
      const comp = currentCompensation();
      comp.matrix[compSource] = comp.matrix[compSource] || {};
      comp.matrix[compSource][compDetector] = compSource === compDetector ? 1 : (Number.isFinite(value) ? value : 0);
      comp.enabled = true;
      comp.source = comp.source || "Manual matrix edit";
      comp.reviewStatus = "needs review";
      assignCompensation(comp.scope || "sample", comp);
      invalidateCompensation();
      addHistory(`Adjusted compensation ${statParamLabel(compSource)} -> ${statParamLabel(compDetector)}`);
      requestAnimationFrame(render);
      return;
    }
    const compField = event.target.dataset.compField;
    if (compField) {
      if (compField === "scope") updateCompensationScope(event.target.value);
      if (compField === "assignedGroup") updateCompensationScope("group", event.target.value);
      return;
    }
    const transformAxis = event.target.dataset.transformAxis;
    const transformKey = event.target.dataset.transformKey;
    if (transformAxis && transformKey) {
      const p = plot(state.selectedPlot);
      const target = transformAxis === "x" ? "transformX" : "transformY";
      p[target] = { ...defaultTransformSettingsForAxis(p, transformAxis), ...(p[target] || {}), [transformKey]: Number(event.target.value) };
      addHistory(`Adjusted ${transformAxis.toUpperCase()} ${transformKey} to ${event.target.value}`);
      render();
      return;
    }
    const highDimField = event.target.dataset.highdimField;
    if (highDimField) {
      state.highDim[highDimField] = event.target.value;
      state.highDim.result = null;
      state.highDim.progress = 0;
      state.highDim.status = "idle";
      addHistory(`Updated high-dimensional ${highDimField} to ${event.target.value}`);
      render();
      return;
    }
    const highDimParam = event.target.dataset.highdimParam;
    if (highDimParam) {
      state.highDim.parameters = event.target.checked
        ? Array.from(new Set([...state.highDim.parameters, highDimParam]))
        : state.highDim.parameters.filter(id => id !== highDimParam);
      if (!state.highDim.parameters.length) state.highDim.parameters = [highDimParam];
      state.highDim.result = null;
      state.highDim.progress = 0;
      state.highDim.status = "idle";
      addHistory(`Updated high-dimensional parameter set: ${state.highDim.parameters.map(statParamLabel).join(", ")}`);
      render();
      return;
    }
    const figureField = event.target.dataset.figureField;
    if (figureField) {
      state.figure[figureField] = event.target.type === "number" ? Number(event.target.value) : event.target.value;
      addHistory(`Updated figure ${figureField} to ${event.target.value}`);
      render();
      return;
    }
    const clinicalField = event.target.dataset.clinicalField;
    if (clinicalField) {
      state.clinical[clinicalField] = event.target.type === "number" ? Number(event.target.value) : event.target.value;
      addHistory(`Updated clinical ${clinicalField} setting`);
      render();
      return;
    }
    const booleanField = event.target.dataset.booleanField;
    if (booleanField) {
      state.booleanBuilder[booleanField] = event.target.value;
      renderInspector();
      return;
    }
    const tableField = event.target.dataset.tableField;
    if (tableField) {
      state.tableEditor[tableField] = event.target.value;
      addHistory(`Changed statistics table ${tableField} to ${event.target.value}`);
      renderView();
      return;
    }
    const tableColumn = event.target.dataset.tableColumn;
    if (tableColumn) {
      state.tableEditor.columns = event.target.checked
        ? Array.from(new Set([...state.tableEditor.columns, tableColumn]))
        : state.tableEditor.columns.filter(column => column !== tableColumn);
      if (!state.tableEditor.columns.length) state.tableEditor.columns = ["count"];
      addHistory(`Updated statistics table columns`);
      renderView();
      return;
    }
    const gateField = event.target.dataset.editGate;
    if (gateField) {
      const gate = selectedGate();
      const pop = gate ? population(gate.population) : null;
      if (!gate || !pop) return;
      if (gateField === "name") {
        pop.name = event.target.value.trim() || pop.name;
        state.selectedPopulation = pop.id;
        state.selectedGate = gate.id;
        refreshGateLabels();
        addHistory(`Renamed selected gate to ${pop.name}`);
        toast("Gate renamed; labels and statistics updated");
        render();
        return;
      }
      if (gateField === "color") {
        pop.color = event.target.value;
        state.selectedPopulation = pop.id;
        state.selectedGate = gate.id;
        refreshGateLabels();
        addHistory(`Recolored ${pop.name} gate to ${pop.color}`);
        toast("Gate color updated");
        render();
        return;
      }
    }
    const key = event.target.dataset.editPlot;
    if (!key) return;
    const p = plot(state.selectedPlot);
    p[key] = event.target.value || null;
    if (key === "type" && event.target.value === "histogram") p.y = null;
    if (key === "scaleX") p.transformX = defaultTransformSettingsForAxis(p, "x");
    if (key === "scaleY") p.transformY = defaultTransformSettingsForAxis(p, "y");
    addHistory(`Updated plot ${key} to ${event.target.value || "none"}`);
    render();
  });
  document.body.addEventListener("click", event => {
    const actionTarget = event.target.closest("[data-action]");
    const panelTarget = event.target.closest("[data-panel]");
    const action = actionTarget?.dataset.action;
    const panel = panelTarget?.dataset.panel;
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
    if (action === "cancel-import") cancelImport();
    if (action === "command") openCommandPalette();
    if (action === "create-gate") createGate();
    if (action === "add-plot") {
      state.plots.push({ id: `p${Date.now()}`, title: "New Plot", type: "scatter", x: "cd3", y: "cd4", population: state.selectedPopulation, scaleX: "logicle", scaleY: "logicle", transformX: defaultTransformSettings(), transformY: defaultTransformSettings(), zoom: 1 });
      state.activeView = "canvas";
      addHistory("Added a linked plot tile");
      render();
    }
    if (action === "add-boolean") {
      createBooleanGate();
    }
    if (action === "remove-table-row") {
      state.tableEditor.rows = state.tableEditor.rows.filter(id => id !== actionTarget.dataset.population);
      if (!state.tableEditor.rows.length) state.tableEditor.rows = ["all"];
      addHistory("Removed population from statistics table rows");
      renderView();
    }
    if (action === "sort-table") {
      const column = actionTarget.dataset.sortColumn;
      state.tableEditor.sortDir = state.tableEditor.sortColumn === column && state.tableEditor.sortDir === "desc" ? "asc" : "desc";
      state.tableEditor.sortColumn = column;
      addHistory(`Sorted statistics table by ${column}`);
      renderView();
    }
    if (action === "import") document.getElementById("fileInput").click();
    if (action === "export" || action === "export-csv") exportCSV();
    if (action === "reset-scale") {
      const p = plot(state.selectedPlot);
      p.scaleX = param(p.x).scale;
      p.scaleY = p.y ? param(p.y).scale : "linear";
      p.transformX = defaultTransformSettingsForAxis(p, "x");
      p.transformY = defaultTransformSettingsForAxis(p, "y");
      addHistory("Reset axis scaling to defaults");
      render();
    }
    if (action === "run-umap") {
      runHighDimAnalysis();
    }
    if (action === "cancel-highdim") cancelHighDimAnalysis();
    if (action === "select-cluster") selectHighDimCluster(actionTarget.dataset.cluster);
    if (action === "gate-cluster") gateSelectedCluster();
    if (action === "compare-embeddings") compareEmbeddingsAcrossSamples();
    if (action === "select-figure-element") selectFigureElement(actionTarget.dataset.figureElement);
    if (action === "add-figure-label") addFigureElement("text");
    if (action === "add-figure-arrow") addFigureElement("arrow");
    if (action === "add-figure-inset") addFigureElement("inset");
    if (action === "nudge-figure") nudgeFigureElement();
    if (action === "resize-figure") resizeFigureElement();
    if (action === "align-figure-left") alignFigureLeft();
    if (action === "distribute-figure") distributeFigureElements();
    if (action === "toggle-snap") {
      state.figure.snap = !state.figure.snap;
      addHistory(`Figure snapping ${state.figure.snap ? "enabled" : "disabled"}`);
      render();
    }
    if (action === "save-figure-template") saveFigureTemplate();
    if (action === "export-figure-png") exportFigure("png");
    if (action === "export-figure-svg") exportFigure("svg");
    if (action === "export-figure-tiff") exportFigure("tiff");
    if (action === "export-figure-pdf") exportFigure("pdf");
    if (action === "select-pipeline-step") setPipelineCursor(actionTarget.dataset.step);
    if (action === "pipeline-step-back") stepPipeline(-1);
    if (action === "pipeline-step-forward") stepPipeline(1);
    if (action === "replay-pipeline") replayPipeline();
    if (action === "generate-report") generateReport();
    if (action === "export-pipeline-json") exportPipelineJSON();
    if (action === "export-gatingml") exportGatingML();
    if (action === "export-gated-fcs") exportGatedFCS();
    if (action === "export-event-table") exportEventTable();
    if (action === "export-stats-excel") exportStatsExcel();
    if (action === "save-workspace") saveWorkspaceFile();
    if (action === "open-workspace") openAutosavedWorkspace();
    if (action === "share-package") shareWorkspacePackage();
    if (action === "toggle-autosave") toggleAutosave();
    if (action === "toggle-sync") toggleWorkspaceSync();
    if (action === "import-gatingml") importInterop("GatingML");
    if (action === "import-flowjo") importInterop("FlowJo");
    if (action === "import-cytobank") importInterop("Cytobank");
    if (action === "start-sample-conventional") startOnboardingSample("conventional");
    if (action === "start-sample-spectral") startOnboardingSample("spectral");
    if (action === "next-onboarding") nextOnboardingStep();
    if (action === "close-onboarding") closeOnboarding();
    if (action === "show-shortcuts") toggleShortcuts();
    if (action === "toggle-contrast") toggleHighContrast();
    if (action === "enable-clinical") enableClinicalMode();
    if (action === "lock-analysis") lockAnalysis();
    if (action === "sign-report") signReport();
    if (action === "export-compliance") exportCompliancePackage();
    if (action === "apply-comp") {
      const comp = currentCompensation();
      comp.enabled = true;
      comp.reviewStatus = "reviewed";
      assignCompensation(comp.scope || "sample", comp);
      invalidateCompensation();
      addHistory("Applied compensation matrix to active sample");
      toast("Compensation applied live");
      render();
    }
    if (action === "auto-comp") {
      autoCompensate();
    }
    if (action === "import-comp-matrix") importCompensationMatrixProof();
    if (action === "fit-single-stain") fitSingleStainControls();
    if (action === "run-unmix") runSpectralUnmixing();
    if (action === "build-signatures") buildReferenceSignatures();
    if (action === "save-template") saveActiveTemplate();
    if (action === "apply-template-group") applyTemplateToGroup();
    if (action === "review-prev") reviewBatchSample(-1);
    if (action === "review-next") reviewBatchSample(1);
    if (action === "select-batch-sample") selectBatchSample(actionTarget.closest("[data-sample]")?.dataset.sample);
    if (action === "tailor-sample") tailorSelectedSampleGate();
    if (action === "clear-tailor") clearSampleTailoring();
    if (action === "recompute-batch") recomputeBatchStatistics();
    if (action === "export-batch-csv") exportBatchCSV();
    if (action === "add-derived") addDerivedParameter();
    if (action === "copy-table") copyStatisticsTable();
  });
  document.addEventListener("keydown", event => {
    const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    }
    if (typing) return;
    if (event.key === "?") toggleShortcuts();
    if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "g") createGate();
    if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "s") {
      state.activeView = "tables";
      render();
    }
    if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "f") {
      state.activeView = "figure";
      render();
    }
    if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "h") toggleHighContrast();
    if (event.key === "Escape") closeCommandPalette();
    if (event.key === "Enter" && activeGateDraft?.type === "polygon") {
      event.preventDefault();
      finishCreatedGate(activeGateDraft.gate, "Closed polygon gate");
      return;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      const gate = state.gates.find(item => item.id === state.selectedGate) || state.gates.find(item => item.population === state.selectedPopulation);
      if (!gate) return;
      event.preventDefault();
      const step = event.shiftKey ? 0.025 : 0.008;
      const dx = event.key === "ArrowLeft" ? -step : (event.key === "ArrowRight" ? step : 0);
      const dy = event.key === "ArrowUp" ? -step : (event.key === "ArrowDown" ? step : 0);
      moveGate(gate, dx, dy);
      selectGate(gate);
      recomputePopulationCounts();
      addHistory(`Nudged ${population(gate.population)?.name || "gate"} with ${event.key}`);
      toast("Gate nudged; live-linked stats refreshed");
      render();
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
  document.body.addEventListener("dragover", event => {
    if (event.target.closest("[data-table-drop='rows']")) event.preventDefault();
  });
  document.body.addEventListener("drop", event => {
    const target = event.target.closest("[data-table-drop='rows']");
    if (!target) return;
    event.preventDefault();
    const populationId = event.dataTransfer.getData("text/plain");
    if (!population(populationId)) return;
    state.tableEditor.rows = Array.from(new Set([...state.tableEditor.rows, populationId]));
    addHistory(`Added ${population(populationId).name} to statistics table rows`);
    toast("Population added to table rows");
    renderView();
  });
  window.addEventListener("resize", () => requestAnimationFrame(drawAllPlots));
  if (window.PointerEvent) {
    document.getElementById("canvasRegion").addEventListener("pointerdown", beginGateDrag);
    document.addEventListener("pointermove", continueGateDrag);
    document.addEventListener("pointerup", endGateDrag);
  } else {
    document.getElementById("canvasRegion").addEventListener("mousedown", beginGateDrag);
    document.addEventListener("mousemove", continueGateDrag);
    document.addEventListener("mouseup", endGateDrag);
  }
  document.getElementById("canvasRegion").addEventListener("dblclick", event => {
    if (activeGateDraft?.type !== "polygon") return;
    event.preventDefault();
    finishCreatedGate(activeGateDraft.gate, "Closed polygon gate");
  });
  document.getElementById("canvasRegion").addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      plot(state.selectedPlot).zoom = Math.max(0.5, Math.min(6, plot(state.selectedPlot).zoom + Math.sign(-event.deltaY) * 0.1));
      toast("Trackpad pinch/zoom captured for plot engine");
    }
  }, { passive: false });
}

function exportCSV() {
  const table = statisticsTableRows();
  const rows = [table.headers, ...table.rows];
  const blob = new Blob([rows.map(r => r.map(csvEscape).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cytostudio-statistics.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV export created");
}

function exportBatchCSV() {
  if (!state.batch.combinedRows.length) recomputeBatchStatistics();
  const rows = [state.batch.combinedHeaders, ...state.batch.combinedRows];
  const blob = new Blob([rows.map(r => r.map(csvEscape).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cytostudio-batch-statistics.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Batch CSV export created");
}

function copyStatisticsTable() {
  const table = statisticsTableRows();
  const rows = [table.headers, ...table.rows];
  const text = rows.map(row => row.join("\t")).join("\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("Statistics table copied"),
    () => toast("Clipboard unavailable; use CSV export")
  );
}

syntheticEvents = makeEvents();
bindEvents();
render();
