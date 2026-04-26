exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const KIT_API_KEY = process.env.KIT_API_KEY;
  if (!KIT_API_KEY) {
    console.error("KIT_API_KEY not set in environment");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, first_name, fields } = payload;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const TAG_ID = "19191148";

  try {
    const res = await fetch(`https://api.convertkit.com/v3/tags/${TAG_ID}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
        first_name: first_name || "",
        fields: fields || {}
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Kit API error:", res.status, data);
      return { statusCode: res.status, body: JSON.stringify({ error: "Kit API error", detail: data }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, subscriber: data.subscription })
    };
  } catch (err) {
    console.error("Kit request failed:", err);
    return { statusCode: 502, body: JSON.stringify({ error: "Failed to reach Kit" }) };
  }
};
