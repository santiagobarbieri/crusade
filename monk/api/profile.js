import { redisCmd } from './_redis.js';

const PROFILE_KEY = 'profile:default';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // -------- GET (ver el perfil actual) --------
  if (req.method === 'GET') {
    const r = await redisCmd('GET', PROFILE_KEY);
    return res.status(200).json({ profile: r.result || '' });
  }

  // -------- POST (actualizar el perfil con conversación reciente) --------
  if (req.method === 'POST') {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages requerido' });
    }

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

    const current = await redisCmd('GET', PROFILE_KEY);
    const currentProfile = current.result || '(todavia no hay nada anotado)';

    const transcript = messages
      .map(m => `${m.role === 'user' ? 'Persona' : 'MONK'}: ${m.content}`)
      .join('\n');

    const PROMPT = `Perfil actual de la persona con la que hablas:
${currentProfile}

Conversacion reciente:
${transcript}

Actualiza el perfil incorporando patrones nuevos: gustos recurrentes, referencias que repite, direcciones que evita, forma de trabajar. Si algo del perfil actual ya no aplica, sacalo. Mantenelo en español rioplatense, en tercera persona, maximo 120 palabras, sin saludos ni comentarios. Devolve unicamente el texto del perfil actualizado.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: PROMPT }],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'Groq error' });
      }

      const newProfile = data.choices?.[0]?.message?.content?.trim() || currentProfile;
      await redisCmd('SET', PROFILE_KEY, newProfile);

      return res.status(200).json({ profile: newProfile });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
