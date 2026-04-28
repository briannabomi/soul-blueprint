exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // ── ENV VAR DIAGNOSTICS ──────────────────────────────────
  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_API_SECRET = process.env.KIT_API_SECRET;
  const KIT_TAG_ID = process.env.KIT_TAG_ID;

  console.log("[subscribe] ENV CHECK — KIT_API_KEY:", KIT_API_KEY ? `set (${KIT_API_KEY.length} chars)` : "MISSING");
  console.log("[subscribe] ENV CHECK — KIT_API_SECRET:", KIT_API_SECRET ? `set (${KIT_API_SECRET.length} chars)` : "not set (will use KIT_API_KEY)");
  console.log("[subscribe] ENV CHECK — KIT_TAG_ID:", KIT_TAG_ID || "MISSING");

  // Accept either KIT_API_SECRET (preferred for write ops) or KIT_API_KEY
  const apiCredential = KIT_API_SECRET || KIT_API_KEY;

  if (!apiCredential) {
    console.error("[subscribe] FATAL: Neither KIT_API_SECRET nor KIT_API_KEY is set");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "Server misconfigured: missing API credentials" })
    };
  }
  if (!KIT_TAG_ID) {
    console.error("[subscribe] FATAL: KIT_TAG_ID not set");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "Server misconfigured: missing tag ID" })
    };
  }

  // ── PARSE BODY ───────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Invalid JSON" }) };
  }

  const { email_address, first_name, fields } = payload;
  console.log("[subscribe] Received payload:", JSON.stringify({ email_address, first_name, fields_keys: fields ? Object.keys(fields) : [] }));

  if (!email_address || !email_address.includes("@")) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Valid email_address required" }) };
  }

  // ── AUTH HEADERS ─────────────────────────────────────────
  // Kit v4 supports two auth methods:
  //   1. Authorization: Bearer <api_secret>  (full write access — PREFERRED)
  //   2. X-Kit-Api-Key: <api_key>            (limited, may not create subscribers)
  // We try Bearer first if KIT_API_SECRET is set; otherwise fall back to X-Kit-Api-Key.
  const kitHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (KIT_API_SECRET) {
    kitHeaders["Authorization"] = `Bearer ${KIT_API_SECRET}`;
    console.log("[subscribe] Using Authorization: Bearer (API secret)");
  } else {
    kitHeaders["X-Kit-Api-Key"] = KIT_API_KEY;
    console.log("[subscribe] Using X-Kit-Api-Key (public key — may lack write permission)");
  }

  try {
    // ── STEP 1: CREATE SUBSCRIBER ────────────────────────────
    const createBody = {
      email_address,
      first_name: first_name || "",
      fields: fields || {}
    };

    console.log("[subscribe] Step 1 — POST https://api.kit.com/v4/subscribers");
    console.log("[subscribe] Request body:", JSON.stringify(createBody));

    const createRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: kitHeaders,
      body: JSON.stringify(createBody)
    });

    const createText = await createRes.text();
    console.log("[subscribe] Step 1 response status:", createRes.status);
    console.log("[subscribe] Step 1 response body:", createText);

    let createData;
    try {
      createData = JSON.parse(createText);
    } catch {
      console.error("[subscribe] Step 1 response is not JSON:", createText.substring(0, 500));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ success: false, error: "Kit returned non-JSON response", status: createRes.status, raw: createText.substring(0, 200) })
      };
    }

    if (!createRes.ok) {
      console.error("[subscribe] Step 1 FAILED:", createRes.status, JSON.stringify(createData));
      return {
        statusCode: createRes.status,
        headers,
        body: JSON.stringify({ success: false, error: "Kit: failed to create subscriber", status: createRes.status, detail: createData })
      };
    }

    const subscriberId = createData.subscriber?.id;
    if (!subscriberId) {
      console.error("[subscribe] No subscriber.id in response:", JSON.stringify(createData));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ success: false, error: "Kit returned no subscriber id", detail: createData })
      };
    }

    console.log("[subscribe] Subscriber created — id:", subscriberId);

    // ── STEP 2: TAG SUBSCRIBER ───────────────────────────────
    const tagUrl = `https://api.kit.com/v4/tags/${KIT_TAG_ID}/subscribers/${subscriberId}`;
    console.log("[subscribe] Step 2 — POST", tagUrl);

    const tagRes = await fetch(tagUrl, {
      method: "POST",
      headers: kitHeaders
    });

    const tagText = await tagRes.text();
    console.log("[subscribe] Step 2 response status:", tagRes.status);
    console.log("[subscribe] Step 2 response body:", tagText);

    let tagData;
    try { tagData = JSON.parse(tagText); } catch { tagData = tagText; }

    if (!tagRes.ok) {
      console.error("[subscribe] Step 2 tagging FAILED:", tagRes.status);
      // Subscriber was still created — return partial success
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, subscriberId, tagged: false, tagError: tagData })
      };
    }

    console.log("[subscribe] SUCCESS — subscriber created and tagged");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, subscriberId, tagged: true })
    };

  } catch (err) {
    console.error("[subscribe] EXCEPTION:", err.message, err.stack);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ success: false, error: "Failed to reach Kit", detail: err.message })
    };
  }
};
