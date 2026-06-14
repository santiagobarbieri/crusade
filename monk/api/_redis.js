const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Ejecuta varios comandos Redis en una sola request (pipeline).
// Cada comando es un array, ej: ['GET', 'cluster:123']
// Devuelve un array de resultados en el mismo orden.
export async function redisPipeline(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  return res.json();
}

// Ejecuta un solo comando Redis. Devuelve { result } o { error }.
export async function redisCmd(...args) {
  const [result] = await redisPipeline([args]);
  return result;
}
