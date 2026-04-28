const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const reportId = event.queryStringParameters?.id;
  if (!reportId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing report id" }) };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid report id" }) };
  }

  try {
    const store = getStore("soul-blueprints");
    const data = await store.get(reportId, { type: "json" });

    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ error: "Report not found" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("[get-report] Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve report", detail: err.message })
    };
  }
};
