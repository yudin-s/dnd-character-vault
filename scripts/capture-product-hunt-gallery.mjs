import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { connect } from "node:net";
import { resolve } from "node:path";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:3003/";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = resolve("docs/product-hunt/assets");
const PORT = Number(process.env.CDP_PORT || 9333);

const STORAGE_KEY = "dnd-character-vault:character:v2";
const HISTORY_KEY = "dnd-character-vault:history:v2";
const LOCALE_KEY = "dnd-character-vault:locale";

const sampleCharacter = {
  schemaVersion: 6,
  identity: {
    name: "Aelar Stormwatch",
    player: "Sergey",
    className: "Ranger",
    subclass: "Gloom Stalker",
    level: 7,
    species: "Wood Elf",
    background: "Outlander",
    alignment: "ng",
    experience: { current: 11400, max: 14000 }
  },
  abilities: {
    strength: { score: 10 },
    dexterity: { score: 18 },
    constitution: { score: 14 },
    intelligence: { score: 12 },
    wisdom: { score: 16 },
    charisma: { score: 11 }
  },
  savingThrows: {
    strength: { proficient: true, bonus: "" },
    dexterity: { proficient: true, bonus: "" },
    constitution: { proficient: false, bonus: "" },
    intelligence: { proficient: false, bonus: "" },
    wisdom: { proficient: false, bonus: "" },
    charisma: { proficient: false, bonus: "" }
  },
  skills: {
    acrobatics: { proficient: false, expertise: false, bonus: "" },
    animalHandling: { proficient: false, expertise: false, bonus: "" },
    arcana: { proficient: false, expertise: false, bonus: "" },
    athletics: { proficient: true, expertise: false, bonus: "" },
    deception: { proficient: false, expertise: false, bonus: "" },
    history: { proficient: false, expertise: false, bonus: "" },
    insight: { proficient: true, expertise: false, bonus: "" },
    intimidation: { proficient: false, expertise: false, bonus: "" },
    investigation: { proficient: true, expertise: false, bonus: "" },
    medicine: { proficient: false, expertise: false, bonus: "" },
    nature: { proficient: true, expertise: false, bonus: "" },
    perception: { proficient: true, expertise: true, bonus: "" },
    performance: { proficient: false, expertise: false, bonus: "" },
    persuasion: { proficient: false, expertise: false, bonus: "" },
    religion: { proficient: false, expertise: false, bonus: "" },
    sleightOfHand: { proficient: false, expertise: false, bonus: "" },
    stealth: { proficient: true, expertise: true, bonus: "" },
    survival: { proficient: true, expertise: false, bonus: "" }
  },
  combat: {
    armorClass: 16,
    speed: 35,
    initiativeOverride: "",
    proficiencyOverride: "",
    hitPoints: { current: 42, max: 52, temporary: 6 },
    hitDice: "7d10",
    exhaustion: 0,
    conditions: "Invisible"
  },
  deathSaves: {
    successes: [false, false, false],
    failures: [false, false, false]
  },
  resources: [
    { id: "resource-hit-dice", name: "Hit Dice", current: 5, max: 7, reset: "Long rest", resetOnRest: true },
    { id: "resource-favored-foe", name: "Favored Foe", current: 3, max: 3, reset: "", resetOnRest: true },
    { id: "resource-arrows", name: "Silver arrows", current: 17, max: 20, reset: "", resetOnRest: false }
  ],
  attacks: [
    { id: "attack-longbow", name: "Longbow", bonus: "+8", damage: "1d8+4 piercing", notes: "150/600, magical" },
    { id: "attack-shortsword", name: "Shortsword", bonus: "+8", damage: "1d6+4 piercing", notes: "Finesse, light" }
  ],
  spells: {
    ability: "wisdom",
    saveDc: 14,
    attackBonus: 6,
    focus: "Carved yew focus",
    slots: {
      1: { current: 3, max: 4 },
      2: { current: 2, max: 3 },
      3: { current: 1, max: 2 }
    },
    known: [
      { id: "spell-guidance", level: 0, name: "Guidance", prepared: true, school: "Divination", castingTime: "1 action", range: "Touch", verbal: true, somatic: true, material: false, duration: "1 minute", concentration: true, ritual: false, notes: "Add 1d4 to an ability check." },
      { id: "spell-hunters-mark", level: 1, name: "Hunter's Mark", prepared: true, school: "Divination", castingTime: "1 bonus action", range: "90 ft", verbal: true, somatic: false, material: false, duration: "1 hour", concentration: true, ritual: false, notes: "+1d6 weapon damage." },
      { id: "spell-pass-without-trace", level: 2, name: "Pass without Trace", prepared: true, school: "Abjuration", castingTime: "1 action", range: "Self", verbal: true, somatic: true, material: true, materialText: "Ashes from a burned leaf", duration: "1 hour", concentration: true, ritual: false, notes: "+10 Stealth aura." },
      { id: "spell-conjure-barrage", level: 3, name: "Conjure Barrage", prepared: false, school: "Conjuration", castingTime: "1 action", range: "Self", verbal: true, somatic: true, material: true, materialText: "One piece of ammunition", duration: "Instant", concentration: false, ritual: false, notes: "Cone of spectral ammunition." }
    ]
  },
  equipment: {
    coins: { cp: 12, sp: 18, ep: 0, gp: 143, pp: 4 },
    items: [
      { id: "item-longbow", name: "Moonlit Longbow", type: "weapon", quantity: 1, weight: 2, value: "rare", equipped: true, notes: "A quiet bow with silver runes." },
      { id: "item-leather", name: "Studded Leather", type: "armor", quantity: 1, weight: 13, value: "45 gp", equipped: true, armorClass: 12, notes: "Travel worn, well cared for." },
      { id: "item-rope", name: "Silk rope", type: "gear", quantity: 1, weight: 5, value: "10 gp", equipped: false, notes: "50 feet." }
    ],
    notes: "Explorer's pack, hooded lantern, herbalism kit.",
    legacyNotes: ""
  },
  proficiencies: "Longbows, short swords, light armor, herbalism kit",
  features: "Favored Enemy, Natural Explorer, Dread Ambusher",
  appearance: "Weathered green cloak, silver leaf clasp.",
  personality: {
    traits: "Quiet until the trail turns dangerous.",
    ideals: "Every lost traveler deserves a path home.",
    bonds: "Protects the old forest roads.",
    flaws: "Trusts signs in the wild more than people."
  },
  notes: "Campaign: The Glasswood Marches"
};

const sampleHistory = [
  {
    id: "history-manual-1",
    timestamp: Date.now() - 1000 * 60 * 8,
    reason: "Manual snapshot",
    summary: {
      title: "Aelar Stormwatch",
      subtitle: "Level 7 Wood Elf Ranger",
      armorClass: 16,
      hitPoints: "42/52",
      updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    character: sampleCharacter
  },
  {
    id: "history-autosave-1",
    timestamp: Date.now() - 1000 * 60 * 31,
    reason: "Autosave",
    summary: {
      title: "Before the ambush",
      subtitle: "Level 7 Wood Elf Ranger",
      armorClass: 16,
      hitPoints: "52/52",
      updatedAt: new Date(Date.now() - 1000 * 60 * 31).toISOString()
    },
    character: {
      ...sampleCharacter,
      combat: {
        ...sampleCharacter.combat,
        hitPoints: { current: 52, max: 52, temporary: 0 },
        conditions: ""
      }
    }
  }
];

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function requestJson(url) {
  return fetch(url).then(async (response) => {
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    return response.json();
  });
}

async function waitForChrome() {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    try {
      return await requestJson(`http://localhost:${PORT}/json/version`);
    } catch {
      await sleep(150);
    }
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

async function openPageTarget() {
  try {
    return await requestJson(`http://localhost:${PORT}/json/new?${encodeURIComponent("about:blank")}`);
  } catch {
    return await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
  }
}

function createCdpClient(webSocketDebuggerUrl) {
  const ws = createWebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const events = new Map();

  ws.onMessage((data) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve: resolveCommand, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolveCommand(message.result || {});
      return;
    }
    const handlers = events.get(message.method) || [];
    for (const handler of handlers) handler(message.params || {});
  });

  return {
    ready: ws.ready,
    send(method, params = {}) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveCommand, reject) => pending.set(id, { resolve: resolveCommand, reject }));
    },
    on(method, handler) {
      events.set(method, [...(events.get(method) || []), handler]);
    },
    close() {
      ws.close();
    }
  };
}

function createWebSocket(url) {
  const parsed = new URL(url);
  const socket = connect(Number(parsed.port), parsed.hostname);
  const key = randomBytes(16).toString("base64");
  const accept = createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
  const path = `${parsed.pathname}${parsed.search}`;
  const messageHandlers = [];
  let buffer = Buffer.alloc(0);
  let opened = false;

  const ready = new Promise((resolveReady, rejectReady) => {
    socket.once("connect", () => {
      socket.write([
        `GET ${path} HTTP/1.1`,
        `Host: ${parsed.host}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        ""
      ].join("\r\n"));
    });
    socket.once("error", rejectReady);
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!opened) {
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;
        const headers = buffer.slice(0, headerEnd).toString("utf8");
        if (!headers.includes("101") || !headers.includes(accept)) {
          rejectReady(new Error(`WebSocket handshake failed: ${headers}`));
          return;
        }
        opened = true;
        buffer = buffer.slice(headerEnd + 4);
        resolveReady();
      }
      while (opened) {
        const frame = readFrame(buffer);
        if (!frame) break;
        buffer = buffer.slice(frame.bytes);
        if (frame.opcode === 1) {
          const text = frame.payload.toString("utf8");
          for (const handler of messageHandlers) handler(text);
        }
        if (frame.opcode === 8) socket.end();
      }
    });
  });

  return {
    ready,
    onMessage(handler) {
      messageHandlers.push(handler);
    },
    send(text) {
      socket.write(writeFrame(Buffer.from(text, "utf8")));
    },
    close() {
      socket.end();
    }
  };
}

function readFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const masked = Boolean(buffer[1] & 0x80);
  let length = buffer[1] & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null;
    length = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }
  let mask;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  if (buffer.length < offset + length) return null;
  const payload = Buffer.from(buffer.slice(offset, offset + length));
  if (masked) {
    for (let index = 0; index < payload.length; index += 1) {
      payload[index] ^= mask[index % 4];
    }
  }
  return { opcode, payload, bytes: offset + length };
}

function writeFrame(payload) {
  const mask = randomBytes(4);
  const header = [];
  header.push(0x81);
  if (payload.length < 126) {
    header.push(0x80 | payload.length);
  } else if (payload.length < 65536) {
    header.push(0x80 | 126, (payload.length >> 8) & 0xff, payload.length & 0xff);
  } else {
    header.push(0x80 | 127, 0, 0, 0, 0);
    const high = Math.floor(payload.length / 2 ** 32);
    const low = payload.length >>> 0;
    header.push((high >> 24) & 0xff, (high >> 16) & 0xff, (high >> 8) & 0xff, high & 0xff);
    header.push((low >> 24) & 0xff, (low >> 16) & 0xff, (low >> 8) & 0xff, low & 0xff);
  }
  const maskedPayload = Buffer.from(payload);
  for (let index = 0; index < maskedPayload.length; index += 1) {
    maskedPayload[index] ^= mask[index % 4];
  }
  return Buffer.concat([Buffer.from(header), mask, maskedPayload]);
}

async function navigate(cdp, url) {
  let loaded = false;
  const loadPromise = new Promise((resolveLoad) => {
    cdp.on("Page.loadEventFired", () => {
      loaded = true;
      resolveLoad();
    });
  });
  await cdp.send("Page.navigate", { url });
  await Promise.race([loadPromise, sleep(4500)]);
  if (!loaded) await sleep(500);
}

async function reload(cdp) {
  let loaded = false;
  const loadPromise = new Promise((resolveLoad) => {
    cdp.on("Page.loadEventFired", () => {
      loaded = true;
      resolveLoad();
    });
  });
  await cdp.send("Page.reload", { ignoreCache: true });
  await Promise.race([loadPromise, sleep(4500)]);
  if (!loaded) await sleep(500);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height
  });
}

async function screenshot(cdp, name) {
  await sleep(450);
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true
  });
  await writeFile(resolve(OUT_DIR, name), Buffer.from(result.data, "base64"));
}

async function hideFloatingControls(cdp) {
  await evaluate(cdp, `
    (() => {
      const style = document.createElement("style");
      style.textContent = \`
        body { padding-bottom: 0 !important; }
        nav[aria-label="Quick sections"],
        button[aria-label="Dice"],
        button[aria-label="Open history"],
        [role="status"],
        .fixed.bottom-24,
        .fixed.bottom-28,
        .fixed.bottom-40 {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);
    })()
  `);
}

async function setDemoStorage(cdp) {
  await evaluate(cdp, `
    localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(sampleCharacter))});
    localStorage.setItem(${JSON.stringify(HISTORY_KEY)}, ${JSON.stringify(JSON.stringify(sampleHistory))});
    localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, "en");
  `);
}

async function installDemoStorage(cdp) {
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(sampleCharacter))});
      localStorage.setItem(${JSON.stringify(HISTORY_KEY)}, ${JSON.stringify(JSON.stringify(sampleHistory))});
      localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, "en");
    `
  });
}

async function waitForText(cdp, text) {
  const expected = text.toLowerCase();
  const started = Date.now();
  while (Date.now() - started < 8000) {
    const found = await evaluate(cdp, `document.body.textContent.toLowerCase().includes(${JSON.stringify(expected)})`);
    if (found) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function clickText(cdp, text) {
  await evaluate(cdp, `
    (() => {
      const text = ${JSON.stringify(text)};
      const candidates = [...document.querySelectorAll("button, summary, a")];
      const node = candidates.find((item) => item.textContent.trim().toLowerCase().includes(text.toLowerCase()) || item.getAttribute("aria-label") === text);
      if (!node) throw new Error("No clickable text: " + text);
      node.click();
    })()
  `);
  await sleep(650);
}

async function clickDiceCountIncrease(cdp, times = 1) {
  for (let index = 0; index < times; index += 1) {
    await evaluate(cdp, `
      (() => {
        const dialog = document.querySelector('[role="dialog"]') || document;
        const buttons = [...dialog.querySelectorAll("button")].filter((button) => button.textContent.trim() === "+");
        const button = buttons[0];
        if (!button) throw new Error("No dice count increase button");
        button.click();
      })()
    `);
    await sleep(160);
  }
}

async function openDetails(cdp, title) {
  await evaluate(cdp, `
    (() => {
      const title = ${JSON.stringify(title)};
      const details = [...document.querySelectorAll("details")];
      const item = details.find((node) => node.textContent.toLowerCase().includes(title.toLowerCase()));
      if (!item) throw new Error("No details section: " + title);
      item.open = true;
      item.scrollIntoView({ block: "start" });
    })()
  `);
  await sleep(700);
}

async function scrollToText(cdp, text) {
  await evaluate(cdp, `
    (() => {
      const text = ${JSON.stringify(text)}.toLowerCase();
      const node = [...document.querySelectorAll("section, details, article, div, h2, h3, p, span")]
        .filter((item) => item.textContent.toLowerCase().includes(text))
        .sort((a, b) => a.textContent.length - b.textContent.length)[0];
      if (!node) throw new Error("No text section: " + text);
      node.scrollIntoView({ block: "start" });
    })()
  `);
  await sleep(650);
}

async function scrollToY(cdp, y) {
  await evaluate(cdp, `window.scrollTo(0, ${Number(y) || 0})`);
  await sleep(650);
}

async function composeMobile(cdp) {
  const mobile = await readFile(resolve(OUT_DIR, "gallery-07-mobile-raw.png"), "base64");
  await setViewport(cdp, 1270, 760, false);
  await navigate(cdp, "about:blank");
  await evaluate(cdp, `
    document.open();
    document.write(${JSON.stringify(`<!doctype html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              width: 1270px;
              height: 760px;
              overflow: hidden;
              display: grid;
              grid-template-columns: 1fr 430px;
              align-items: center;
              gap: 58px;
              padding: 58px 78px;
              background:
                linear-gradient(120deg, rgba(245,235,213,.94), rgba(218,196,148,.82)),
                repeating-linear-gradient(0deg, rgba(40,24,18,.12) 0 1px, transparent 1px 9px);
              font-family: Georgia, serif;
              color: #251813;
            }
            h1 {
              margin: 0;
              font-size: 66px;
              line-height: .95;
              letter-spacing: 0;
              max-width: 650px;
            }
            p {
              max-width: 560px;
              margin: 28px 0 0;
              font: 700 24px/1.35 system-ui, sans-serif;
              color: #604636;
            }
            .phone {
              justify-self: end;
              width: 360px;
              height: 640px;
              padding: 14px;
              border-radius: 38px;
              background: #251813;
              box-shadow: 0 26px 70px rgba(37,24,19,.35);
            }
            .screen {
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: top center;
              border-radius: 26px;
              display: block;
            }
            .badge {
              display: inline-block;
              margin-bottom: 24px;
              border: 2px solid #8c1f24;
              border-radius: 999px;
              padding: 10px 16px;
              font: 900 18px/1 system-ui, sans-serif;
              text-transform: uppercase;
              letter-spacing: .08em;
              color: #8c1f24;
            }
          </style>
        </head>
        <body>
          <main>
            <div class="badge">Mobile ready</div>
            <h1>Designed for the table, not the desk.</h1>
            <p>Track HP, resources, dice, spells, and backups from a phone during a live session.</p>
          </main>
          <div class="phone"><img class="screen" src="data:image/png;base64,${mobile}" alt=""></div>
        </body>
      </html>`)});
    document.close();
  `);
  await sleep(700);
  await screenshot(cdp, "gallery-07-mobile.png");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=/tmp/dnd-character-vault-ph-${Date.now()}`
  ], { stdio: "ignore" });

  try {
    await waitForChrome();
    const target = await openPageTarget();
    const cdp = createCdpClient(target.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await setViewport(cdp, 1270, 760);
    await installDemoStorage(cdp);
    await navigate(cdp, APP_URL);
    await sleep(1200);
    await waitForText(cdp, "Aelar Stormwatch");

    await evaluate(cdp, "window.scrollTo(0, 0)");
    await screenshot(cdp, "gallery-01-hero.png");

    await scrollToY(cdp, 360);
    await screenshot(cdp, "gallery-02-session-controls.png");

    await clickText(cdp, "Dice");
    await waitForText(cdp, "Select dice and roll");
    await clickDiceCountIncrease(cdp, 5);
    await clickText(cdp, "Roll");
    await sleep(8500);
    await screenshot(cdp, "gallery-03-dice.png");
    await evaluate(cdp, "document.querySelector('[aria-label=\"Close\"]')?.click()");
    await sleep(500);

    await clickText(cdp, "Edit");
    await openDetails(cdp, "Spells");
    await scrollToText(cdp, "Known spells");
    await screenshot(cdp, "gallery-04-spellbook.png");

    await openDetails(cdp, "Inventory");
    await screenshot(cdp, "gallery-05-inventory.png");

    await clickText(cdp, "Open history");
    await setDemoStorage(cdp);
    await screenshot(cdp, "gallery-06-history-backups.png");
    await evaluate(cdp, "document.querySelector('[aria-label=\"Close\"]')?.click()");
    await sleep(500);

    await setViewport(cdp, 390, 760, true);
    await reload(cdp);
    await hideFloatingControls(cdp);
    await scrollToY(cdp, 0);
    await sleep(900);
    await screenshot(cdp, "gallery-07-mobile-raw.png");

    cdp.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
