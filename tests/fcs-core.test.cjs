const assert = require("node:assert/strict");
const { parseFCS, parseTextSegment, transforms } = require("../fcs-core.js");

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

const limited = parseFCS(buildFixture(), { maxEvents: 2 });
assert.equal(limited.parsedEventCount, 2);
assert.equal(limited.events.length, 2);

assert.equal(transforms.linear(-12), -12);
assert.equal(transforms.log(1000), 3);
assert.ok(transforms.arcsinh(-150) < 0);
assert.ok(transforms.logicle(-20) < 0);
assert.ok(transforms.arcsinh(300, { cofactor: 300 }) < transforms.arcsinh(300, { cofactor: 100 }));
assert.ok(Math.abs(transforms.logicle(100, { width: 100 })) < Math.abs(transforms.logicle(100, { width: 10 })));
assert.ok(transforms.normalize(50, [0, 100], "linear") === 0.5);
assert.ok(transforms.normalize(-25, [-100, 1000], "logicle", { width: 25 }) > 0);

console.log("fcs-core tests passed");
