const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, reportId })
    };
  } catch (err) {
    console.error("[save-report] Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Failed to save report", detail: err.message })
    };
  }
};
