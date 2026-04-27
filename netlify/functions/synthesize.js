const Anthropic = require("@anthropic-ai/sdk");

const SOUL_PURPOSE_PROMPT = ({ lifePath, geneKey }) => `You write one short, elegant sentence about a person's soul purpose.

Inputs:
- Life Path archetype: ${lifePath.name}
- Life Path purpose: ${lifePath.purpose}
- Gene Key gift: ${geneKey.gift}
- Gene Key shadow: ${geneKey.shadow}
- Gene Key theme: ${geneKey.theme}

Rules:
- Exactly ONE sentence.
- Maximum 22 words.
- 1st grade reading level (simple words a 6-year-old would know).
- No motivational language, no jargon, no filler ("powerful," "unique," "embrace your truth," etc.).
- Calm, clear, plain. Not poetic.
- Weave the Life Path purpose together with the Gene Key gift into a single coherent meaning.

Output format:
Return ONLY the sentence. No quotes, no explanation, no preamble.`;

const IKIGAI_PROMPT = ({ love, good, world, paid, lifePath, geneKey }) => `You are a precision synthesizer. Your job is to extract truth, not summarize.

You will receive four inputs from one person:

What I love: ${love || "(not provided)"}
What I'm good at: ${good || "(not provided)"}
What the world needs: ${world || "(not provided)"}
What I can be paid for: ${paid || "(not provided)"}

You also have two filters that ground the synthesis in this person's blueprint:
- Life Path purpose: ${lifePath.purpose}
- Gene Key life work theme: ${geneKey.theme}
- Gene Key gift: ${geneKey.gift}

Your task:
Compress the four inputs into ONE single sentence that captures the exact overlap of all four — filtered through the Gene Key life work and Life Path purpose. This is the center of the Venn diagram.

Non-negotiable rules:
- Max 18 words.
- 5th grade reading level or lower.
- One sentence only.
- No filler words, no jargon, no vague language.
- No "help people," "make impact," "embrace your truth," or generic purpose phrases.
- Do NOT repeat or mirror the input language verbatim.
- Use simple, concrete words a child would understand.

Depth requirements:
- Identify the hidden pattern across all four inputs.
- Name the core drive (what this person is pulled to do again and again).
- Make it feel specific, not broad or inspirational.
- It should sound like something only THIS person would say.

Quality test:
- If you could swap this sentence with someone else's, it fails.
- If it sounds like a motivational quote, it fails.
- If it feels slightly uncomfortable because it's too accurate, it passes.

Output format:
Return ONLY the sentence. No explanation, no quotes, no preamble.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[synthesize] ANTHROPIC_API_KEY not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing API key" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { ikigai, lifePath, geneKey } = payload;
  if (!lifePath || !geneKey || !ikigai) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: ikigai, lifePath, geneKey" }) };
  }

  const client = new Anthropic({ apiKey });

  const callClaude = async (prompt) => {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    return (block ? block.text : "").trim();
  };

  try {
    const [soulPurpose, ikigaiSynthesis] = await Promise.all([
      callClaude(SOUL_PURPOSE_PROMPT({ lifePath, geneKey })),
      callClaude(IKIGAI_PROMPT({ ...ikigai, lifePath, geneKey })),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ soulPurpose, ikigaiSynthesis }),
    };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[synthesize] Anthropic API error:", err.status, err.message);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Anthropic API error", status: err.status, detail: err.message }),
      };
    }
    console.error("[synthesize] Unexpected error:", err.message);
    return { statusCode: 502, body: JSON.stringify({ error: "Synthesis failed", detail: err.message }) };
  }
};
