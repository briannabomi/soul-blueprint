const { getStore } = require("@netlify/blobs");

module.exports = async (req, context) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(req.url);
  const reportId = url.searchParams.get("id");

  if (!reportId) {
    return new Response(JSON.stringify({ error: "Missing report id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Basic UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)) {
    return new Response(JSON.stringify({ error: "Invalid report id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const store = getStore("soul-blueprints");
    const data = await store.get(reportId, { type: "json" });

    if (!data) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[get-report] Error:", err.message);
    return new Response(JSON.stringify({
      error: "Failed to retrieve report",
      detail: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

module.exports.config = {
  path: "/.netlify/functions/get-report"
};
