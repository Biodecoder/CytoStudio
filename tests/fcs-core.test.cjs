const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseFCS, parseFCSMetadata, parseHeader, parseTextSegment, transforms } = require("../fcs-core.js");

function pad(value, width) {
  return String(value).padStart(width, " ");
}

function buildFixture() {
  const rows = [
    [100, 25, -5],
    [200, 50, 15],
    [300, 75, 125]
  ];
  const dataBytes = rows.length * rows[0].length * 4;
  let text = "";
  let header = "";
  let dataStart = 0;
  let dataEnd = 0;

  for (let attempt = 0; attempt < 4; attempt++) {
    const pairs = [
      ["$BEGINANALYSIS", "0"],
      ["$ENDANALYSIS", "0"],
      ["$BEGINSTEXT", "0"],
      ["$ENDSTEXT", "0"],
      ["$BEGINDATA", String(dataStart)],
      ["$ENDDATA", String(dataEnd)],
      ["$BYTEORD", "1,2,3,4"],
      ["$DATATYPE", "F"],
      ["$MODE", "L"],
      ["$NEXTDATA", "0"],
      ["$PAR", "3"],
      ["$TOT", String(rows.length)],
      ["$CYT", "CytoStudio Test Cytometer"],
      ["$OP", "Unit Test"],
      ["$DATE", "01-JUN-2026"],
      ["$SPILLOVER", "2,CD3-A,SSC-A,1,0.12,0.03,1"],
      ["$P1N", "FSC-A"],
      ["$P1S", "Forward Scatter"],
      ["$P1B", "32"],
      ["$P1R", "262144"],
      ["$P2N", "SSC-A"],
      ["$P2S", "Side Scatter"],
      ["$P2B", "32"],
      ["$P2R", "262144"],
      ["$P3N", "CD3-A"],
      ["$P3S", "CD3 APC"],
      ["$P3B", "32"],
      ["$P3R", "100000"]
    ];
    text = "|" + pairs.flat().join("|") + "|";
    const textStart = 58;
    const textEnd = textStart + text.length - 1;
    dataStart = textEnd + 1;
    dataEnd = dataStart + dataBytes - 1;
    header = `FCS3.1    ${pad(textStart, 8)}${pad(textEnd, 8)}${pad(dataStart, 8)}${pad(dataEnd, 8)}${pad(0, 8)}${pad(0, 8)}`;
  }

  const buffer = new ArrayBuffer(dataEnd + 1);
  const bytes = new Uint8Array(buffer);
  bytes.set(Buffer.from(header, "ascii"), 0);
  bytes.set(Buffer.from(text, "ascii"), 58);
  const view = new DataView(buffer, dataStart);
  rows.flat().forEach((value, index) => view.setFloat32(index * 4, value, true));
  return buffer;
}

function buildIntegerByteOrderFixture() {
  const rows = [
    [7, 300, 70000],
    [8, 400, 90000]
  ];
  const bits = [8, 16, 32];
  const dataBytes = rows.length * bits.reduce((sum, bitCount) => sum + bitCount / 8, 0);
  let text = "";
  let header = "";
  let dataStart = 0;
  let dataEnd = 0;

  for (let attempt = 0; attempt < 4; attempt++) {
    const pairs = [
      ["$BEGINANALYSIS", "0"],
      ["$ENDANALYSIS", "0"],
      ["$BEGINSTEXT", "0"],
      ["$ENDSTEXT", "0"],
      ["$BEGINDATA", String(dataStart)],
      ["$ENDDATA", String(dataEnd)],
      ["$BYTEORD", "4,3,2,1"],
      ["$DATATYPE", "I"],
      ["$MODE", "L"],
      ["$NEXTDATA", "0"],
      ["$PAR", "3"],
      ["$TOT", String(rows.length)],
      ["$CYT", "Integer Fixture"],
      ["$P1N", "FLAG-A"],
      ["$P1B", "8"],
      ["$P1R", "255"],
      ["$P2N", "MID-A"],
      ["$P2B", "16"],
      ["$P2R", "65535"],
      ["$P3N", "WIDE-A"],
      ["$P3B", "32"],
      ["$P3R", "1000000"]
    ];
    text = "|" + pairs.flat().join("|") + "|";
    const textStart = 58;
    const textEnd = textStart + text.length - 1;
    dataStart = textEnd + 1;
    dataEnd = dataStart + dataBytes - 1;
    header = `FCS3.1    ${pad(textStart, 8)}${pad(textEnd, 8)}${pad(dataStart, 8)}${pad(dataEnd, 8)}${pad(0, 8)}${pad(0, 8)}`;
  }

  const buffer = new ArrayBuffer(dataEnd + 1);
  const bytes = new Uint8Array(buffer);
  bytes.set(Buffer.from(header, "ascii"), 0);
  bytes.set(Buffer.from(text, "ascii"), 58);
  const view = new DataView(buffer, dataStart);
  let offset = 0;
  rows.forEach(row => {
    view.setUint8(offset, row[0]);
    offset += 1;
    view.setUint16(offset, row[1], false);
    offset += 2;
    view.setUint32(offset, row[2], false);
    offset += 4;
  });
  return buffer;
}

const escaped = parseTextSegment("/$P1N/FSC-A/$P1S/CD3//APC/");
assert.equal(escaped.$P1N, "FSC-A");
assert.equal(escaped.$P1S, "CD3/APC");

const parsed = parseFCS(buildFixture());
assert.equal(parsed.version, "FCS3.1");
assert.equal(parsed.eventCount, 3);
assert.equal(parsed.parameters.length, 3);
assert.equal(parsed.parameters[2].label, "CD3 APC (CD3-A)");
assert.equal(parsed.metadata.instrument, "CytoStudio Test Cytometer");
assert.equal(parsed.spillover.sourceKeyword, "$SPILLOVER");
assert.deepEqual(parsed.spillover.channels, ["cd3_apc", "side_scatter"]);
assert.equal(parsed.spillover.matrix.cd3_apc.side_scatter, 0.12);
assert.equal(parsed.events[0].forward_scatter, 100);
assert.equal(parsed.events[2].cd3_apc, 125);

const metadataOnly = parseFCSMetadata(buildFixture());
assert.equal(metadataOnly.version, "FCS3.1");
assert.equal(metadataOnly.eventCount, 3);
assert.equal(metadataOnly.parsedEventCount, 0);
assert.equal(metadataOnly.dataBytes, 36);
assert.equal(metadataOnly.bytesPerEvent, 12);
assert.equal(metadataOnly.events.length, 0);
assert.equal(metadataOnly.parameters[0].label, "Forward Scatter (FSC-A)");
assert.equal(metadataOnly.metadata.instrument, "CytoStudio Test Cytometer");
const fixtureForSlice = buildFixture();
const sliceHeader = parseHeader(fixtureForSlice);
const metadataSlice = parseFCSMetadata(fixtureForSlice.slice(0, sliceHeader.textEnd + 1));
assert.equal(metadataSlice.eventCount, 3);
assert.equal(metadataSlice.spillover.sourceKeyword, "$SPILLOVER");

const limited = parseFCS(buildFixture(), { maxEvents: 2 });
assert.equal(limited.parsedEventCount, 2);
assert.equal(limited.events.length, 2);

const metadataStyleLimit = parseFCS(buildFixture(), { maxEvents: 0 });
assert.equal(metadataStyleLimit.parsedEventCount, 0);
assert.equal(metadataStyleLimit.events.length, 0);

const publicManifestPath = path.join(__dirname, "fixtures/public/flowWorkspaceData/manifest.json");
const publicManifest = JSON.parse(fs.readFileSync(publicManifestPath, "utf8"));
const publicFixture = publicManifest.fixtures[0];
const publicFixtureBuffer = fs.readFileSync(path.join(__dirname, "fixtures/public/flowWorkspaceData", publicFixture.path));
const publicMetadata = parseFCSMetadata(publicFixtureBuffer);
assert.equal(publicMetadata.version, publicFixture.fcsVersion);
assert.equal(publicMetadata.eventCount, publicFixture.events);
assert.equal(publicMetadata.parameters.length, publicFixture.parameters);
assert.equal(publicMetadata.metadata.instrument, publicFixture.instrument);
assert.equal(publicMetadata.parsedEventCount, 0);
assert.equal(publicMetadata.bytesPerEvent, 60);
assert.deepEqual(publicMetadata.parameters.slice(0, 5).map(parameter => parameter.id), ["time", "fsc_a", "fsc_h", "fsc_w", "ssc_a"]);
assert.equal(new Set(publicMetadata.parameters.map(parameter => parameter.id)).size, publicMetadata.parameters.length);
const publicParsed = parseFCS(publicFixtureBuffer, { maxEvents: 128, progressInterval: 64 });
assert.equal(publicParsed.parsedEventCount, 128);
assert.equal(publicParsed.events.length, 128);
assert.ok(Number.isFinite(publicParsed.events[0].fsc_a));
assert.ok(Number.isFinite(publicParsed.events[0].cd3));

const progressEvents = [];
const progressed = parseFCS(buildFixture(), {
  progressInterval: 1,
  onProgress(progress) {
    progressEvents.push(progress);
  }
});
assert.equal(progressed.parsedEventCount, 3);
assert.equal(progressEvents.length, 3);
assert.deepEqual(progressEvents.at(-1), {
  parsedEvents: 3,
  targetEvents: 3,
  totalEvents: 3,
  percent: 100
});

const cappedProgressEvents = [];
const cappedProgress = parseFCS(buildFixture(), {
  maxEvents: 2,
  progressInterval: 1,
  onProgress(progress) {
    cappedProgressEvents.push(progress);
  }
});
assert.equal(cappedProgress.parsedEventCount, 2);
assert.deepEqual(cappedProgressEvents.at(-1), {
  parsedEvents: 2,
  targetEvents: 2,
  totalEvents: 3,
  percent: 100
});

const integerParsed = parseFCS(buildIntegerByteOrderFixture());
assert.equal(integerParsed.metadata.instrument, "Integer Fixture");
assert.equal(integerParsed.parameters[0].bits, 8);
assert.equal(integerParsed.parameters[1].bits, 16);
assert.equal(integerParsed.parameters[2].bits, 32);
assert.equal(integerParsed.events[0].flag_a, 7);
assert.equal(integerParsed.events[0].mid_a, 300);
assert.equal(integerParsed.events[0].wide_a, 70000);
assert.equal(integerParsed.events[1].flag_a, 8);
assert.equal(integerParsed.events[1].mid_a, 400);
assert.equal(integerParsed.events[1].wide_a, 90000);

assert.equal(transforms.linear(-12), -12);
assert.equal(transforms.log(1000), 3);
assert.ok(transforms.arcsinh(-150) < 0);
assert.ok(transforms.logicle(-20) < 0);
assert.ok(transforms.arcsinh(300, { cofactor: 300 }) < transforms.arcsinh(300, { cofactor: 100 }));
assert.ok(Math.abs(transforms.logicle(100, { width: 100 })) < Math.abs(transforms.logicle(100, { width: 10 })));
assert.ok(transforms.normalize(50, [0, 100], "linear") === 0.5);
assert.ok(transforms.normalize(-25, [-100, 1000], "logicle", { width: 25 }) > 0);

console.log("fcs-core tests passed");
