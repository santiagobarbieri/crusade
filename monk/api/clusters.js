import { redisCmd, redisPipeline } from './_redis.js';

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  try {
    // -------- GET --------
    if (req.method === 'GET') {
      if (id) {
        const r = await redisCmd('GET', `cluster:${id}`);
        if (!r.result) return res.status(404).json({ error: 'Cluster no encontrado' });
        return res.status(200).json(JSON.parse(r.result));
      }

      const idx = await redisCmd('SMEMBERS', 'clusters:index');
      const ids = idx.result || [];
      if (!ids.length) return res.status(200).json([]);

      const results = await redisPipeline(ids.map(cid => ['GET', `cluster:${cid}`]));
      const clusters = results
        .map(r => (r.result ? JSON.parse(r.result) : null))
        .filter(Boolean)
        .map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          tags: c.tags,
          itemCount: c.items?.length || 0,
          updatedAt: c.updatedAt
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return res.status(200).json(clusters);
    }

    // -------- POST (crear cluster) --------
    if (req.method === 'POST') {
      const { title, description, category, tags } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title requerido' });

      const now = new Date().toISOString();
      const cluster = {
        id: genId('cluster'),
        title,
        description: description || '',
        category: category || '',
        tags: tags || [],
        items: [],
        createdAt: now,
        updatedAt: now
      };

      await redisCmd('SET', `cluster:${cluster.id}`, JSON.stringify(cluster));
      await redisCmd('SADD', 'clusters:index', cluster.id);

      return res.status(201).json(cluster);
    }

    // -------- PUT (actualizar cluster / items) --------
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const r = await redisCmd('GET', `cluster:${id}`);
      if (!r.result) return res.status(404).json({ error: 'Cluster no encontrado' });

      const cluster = JSON.parse(r.result);
      const body = req.body || {};

      if (body.addItem) {
        const item = { id: genId('item'), ...body.addItem };
        cluster.items = cluster.items || [];
        cluster.items.push(item);
      }
      if (body.removeItem) {
        cluster.items = (cluster.items || []).filter(i => i.id !== body.removeItem);
      }
      if (body.title !== undefined) cluster.title = body.title;
      if (body.description !== undefined) cluster.description = body.description;
      if (body.category !== undefined) cluster.category = body.category;
      if (body.tags !== undefined) cluster.tags = body.tags;
      if (body.items !== undefined) cluster.items = body.items;

      cluster.updatedAt = new Date().toISOString();
      await redisCmd('SET', `cluster:${id}`, JSON.stringify(cluster));

      return res.status(200).json(cluster);
    }

    // -------- DELETE --------
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id requerido' });
      await redisCmd('DEL', `cluster:${id}`);
      await redisCmd('SREM', 'clusters:index', id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
