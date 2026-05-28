// pages/api/ai.js
// Vercel Serverless Function — proxy for Groq Cloud API

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prompt, system } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const GROQ_KEY = process.env.GROQ_API_KEY || "";
  const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-versatile";
  if (!GROQ_KEY) return res.status(500).json({ error: "GROQ_API_KEY not set. Set GROQ_API_KEY in your environment." });
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  try {
    const response = await fetch(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 1000,
          temperature: 0.85,
        }),
      }
    );
    if (!response.ok) {
      // Attempt to get JSON error; include details for easier debugging
      let errBody;
      try { errBody = await response.json(); } catch(e) { errBody = await response.text().catch(()=>null); }
      const errMsg = (errBody && errBody.error && errBody.error.message) ? errBody.error.message : (typeof errBody === 'string' ? errBody : 'Groq error');
      // If the error indicates the model doesn't exist, return a helpful message
      if (/model.*does not exist|model.*not found|model.*unknown/i.test(errMsg)) {
        return res.status(400).json({ error: `Model not found: ${GROQ_MODEL}. Set GROQ_MODEL to a valid Groq model or use the Ollama fallback (set OLLAMA_API_KEY).`, details: errMsg });
      }
      return res.status(response.status).json({ error: errMsg });
    }
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "No response";
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
