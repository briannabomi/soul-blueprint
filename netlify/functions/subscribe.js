exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // ── env checks ──
  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_TAG_ID = process.env.KIT_TAG_ID;

  if (!KIT_API_KEY) {
    console.error("[subscribe] KIT_API_KEY not set in environment");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing API key" }) };
  }
  if (!KIT_TAG_ID) {
    console.error("[subscribe] KIT_TAG_ID not set in environment");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing tag ID" }) };
  }

  // ── parse body ──
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    console.error("[subscribe] Failed to parse request body");
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email_address, first_name, fields } = payload;
  if (!email_address || !email_address.includes("@")) {
    console.error("[subscribe] Invalid or missing email_address:", email_address);
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email_address required" }) };
  }

  console.log("[subscribe] Creating subscriber for:", email_address);

  // ── shared headers for Kit V4 ──
  const kitHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Kit-Api-Key": KIT_API_KEY
  };

  try {
    // ── Step 1: Create subscriber ──
    const createBody = {
      email_address,
      first_name: first_name || "",
      fields: fields || {}
    };
    console.log("[subscribe] Step 1 — POST /v4/subscribers, body:", JSON.stringify({ ...createBody, email_address: "REDACTED" }));

    const createRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: kitHeaders,
      body: JSON.stringify(createBody)
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error("[subscribe] Step 1 failed — status:", createRes.status, "response:", JSON.stringify(createData));
      return {
        statusCode: createRes.status,
        body: JSON.stringify({ error: "Kit API error: failed to create subscriber", detail: createData })
      };
    }

    const subscriberId = createData.subscriber?.id;
    if (!subscriberId) {
      console.error("[subscribe] Step 1 succeeded but no subscriber id in response:", JSON.stringify(createData));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Kit returned success but no subscriber id", detail: createData })
      };
    }

    console.log("[subscribe] Step 1 success — subscriber id:", subscriberId);

    // ── Step 2: Tag the subscriber ──
    console.log("[subscribe] Step 2 — POST /v4/tags/" + KIT_TAG_ID + "/subscribers/" + subscriberId);

    const tagRes = await fetch(`https://api.kit.com/v4/tags/${KIT_TAG_ID}/subscribers/${subscriberId}`, {
      method: "POST",
      headers: kitHeaders
    });

    const tagData = await tagRes.json();

    if (!tagRes.ok) {
      console.error("[subscribe] Step 2 failed — status:", tagRes.status, "response:", JSON.stringify(tagData));
      return {
        statusCode: tagRes.status,
        body: JSON.stringify({ error: "Kit API error: failed to tag subscriber", detail: tagData })
      };
    }

    console.log("[subscribe] Step 2 success — subscriber tagged");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, subscriberId })
    };

  } catch (err) {
    console.error("[subscribe] Unexpected error:", err.message);
    return { statusCode: 502, body: JSON.stringify({ error: "Failed to reach Kit", detail: err.message }) };
  }
};
