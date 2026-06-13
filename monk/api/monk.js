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

  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://crusade.vercel.app',
        'X-Title': 'MONK — CRUSADE®'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages
        ],
        temperature: 0.85,
        max_tokens: 800
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenRouter error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}