// SKU Generation Utility

/**
 * Generates a unique SKU for a product.
 * Format: [CAT]-[NAME]-[RANDOM_SUFFIX]
 * e.g., Category: "Groceries", Name: "Sugar" -> GRO-SUG-A9B2
 */
export function generateSKU(name, category) {
  const cleanCategory = (category || 'GEN')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');

  const cleanName = (name || 'PRD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');

  const randomString = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()
    .padEnd(4, '0');

  return `${cleanCategory}-${cleanName}-${randomString}`;
}
