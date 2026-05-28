// pages/api/ollama.js
// Serverless proxy to Ollama Cloud (fallback when Google quota is exhausted)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prompt, system, model = "llama2" } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  try {
    const response = await fetch(`https://api.ollama.com/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_KEY ? { Authorization: `Bearer ${OLLAMA_KEY}` } : {}),
      },
      body: JSON.stringify({ model, prompt: fullPrompt, max_tokens: 1000, temperature: 0.85 }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText || `Ollama error ${response.status}` });
    }

    const data = await response.json();
    // Attempt to extract text from known response shapes
    const text = data.output || data.text || (data.choices && data.choices[0] && (data.choices[0].message?.content || data.choices[0].text)) || JSON.stringify(data);
    return res.status(200).json({ result: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
