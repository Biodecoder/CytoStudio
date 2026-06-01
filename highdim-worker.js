self.onmessage = event => {
  const { sampleId, config, parameterMeta, events } = event.data;
  postMessage({ progress: 26, phase: "sampling events" });
  const points = events.map((item, index) => {
    const values = config.parameters.map(id => normalize(item[id], parameterMeta[id]));
    const x = values.reduce((sum, value, i) => sum + value * Math.cos((i + 1) * 1.7), 0) + (rand(index + config.seed) - 0.5) * 0.14;
    const y = values.reduce((sum, value, i) => sum + value * Math.sin((i + 1) * 1.3), 0) + (rand(index + config.seed + 99) - 0.5) * 0.14;
    return { x, y, colorValue: item[config.colorBy], cluster: clusterFor(item, config.parameters, parameterMeta), event: item };
  });
  postMessage({ progress: 68, phase: `${config.clusterer} clustering` });
  const clusters = Array.from({ length: 8 }, (_, id) => {
    const members = points.filter(point => point.cluster === id);
    const means = Object.fromEntries(config.parameters.map(parameterId => [parameterId, mean(members.map(point => point.event[parameterId]).filter(Number.isFinite))]));
    const phenotype = config.parameters.slice().sort((a, b) => (means[b] || 0) - (means[a] || 0)).slice(0, 2).join(" / ");
    return { id, count: Math.round(members.length * config.scale), means, phenotype: phenotype || "mixed" };
  });
  postMessage({ progress: 92, phase: "building heatmap" });
  postMessage({ ok: true, result: { sample: sampleId, method: config.method, clusterer: config.clusterer, parameters: config.parameters, points, clusters } });
};

function normalize(value, meta = {}) {
  if (!Number.isFinite(value)) return 0;
  const range = meta.range || [0, 100000];
  if (meta.scale === "linear") return clamp((value - range[0]) / Math.max(1, range[1] - range[0]));
  if (meta.scale === "arcsinh") return clamp(Math.asinh(value / 150) / Math.asinh(range[1] / 150));
  const floor = Math.max(1, Math.abs(range[0]), 1);
  return clamp((Math.log10(Math.max(value + floor, 1)) - Math.log10(floor)) / (Math.log10(range[1] + floor) - Math.log10(floor) || 1));
}

function clusterFor(event, params, meta) {
  const score = params.reduce((sum, id, index) => sum + normalize(event[id], meta[id]) * (index + 1.7), 0);
  return Math.max(0, Math.min(7, Math.floor((score * 2.15) % 8)));
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function rand(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
