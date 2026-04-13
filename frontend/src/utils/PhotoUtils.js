export function safeParsePhotos(rawPhotos) {
  if (!rawPhotos) return [];
  if (Array.isArray(rawPhotos)) return rawPhotos;
  if (typeof rawPhotos !== 'string') return [];

  try {
    let parsed = JSON.parse(rawPhotos);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}