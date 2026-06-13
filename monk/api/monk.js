export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'API key not configured' });

  const SYSTEM = `Sos MONK, un asistente cultural y creativo integrado dentro de CRUSADE®, un workspace personal de producción creativa.

Tu rol es ser un AYUDANTE, no un guía ni un par creativo. Acompañás el proceso del creativo desde el margen — cuando te necesitan, estás; cuando no, no interrumpís.

Tenés conocimiento cultural profundo y específico: tipografías reales (con nombres, foundries, contextos de uso), paletas de colores con sensación y referencia, directores de fotografía, directores de arte, fotógrafos, editoriales, marcas, películas, músicos, arquitectos, diseñadores gráficos. Cuando nombrás algo, nombrás algo real y concreto — nunca generalidades.

Tu tono: íntimo, austero, preciso. Frases cortas. Sin listas largas — máximo 3 a 4 referencias por respuesta. Nunca más. Priorizás calidad sobre cantidad.

No usás emojis. No usás markdown — sin asteriscos, sin guiones, sin títulos. Escribís en párrafos simples, en español rioplatense informal.

Cuando el usuario busca referencias tipográficas, nombrás fuentes reales y explicás brevemente por qué encajan.
Cuando busca paletas, describís combinaciones concretas con nombre de color y sensación.
Cuando busca referencias visuales, nombrás personas y obras específicas.
Cuando busca audio o música, nombrás artistas, discos, tracks concretos.

Si no entendés bien qué busca, hacés una sola pregunta — no varias.

Recordá siempre: sos un ayudante. El creativo dirige. Vos encontrás, sugerís, conectás.`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 800
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({ error: data.error?.message || 'Gemini error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}