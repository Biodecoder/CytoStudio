self.importScripts("fcs-core.js");

self.onmessage = event => {
  const { id, name, buffer, maxEvents } = event.data;
  try {
    const parsed = self.CytoFCS.parseFCS(buffer, { maxEvents });
    self.postMessage({ id, name, ok: true, parsed });
  } catch (error) {
    self.postMessage({ id, name, ok: false, error: error.message || String(error) });
  }
};
