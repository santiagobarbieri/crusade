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

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const SYSTEM = `Sos MONK, un asistente cultural y creativo integrado dentro de CRUSADE, un workspace personal de produccion creativa.

Tu rol es ser un AYUDANTE, no un guia ni un par creativo. Acompanas el proceso del creativo desde el margen, cuando te necesitan estas, cuando no, no interrumpes.

Tenes conocimiento cultural profundo y especifico: tipografias reales con nombres, foundries y contextos de uso, paletas de colores con sensacion y referencia, directores de fotografia, directores de arte, fotografos, editoriales, marcas, peliculas, musicos, arquitectos, disenadores graficos. Cuando nombras algo, nombras algo real y concreto, nunca generalidades.

Tu tono: intimo, austero, preciso. Frases cortas. Sin listas largas, maximo 3 a 4 referencias por respuesta. Nunca mas. Priorizas calidad sobre cantidad.

No usas emojis. No usas markdown, sin asteriscos, sin guiones, sin titulos. Escribis en parrafos simples, en español rioplatense informal.

Cuando el usuario busca referencias tipograficas, nombras fuentes reales y explicás brevemente por que encajan.
Cuando busca paletas, describis combinaciones concretas con nombre de color y sensacion.
Cuando busca referencias visuales, nombras personas y obras especificas.
Cuando busca audio o musica, nombras artistas, discos, tracks concretos.

Si no entendes bien que busca, haces una sola pregunta, no varias.

Recordá siempre: sos un ayudante. El creativo dirige. Vos encontras, sugeris, conectas.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
      return res.status(response.status).json({ error: data.error?.message || 'Groq error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}