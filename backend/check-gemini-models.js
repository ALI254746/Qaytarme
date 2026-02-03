/**
 * Gemini model diagnostics:
 * - Lists available models (v1beta)
 * - Tests generateContent for a few candidate models
 *
 * Usage (PowerShell):
 *   cd backend
 *   node check-gemini-models.js
 *
 * Reads:
 *   GEMINI_API_KEY, GEMINI_MODEL (optional)
 */

/* eslint-disable no-console */

require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set.");
  process.exit(1);
}

const BASE = "https://generativelanguage.googleapis.com/v1beta";

async function httpJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `${res.status} ${res.statusText}` ||
      "Unknown error";
    const err = new Error(msg);
    err.status = res.status;
    err.statusText = res.statusText;
    err.details = json;
    throw err;
  }
  return json;
}

async function listModels() {
  const url = `${BASE}/models?key=${encodeURIComponent(apiKey)}`;
  const data = await httpJson(url, { method: "GET" });
  const models = Array.isArray(data?.models) ? data.models : [];
  return models.map((m) => ({
    name: m.name, // e.g. "models/gemini-2.0-flash"
    supported: m.supportedGenerationMethods || [],
  }));
}

async function testGenerateContent(modelNameOrId) {
  // Accept either "models/xxx" or "xxx"
  const modelId = modelNameOrId.startsWith("models/")
    ? modelNameOrId.slice("models/".length)
    : modelNameOrId;

  const url = `${BASE}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: 'Say "OK"' }] }],
  };
  const data = await httpJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.output ??
    null;
  return { ok: true, text };
}

function pickCandidates(models) {
  // Prefer "gemini-2.*" then generic latest aliases.
  const ids = models
    .filter((m) => (m.supported || []).includes("generateContent"))
    .map((m) => m.name) // keep "models/.."
    .map((n) => n.replace(/^models\//, ""));

  const preferredPrefixes = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-pro",
  ];

  const preferred = [];
  for (const p of preferredPrefixes) {
    for (const id of ids) {
      if (id === p || id.startsWith(`${p}-`)) preferred.push(id);
    }
  }

  // Add a few more unique candidates
  const rest = ids.filter((id) => !preferred.includes(id));
  const unique = [...preferred, ...rest];

  // Limit to avoid spamming / rate limiting
  return unique.slice(0, 12);
}

(async () => {
  console.log("🔎 Listing models...");
  const models = await listModels();
  const genModels = models.filter((m) => (m.supported || []).includes("generateContent"));

  console.log(`✅ Found ${genModels.length} models supporting generateContent.`);
  console.log(
    genModels
      .slice(0, 20)
      .map((m) => `- ${m.name}`)
      .join("\n"),
  );
  if (genModels.length > 20) console.log("... (truncated)");

  const current = process.env.GEMINI_MODEL;
  if (current) {
    console.log(`\n🧪 Testing current GEMINI_MODEL=${current}`);
    try {
      const r = await testGenerateContent(current);
      console.log(`✅ Current model works. Response: ${String(r.text || "").slice(0, 80)}`);
      process.exit(0);
    } catch (e) {
      console.log(`❌ Current model failed: ${e.message} (status: ${e.status || "N/A"})`);
    }
  }

  console.log("\n🧪 Testing candidate models...");
  const candidates = pickCandidates(models);
  for (const id of candidates) {
    process.stdout.write(`- ${id}: `);
    try {
      const r = await testGenerateContent(id);
      console.log(`✅ OK (${String(r.text || "").slice(0, 30)})`);
      console.log(`\n🎯 Recommended GEMINI_MODEL=${id}`);
      process.exit(0);
    } catch (e) {
      console.log(`❌ FAIL (${e.status || "N/A"}): ${e.message}`);
    }
  }

  console.log("\n❌ No candidate model worked.");
  console.log("Next steps:");
  console.log("- Ensure you are using a Gemini Developer API key (Google AI Studio), not a restricted key.");
  console.log("- Check API key restrictions in Google Cloud Console (Application restrictions / API restrictions).");
  process.exit(2);
})().catch((e) => {
  console.error("❌ Fatal error:", e?.message || e);
  if (e?.details) console.error(JSON.stringify(e.details, null, 2));
  process.exit(1);
});

