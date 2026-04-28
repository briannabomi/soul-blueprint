exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_TAG_ID = process.env.KIT_TAG_ID;

  if (!KIT_API_KEY) {
    console.error("[subscribe] KIT_API_KEY not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing API key" }) };
  }
  if (!KIT_TAG_ID) {
    console.error("[subscribe] KIT_TAG_ID not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing tag ID" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email_address, first_name, fields } = payload;
  if (!email_address || !email_address.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email_address required" }) };
  }

  console.log("[subscribe] Creating subscriber for:", email_address);

  const kitHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Kit-Api-Key": KIT_API_KEY
  };

  try {
    // Step 1: Create subscriber with custom fields
    const createBody = {
      email_address,
      first_name: first_name || "",
      fields: fields || {}
    };

    console.log("[subscribe] Step 1 — POST /v4/subscribers");

    const createRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: kitHeaders,
      body: JSON.stringify(createBody)
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error("[subscribe] Step 1 failed:", createRes.status, JSON.stringify(createData));
      return {
        statusCode: createRes.status,
        body: JSON.stringify({ error: "Kit: failed to create subscriber", detail: createData })
      };
    }

    const subscriberId = createData.subscriber?.id;
    if (!subscriberId) {
      console.error("[subscribe] No subscriber id in response:", JSON.stringify(createData));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Kit returned no subscriber id", detail: createData })
      };
    }

    console.log("[subscribe] Subscriber created:", subscriberId);

    // Step 2: Tag the subscriber
    const tagRes = await fetch(`https://api.kit.com/v4/tags/${KIT_TAG_ID}/subscribers/${subscriberId}`, {
      method: "POST",
      headers: kitHeaders
    });

    const tagData = await tagRes.json();

    if (!tagRes.ok) {
      console.error("[subscribe] Tagging failed:", tagRes.status, JSON.stringify(tagData));
      // Subscriber was still created — return partial success
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, subscriberId, tagError: tagData })
      };
    }

    console.log("[subscribe] Subscriber tagged");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, subscriberId })
    };

  } catch (err) {
    console.error("[subscribe] Error:", err.message);
    return { statusCode: 502, body: JSON.stringify({ error: "Failed to reach Kit", detail: err.message }) };
  }
};
