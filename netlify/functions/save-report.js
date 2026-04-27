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

  const reportId = crypto.randomUUID();

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
    console.error("[save-report] Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save report", detail: err.message })
    };
  }
};
