// Convierte un objeto cluster (ver esquema) en un resumen de texto
// que se inyecta como contexto extra en el system prompt de MONK.

export function buildClusterContext(cluster) {
  if (!cluster) return '';

  const lines = [];

  lines.push(`El creativo está trabajando en el cluster "${cluster.title}".`);
  if (cluster.description) lines.push(`Descripción: ${cluster.description}`);
  if (cluster.category) lines.push(`Categoría: ${cluster.category}`);
  if (cluster.tags?.length) lines.push(`Tags del cluster: ${cluster.tags.join(', ')}`);

  if (cluster.items?.length) {
    lines.push('');
    lines.push('Materiales guardados en este cluster:');

    const byType = {
      image: [],
      typography: [],
      palette: [],
      audio: [],
      text: [],
      link: []
    };

    for (const item of cluster.items) {
      byType[item.type]?.push(item);
    }

    if (byType.image.length) {
      lines.push(`Imágenes (${byType.image.length}): ` +
        byType.image.map(i => i.title + (i.note ? ` — nota: ${i.note}` : '')).join(' / '));
    }

    if (byType.typography.length) {
      lines.push(`Tipografías: ` +
        byType.typography.map(i => `${i.title}${i.foundry ? ` (${i.foundry})` : ''}`).join(', '));
    }

    if (byType.palette.length) {
      lines.push(`Paletas: ` +
        byType.palette.map(i => `${i.title} [${i.colors?.join(', ')}]`).join(' / '));
    }

    if (byType.audio.length) {
      lines.push(`Audio: ` +
        byType.audio.map(i => i.title + (i.note ? ` — ${i.note}` : '')).join(', '));
    }

    if (byType.text.length) {
      lines.push(`Notas del creativo: ` +
        byType.text.map(i => i.note).filter(Boolean).join(' / '));
    }

    if (byType.link.length) {
      lines.push(`Links guardados: ` +
        byType.link.map(i => i.title).join(', '));
    }
  } else {
    lines.push('El cluster está vacío por ahora.');
  }

  lines.push('');
  lines.push('Usá este contexto para responder con relevancia a lo que el creativo está armando, pero no lo repitas literalmente — incorporalo de forma natural.');

  return lines.join('\n');
}
