// pages/api/ai.js
// Vercel Serverless Function — proxy for Groq Cloud API

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prompt, system } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const GROQ_KEY = process.env.GROQ_API_KEY || "";
  if (!GROQ_KEY) return res.status(500).json({ error: "GROQ_API_KEY not set" });
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
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 1000,
          temperature: 0.85,
        }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || "Groq error" });
    }
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "No response";
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
