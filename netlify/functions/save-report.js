const crypto = require("crypto");

let getStore;
try {
  getStore = require("@netlify/blobs").getStore;
} catch (e) {
  console.error("[save-report] Failed to load @netlify/blobs:", e.message);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!getStore) {
    console.error("[save-report] @netlify/blobs not available");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Blob storage not available — @netlify/blobs failed to load" })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!payload || typeof payload !== "object") {
    return { statusCode: 400, body: JSON.stringify({ error: "Report data required" }) };
  }

  // crypto.randomUUID() requires Node 19+ ; fallback for older runtimes
  let reportId;
  try {
    reportId = crypto.randomUUID();
  } catch {
    reportId = crypto.randomBytes(16).toString("hex").replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"
    );
  }

  const bodySize = Buffer.byteLength(event.body, "utf8");
  console.log("[save-report] Payload size:", (bodySize / 1024).toFixed(1), "KB");

  try {
    const store = getStore("soul-blueprints");
    await store.setJSON(reportId, {
      ...payload,
      createdAt: new Date().toISOString()
    });

    console.log("[save-report] Saved report:", reportId);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId })
    };
  } catch (err) {
    console.error("[save-report] Blob write error:", err.message, err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save report", detail: err.message })
    };
  }
};
