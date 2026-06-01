(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CytoFCS = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ASCII = new TextDecoder("ascii");

  function parseHeader(buffer) {
    const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 256));
    const text = ASCII.decode(bytes);
    const field = (start, end) => {
      const value = text.slice(start, end).trim();
      return value ? Number(value) : 0;
    };
    return {
      version: text.slice(0, 6).trim(),
      textStart: field(10, 18),
      textEnd: field(18, 26),
      dataStart: field(26, 34),
      dataEnd: field(34, 42),
      analysisStart: field(42, 50),
      analysisEnd: field(50, 58)
    };
  }

  function parseTextSegment(text) {
    const delimiter = text[0];
    const tokens = [];
    let current = "";
    for (let i = 1; i < text.length; i++) {
      const char = text[i];
      if (char === delimiter) {
        if (text[i + 1] === delimiter) {
          current += delimiter;
          i++;
        } else {
          tokens.push(current);
          current = "";
        }
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);

    const keywords = {};
    for (let i = 0; i < tokens.length - 1; i += 2) {
      keywords[tokens[i].toUpperCase()] = tokens[i + 1];
    }
    return keywords;
  }

  function keywordNumber(keywords, key, fallback = 0) {
    const value = Number(keywords[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function resolveByteOrder(keywords) {
    const raw = (keywords.$BYTEORD || "1,2,3,4").replace(/\s+/g, "");
    if (raw === "4,3,2,1" || raw === "2,1") return false;
    return true;
  }

  function getOffsets(header, keywords) {
    const textStart = header.textStart || keywordNumber(keywords, "$BEGINTEXT");
    const textEnd = header.textEnd || keywordNumber(keywords, "$ENDTEXT");
    const dataStart = header.dataStart || keywordNumber(keywords, "$BEGINDATA");
    const dataEnd = header.dataEnd || keywordNumber(keywords, "$ENDDATA");
    return { textStart, textEnd, dataStart, dataEnd };
  }

  function getParameters(keywords) {
    const count = keywordNumber(keywords, "$PAR");
    const parameters = [];
    const seenIds = new Map();
    for (let i = 1; i <= count; i++) {
      const raw = String(keywords[`$P${i}N`] || `P${i}`).trim();
      const stain = String(keywords[`$P${i}S`] || "").trim();
      const bits = keywordNumber(keywords, `$P${i}B`, 32);
      const range = keywordNumber(keywords, `$P${i}R`, 0);
      const baseId = safeId(stain || raw);
      const seen = seenIds.get(baseId) || 0;
      seenIds.set(baseId, seen + 1);
      parameters.push({
        index: i,
        id: seen ? `${baseId}_${i}` : baseId,
        raw,
        stain,
        label: stain ? `${stain} (${raw})` : raw,
        bits,
        range
      });
    }
    return parameters;
  }

  function parseSpilloverMatrix(keywords, parameters) {
    const raw = keywords.$SPILLOVER || keywords.SPILL || keywords.$COMP || "";
    if (!raw) return null;
    const parts = raw.split(",").map(part => part.trim()).filter(Boolean);
    const size = Number(parts[0]);
    if (!Number.isFinite(size) || size <= 0 || parts.length < 1 + size + size * size) return null;
    const channelLabels = parts.slice(1, 1 + size);
    const values = parts.slice(1 + size).map(Number);
    const channels = channelLabels.map(label => {
      const match = parameters.find(parameter => parameter.raw === label || parameter.stain === label || parameter.label === label);
      return match?.id || safeId(label);
    });
    const matrix = {};
    channels.forEach((source, row) => {
      matrix[source] = {};
      channels.forEach((detector, col) => {
        matrix[source][detector] = values[row * size + col] ?? (source === detector ? 1 : 0);
      });
    });
    return {
      channels,
      matrix,
      labels: channelLabels,
      sourceKeyword: keywords.$SPILLOVER ? "$SPILLOVER" : (keywords.SPILL ? "SPILL" : "$COMP")
    };
  }

  function safeId(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "parameter";
  }

  function readNumeric(view, offset, datatype, bits, littleEndian) {
    if (datatype === "F") return { value: view.getFloat32(offset, littleEndian), bytes: 4 };
    if (datatype === "D") return { value: view.getFloat64(offset, littleEndian), bytes: 8 };
    if (datatype === "I") {
      if (bits <= 8) return { value: view.getUint8(offset), bytes: 1 };
      if (bits <= 16) return { value: view.getUint16(offset, littleEndian), bytes: 2 };
      return { value: view.getUint32(offset, littleEndian), bytes: 4 };
    }
    throw new Error(`Unsupported FCS $DATATYPE '${datatype}'. Supported: I, F, D.`);
  }

  function parseEvents(buffer, keywords, parameters, offsets, options = {}) {
    const total = keywordNumber(keywords, "$TOT");
    const mode = (keywords.$MODE || "L").toUpperCase();
    const datatype = (keywords.$DATATYPE || "F").toUpperCase();
    const littleEndian = resolveByteOrder(keywords);
    const requestedMax = options.maxEvents;
    const maxEvents = Number.isFinite(Number(requestedMax)) ? Math.max(0, Number(requestedMax)) : total;
    const progressInterval = Math.max(1, Number(options.progressInterval) || 1000);
    const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
    if (mode !== "L") throw new Error(`Unsupported FCS $MODE '${mode}'. Only list mode is supported.`);
    if (!offsets.dataStart || !offsets.dataEnd || total === 0 || parameters.length === 0) return [];

    const view = new DataView(buffer, offsets.dataStart, offsets.dataEnd - offsets.dataStart + 1);
    const events = [];
    let offset = 0;
    const take = Math.min(total, maxEvents);
    const reportProgress = parsedEvents => {
      if (!onProgress) return;
      onProgress({
        parsedEvents,
        targetEvents: take,
        totalEvents: total,
        percent: take ? Math.round((parsedEvents / take) * 100) : 100
      });
    };
    for (let row = 0; row < take; row++) {
      const event = {};
      for (const parameter of parameters) {
        const read = readNumeric(view, offset, datatype, parameter.bits, littleEndian);
        event[parameter.id] = read.value;
        offset += read.bytes;
      }
      events.push(event);
      if ((row + 1) % progressInterval === 0 || row + 1 === take) reportProgress(row + 1);
    }
    return events;
  }

  function parseFCS(input, options = {}) {
    const buffer = input instanceof ArrayBuffer ? input : input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    const header = parseHeader(buffer);
    if (!/^FCS3\.[01]/.test(header.version)) {
      throw new Error(`Unsupported or missing FCS version '${header.version}'. Expected FCS3.0 or FCS3.1.`);
    }
    const textSegment = ASCII.decode(new Uint8Array(buffer, header.textStart, header.textEnd - header.textStart + 1));
    const keywords = parseTextSegment(textSegment);
    const offsets = getOffsets(header, keywords);
    const parameters = getParameters(keywords);
    const spillover = parseSpilloverMatrix(keywords, parameters);
    const events = parseEvents(buffer, keywords, parameters, offsets, options);
    return {
      version: header.version,
      header,
      offsets,
      keywords,
      parameters,
      eventCount: keywordNumber(keywords, "$TOT"),
      parsedEventCount: events.length,
      events,
      spillover,
      metadata: {
        instrument: keywords.$CYT || keywords.CYT || "Unknown instrument",
        operator: keywords.$OP || keywords.OP || "Unknown operator",
        acquired: keywords.$DATE || keywords.DATE || "Unknown acquisition date",
        compensation: spillover ? spillover.sourceKeyword : "",
        keywordCount: Object.keys(keywords).length
      }
    };
  }

  function parseFCSMetadata(input) {
    const buffer = input instanceof ArrayBuffer ? input : input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    const header = parseHeader(buffer);
    if (!/^FCS3\.[01]/.test(header.version)) {
      throw new Error(`Unsupported or missing FCS version '${header.version}'. Expected FCS3.0 or FCS3.1.`);
    }
    if (buffer.byteLength <= header.textEnd) {
      throw new Error("FCS metadata slice does not include the complete TEXT segment.");
    }
    const textSegment = ASCII.decode(new Uint8Array(buffer, header.textStart, header.textEnd - header.textStart + 1));
    const keywords = parseTextSegment(textSegment);
    const offsets = getOffsets(header, keywords);
    const parameters = getParameters(keywords);
    const spillover = parseSpilloverMatrix(keywords, parameters);
    const dataBytes = offsets.dataEnd >= offsets.dataStart ? offsets.dataEnd - offsets.dataStart + 1 : 0;
    const bytesPerEvent = parameters.reduce((sum, parameter) => sum + Math.ceil(parameter.bits / 8), 0);
    return {
      version: header.version,
      header,
      offsets,
      keywords,
      parameters,
      eventCount: keywordNumber(keywords, "$TOT"),
      parsedEventCount: 0,
      dataBytes,
      bytesPerEvent,
      events: [],
      spillover,
      metadata: {
        instrument: keywords.$CYT || keywords.CYT || "Unknown instrument",
        operator: keywords.$OP || keywords.OP || "Unknown operator",
        acquired: keywords.$DATE || keywords.DATE || "Unknown acquisition date",
        compensation: spillover ? spillover.sourceKeyword : "",
        keywordCount: Object.keys(keywords).length
      }
    };
  }

  const transforms = {
    linear(value) {
      return value;
    },
    log(value, options = {}) {
      const floor = options.floor ?? 1;
      return Math.log10(Math.max(value, floor));
    },
    arcsinh(value, options = {}) {
      const cofactor = options.cofactor ?? 150;
      return Math.asinh(value / cofactor);
    },
    logicle(value, options = {}) {
      const width = options.width ?? 18;
      return Math.sign(value) * Math.log10(1 + Math.abs(value) / width);
    },
    biexponential(value, options = {}) {
      return transforms.logicle(value, options);
    },
    normalize(value, range, scale = "linear", options = {}) {
      const fn = transforms[scale] || transforms.linear;
      const min = fn(range[0], options);
      const max = fn(range[1], options);
      const transformed = fn(value, options);
      if (max === min) return 0;
      return Math.max(0, Math.min(1, (transformed - min) / (max - min)));
    }
  };

  return { parseFCS, parseFCSMetadata, parseHeader, parseTextSegment, parseSpilloverMatrix, transforms };
});
