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
  const KIT_API_KEY = process.env.KIT_API_KEY || process.env.KIT_API_SECRET;
  const KIT_TAG_ID = process.env.KIT_TAG_ID;

  const keyPrefix = KIT_API_KEY ? KIT_API_KEY.substring(0, 6) : "N/A";
  const keyLength = KIT_API_KEY ? KIT_API_KEY.length : 0;
  console.log("[subscribe] ENV CHECK — API key prefix:", keyPrefix, "| length:", keyLength);
  console.log("[subscribe] ENV CHECK — KIT_TAG_ID:", KIT_TAG_ID || "MISSING");

  if (!KIT_API_KEY) {
    console.error("[subscribe] FATAL: No API key found (checked KIT_API_KEY and KIT_API_SECRET)");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "Server misconfigured: missing API key" })
    };
  }

  // Kit v4 keys start with "kit_" — warn if format looks wrong
  if (!KIT_API_KEY.startsWith("kit_")) {
    console.warn("[subscribe] WARNING: API key does not start with 'kit_' — this may be a v3 key or incorrect value. Kit v4 keys look like: kit_xxxxxxxx");
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
  // Kit v4 API authenticates via X-Kit-Api-Key header.
  // Key must be a v4 API key (starts with "kit_").
  // Get yours at: https://app.kit.com/account/edit#api_key
  const kitHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Kit-Api-Key": KIT_API_KEY
  };
  console.log("[subscribe] Auth header set: X-Kit-Api-Key");

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
