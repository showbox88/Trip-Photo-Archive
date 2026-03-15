/**
 * Find the color for a named property (category/city) from a list.
 */
export function getPropertyColor(name, list) {
  const found = (list || []).find(it => (typeof it === 'string' ? it === name : it.name === name));
  return found?.color || found?.hex || '#60a5fa';
}
