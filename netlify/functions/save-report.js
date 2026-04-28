const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

module.exports = async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!payload || typeof payload !== "object") {
    return new Response(JSON.stringify({ error: "Report data required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate a UUID for this report
  let reportId;
  try {
    reportId = crypto.randomUUID();
  } catch {
    reportId = crypto.randomBytes(16).toString("hex").replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"
    );
  }

  try {
    const store = getStore("soul-blueprints");
    await store.setJSON(reportId, {
      ...payload,
      createdAt: new Date().toISOString()
    });

    console.log("[save-report] Saved report:", reportId);

    return new Response(JSON.stringify({ success: true, reportId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[save-report] Blob write error:", err.message, err.stack);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to save report",
      detail: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

module.exports.config = {
  path: "/.netlify/functions/save-report"
};
