// Netlify serverless function — Kit V4 API
// Creates or updates a subscriber, then tags them.
//
// Required env vars (Netlify dashboard → Site settings → Environment variables):
//   KIT_API_KEY  – Kit V4 API key (Bearer token)
//   KIT_TAG_ID   – numeric tag ID to apply to every subscriber

const KIT_BASE = "https://api.kit.com/v4";

exports.handler = async (event) => {
  // ── Method guard ──────────────────────────────────────────
  if (event.httpMethod !== "POST") {
    return res(405, { error: "Method not allowed" });
  }

  // ── Env vars ──────────────────────────────────────────────
  const { KIT_API_KEY, KIT_TAG_ID } = process.env;

  if (!KIT_API_KEY || !KIT_TAG_ID) {
    console.error("Missing KIT_API_KEY or KIT_TAG_ID environment variables");
    return res(500, { error: "Server configuration error" });
  }

  // ── Parse body ────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return res(400, { error: "Invalid JSON" });
  }

  const { email, first_name, fields } = payload;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res(400, { error: "Valid email required" });
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${KIT_API_KEY}`,
  };

  try {
    // ── Step 1: Create or update subscriber ─────────────────
    const subBody = {
      email_address: email,
    };
    if (first_name) subBody.first_name = first_name;
    if (fields && Object.keys(fields).length > 0) {
      subBody.custom_fields = fields;
    }

    const subRes = await fetch(`${KIT_BASE}/subscribers`, {
      method: "POST",
      headers,
      body: JSON.stringify(subBody),
    });

    const subData = await subRes.json();

    if (!subRes.ok) {
      console.error("Kit create-subscriber error:", subRes.status, subData);
      return res(subRes.status, {
        error: "Failed to create subscriber",
        detail: subData,
      });
    }

    const subscriberId = subData.subscriber?.id;

    if (!subscriberId) {
      console.error("No subscriber ID in Kit response:", subData);
      return res(502, { error: "Unexpected response from email provider" });
    }

    // ── Step 2: Tag the subscriber ──────────────────────────
    const tagRes = await fetch(
      `${KIT_BASE}/tags/${KIT_TAG_ID}/subscribers`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email_address: email }),
      }
    );

    const tagData = await tagRes.json();

    if (!tagRes.ok) {
      // Subscriber was created but tagging failed — log but don't block
      console.error("Kit tag error:", tagRes.status, tagData);
      return res(200, {
        success: true,
        subscriber_id: subscriberId,
        tag_error: "Subscriber created but tagging failed",
      });
    }

    // ── Done ────────────────────────────────────────────────
    return res(200, {
      success: true,
      subscriber_id: subscriberId,
    });
  } catch (err) {
    console.error("Network error:", err);
    return res(502, { error: "Failed to reach email provider" });
  }
};

// Helper — consistent JSON responses
function res(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
